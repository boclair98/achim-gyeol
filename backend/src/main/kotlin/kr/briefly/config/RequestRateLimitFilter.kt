package kr.briefly.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.ArrayDeque
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

@Component
class RequestRateLimitFilter(
    @Value("\${app.security.public-write-limit-per-minute:30}") private val publicWriteLimit: Int,
    @Value("\${app.security.admin-limit-per-minute:60}") private val adminLimit: Int,
) : OncePerRequestFilter() {
    private val requests = ConcurrentHashMap<String, ArrayDeque<Long>>()
    private val requestCounter = AtomicLong()

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val adminRequest = request.requestURI.startsWith("/api/admin/")
        val publicWrite = request.requestURI.startsWith("/api/") && request.method.uppercase() in setOf("POST", "PUT", "PATCH", "DELETE")
        if (!adminRequest && !publicWrite) {
            filterChain.doFilter(request, response)
            return
        }

        val category = if (adminRequest) "admin" else "public-write"
        val limit = (if (adminRequest) adminLimit else publicWriteLimit).coerceAtLeast(1)
        val device = request.getHeader("X-Achim-Device")?.takeIf { it.length <= 64 }.orEmpty()
        val client = request.remoteAddr.orEmpty()
        val credentialScope = if (adminRequest) tokenFingerprint(request.getHeader("X-Briefing-Admin-Token")) else ""
        val key = "$category:$client:$device:$credentialScope"
        if (!allow(key, limit)) {
            response.status = 429
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.characterEncoding = Charsets.UTF_8.name()
            response.setHeader("Retry-After", "60")
            response.setHeader("Cache-Control", "no-store")
            response.writer.write("{\"message\":\"요청이 너무 많습니다. 1분 후 다시 시도해 주세요.\"}")
            return
        }
        filterChain.doFilter(request, response)
    }

    internal fun allow(key: String, limit: Int, now: Long = System.currentTimeMillis()): Boolean {
        val cutoff = now - 60_000
        val bucket = requests.computeIfAbsent(key) { ArrayDeque() }
        val accepted = synchronized(bucket) {
            while (bucket.isNotEmpty() && bucket.first() <= cutoff) bucket.removeFirst()
            if (bucket.size >= limit) false else true.also { bucket.addLast(now) }
        }
        if (requestCounter.incrementAndGet() % 1000L == 0L) {
            requests.entries.removeIf { (_, queue) -> synchronized(queue) { queue.isEmpty() || queue.last() <= cutoff } }
        }
        return accepted
    }

    private fun tokenFingerprint(token: String?): String = token?.takeIf(String::isNotBlank)?.let {
        MessageDigest.getInstance("SHA-256").digest(it.toByteArray(StandardCharsets.UTF_8))
            .take(8).joinToString("") { byte -> "%02x".format(byte) }
    } ?: "missing"
}
