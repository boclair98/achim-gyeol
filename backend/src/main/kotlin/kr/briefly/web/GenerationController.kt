package kr.briefly.web

import kr.briefly.service.GenerationResult
import kr.briefly.service.NewsBriefingGenerator
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

@RestController
@RequestMapping("/api/admin/briefings")
class GenerationController(
    private val generator: NewsBriefingGenerator,
    @Value("\${app.pipeline.admin-token:}") private val adminToken: String,
) {
    @PostMapping("/generate")
    fun generate(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): GenerationResult {
        if (adminToken.isBlank()) throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "관리자 생성 기능이 비활성화되어 있습니다")
        if (!secureEquals(adminToken, suppliedToken.orEmpty())) throw ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 토큰이 올바르지 않습니다")
        return generator.generate()
    }

    private fun secureEquals(expected: String, actual: String): Boolean = MessageDigest.isEqual(
        expected.toByteArray(StandardCharsets.UTF_8),
        actual.toByteArray(StandardCharsets.UTF_8),
    )
}
