package kr.briefly.integration

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.util.HtmlUtils
import java.io.InputStream
import java.net.InetAddress
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.util.Optional
import java.util.concurrent.ConcurrentHashMap

data class ResolvedArticleImage(val url: String, val publisher: String)

interface ArticleImageResolver {
    fun resolve(articles: List<CollectedArticle>): ResolvedArticleImage?
}

@Component
class OpenGraphArticleImageResolver(
    @Value("\${app.pipeline.image-discovery.connect-timeout-seconds:5}") connectTimeoutSeconds: Long,
    @Value("\${app.pipeline.image-discovery.request-timeout-seconds:7}") private val requestTimeoutSeconds: Long,
    @Value("\${app.pipeline.image-discovery.max-source-pages:4}") private val maxSourcePages: Int,
) : ArticleImageResolver {
    private val log = LoggerFactory.getLogger(javaClass)
    private val client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(connectTimeoutSeconds.coerceIn(2, 15)))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build()
    private val cache = ConcurrentHashMap<String, Optional<String>>()

    override fun resolve(articles: List<CollectedArticle>): ResolvedArticleImage? {
        articles.distinctBy(CollectedArticle::originalUrl)
            .take(maxSourcePages.coerceIn(1, 6))
            .forEach { article ->
                val imageUrl = cache.computeIfAbsent(article.originalUrl) {
                    Optional.ofNullable(resolveForArticle(article))
                }.orElse(null)
                if (imageUrl != null) return ResolvedArticleImage(imageUrl, article.publisher)
            }
        return null
    }

    private fun resolveForArticle(article: CollectedArticle): String? {
        val candidates = buildList {
            article.imageUrl?.takeIf(String::isNotBlank)?.let(::add)
            val articleUri = runCatching { URI(article.originalUrl) }.getOrNull()
            if (articleUri != null) addAll(discoverImageCandidates(articleUri))
        }.distinct()
        return candidates.firstOrNull(::isReachableImage)
    }

    private fun discoverImageCandidates(articleUri: URI): List<String> {
        val page = fetch(articleUri, "text/html,application/xhtml+xml", maxBytes = 640 * 1024) ?: return emptyList()
        if (!page.contentType.lowercase().contains("html")) return emptyList()
        val html = page.bytes.toString(Charsets.UTF_8)
        return extractRepresentativeImageUrls(html, page.uri)
    }

    private fun isReachableImage(value: String): Boolean {
        val uri = runCatching { URI(value) }.getOrNull() ?: return false
        val response = fetch(uri, "image/avif,image/webp,image/jpeg,image/png,image/*", maxBytes = 64) ?: return false
        return response.contentType.lowercase().startsWith("image/") && response.bytes.isNotEmpty()
    }

    private fun fetch(start: URI, accept: String, maxBytes: Int): FetchResult? {
        var current = start
        repeat(4) {
            if (!isPublicHttpUri(current)) return null
            val request = HttpRequest.newBuilder(current)
                .timeout(Duration.ofSeconds(requestTimeoutSeconds.coerceIn(3, 20)))
                .header("Accept", accept)
                .header("User-Agent", "AchimgyeolNewsImage/1.0")
                .GET()
                .build()
            val response = runCatching { client.send(request, HttpResponse.BodyHandlers.ofInputStream()) }
                .onFailure { log.debug("News image discovery failed for {}: {}", current.host, it.message) }
                .getOrNull() ?: return null
            response.body().use { body ->
                if (response.statusCode() in 300..399) {
                    val location = response.headers().firstValue("location").orElse(null) ?: return null
                    current = runCatching { current.resolve(location) }.getOrNull() ?: return null
                } else {
                    if (response.statusCode() !in 200..299) return null
                    val contentType = response.headers().firstValue("content-type").orElse("")
                    return FetchResult(current, contentType, body.readUpTo(maxBytes))
                }
            }
        }
        return null
    }

    private fun InputStream.readUpTo(maxBytes: Int): ByteArray = readNBytes(maxBytes.coerceAtLeast(1))
}

private data class FetchResult(val uri: URI, val contentType: String, val bytes: ByteArray)

internal fun extractRepresentativeImageUrls(html: String, baseUri: URI): List<String> {
    val metaCandidates = metaTagRegex.findAll(html).mapNotNull { match ->
        val attributes = htmlAttributeRegex.findAll(match.value).associate { attribute ->
            attribute.groupValues[1].lowercase() to HtmlUtils.htmlUnescape(attribute.groupValues[3].trim())
        }
        val key = attributes["property"]?.lowercase() ?: attributes["name"]?.lowercase()
        val priority = when (key) {
            "og:image:secure_url" -> 0
            "og:image" -> 1
            "twitter:image", "twitter:image:src" -> 2
            else -> return@mapNotNull null
        }
        val content = attributes["content"].orEmpty()
        priority to content
    }
    val linkCandidates = linkTagRegex.findAll(html).mapNotNull { match ->
        val attributes = htmlAttributeRegex.findAll(match.value).associate { attribute ->
            attribute.groupValues[1].lowercase() to HtmlUtils.htmlUnescape(attribute.groupValues[3].trim())
        }
        if (attributes["rel"]?.lowercase() != "image_src") return@mapNotNull null
        3 to attributes["href"].orEmpty()
    }
    return (metaCandidates + linkCandidates)
        .sortedBy { it.first }
        .mapNotNull { (_, value) ->
            runCatching { baseUri.resolve(value) }.getOrNull()
                ?.takeIf(::isHttpUri)
                ?.toString()
        }
        .distinct()
        .take(8)
        .toList()
}

internal fun isPublicHttpUri(uri: URI): Boolean {
    if (!isHttpUri(uri)) return false
    val host = uri.host?.lowercase()?.trimEnd('.') ?: return false
    if (host == "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false
    val addresses = runCatching { InetAddress.getAllByName(host).toList() }.getOrNull() ?: return false
    return addresses.isNotEmpty() && addresses.all { address ->
        !address.isAnyLocalAddress && !address.isLoopbackAddress && !address.isLinkLocalAddress &&
            !address.isSiteLocalAddress && !address.isMulticastAddress
    }
}

private fun isHttpUri(uri: URI): Boolean = uri.scheme?.lowercase() in setOf("http", "https") && !uri.host.isNullOrBlank()

private val metaTagRegex = Regex("<meta\\b[^>]*>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
private val linkTagRegex = Regex("<link\\b[^>]*>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
private val htmlAttributeRegex = Regex("""([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*([\"'])(.*?)\2""", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
