package kr.briefly.web

import kr.briefly.service.GenerationResult
import kr.briefly.service.BriefingService
import kr.briefly.service.NewsBriefingGenerator
import kr.briefly.service.PushDeliverySummary
import kr.briefly.service.WebPushService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.LocalDate
import java.time.ZoneId

data class MorningRunResult(val generated: Boolean, val generation: GenerationResult?, val delivery: PushDeliverySummary)
data class MorningStatusResponse(val date: LocalDate?, val productionReady: Boolean, val stories: Int, val activeSubscriptions: Int)

@RestController
@RequestMapping("/api/admin/briefings")
class GenerationController(
    private val generator: NewsBriefingGenerator,
    private val briefingService: BriefingService,
    private val webPushService: WebPushService,
    @Value("\${app.pipeline.admin-token:}") private val adminToken: String,
) {
    @PostMapping("/generate")
    fun generate(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): GenerationResult {
        authorize(suppliedToken)
        return generator.generate(LocalDate.now(ZoneId.of("Asia/Seoul")))
    }

    @PostMapping("/dispatch")
    fun dispatch(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): PushDeliverySummary {
        authorize(suppliedToken)
        return webPushService.deliverDueBriefings()
    }

    @PostMapping("/run")
    fun runMorning(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): MorningRunResult {
        authorize(suppliedToken)
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
        val current = runCatching { briefingService.latest() }.getOrNull()
        val generation = if (current?.briefingDate != today || !current.productionReady) generator.generate(today) else null
        return MorningRunResult(generation != null, generation, webPushService.deliverDueBriefings())
    }

    @GetMapping("/status")
    fun status(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): MorningStatusResponse {
        authorize(suppliedToken)
        val current = runCatching { briefingService.latest() }.getOrNull()
        return MorningStatusResponse(current?.briefingDate, current?.productionReady == true, current?.stories?.size ?: 0, webPushService.activeSubscriptionCount())
    }

    private fun authorize(suppliedToken: String?) {
        if (adminToken.isBlank()) throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "관리자 생성 기능이 비활성화되어 있습니다")
        if (!secureEquals(adminToken, suppliedToken.orEmpty())) throw ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 토큰이 올바르지 않습니다")
    }

    private fun secureEquals(expected: String, actual: String): Boolean = MessageDigest.isEqual(
        expected.toByteArray(StandardCharsets.UTF_8),
        actual.toByteArray(StandardCharsets.UTF_8),
    )
}
