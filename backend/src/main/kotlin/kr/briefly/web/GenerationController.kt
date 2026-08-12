package kr.briefly.web

import kr.briefly.service.GenerationJobSnapshot
import kr.briefly.service.BriefingService
import kr.briefly.service.MorningGenerationJob
import kr.briefly.service.PushDeliverySummary
import kr.briefly.service.ActiveSubscriptionStatus
import kr.briefly.service.SubscriptionMetricsService
import kr.briefly.service.WebPushService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.time.ZoneId

data class MorningRunResult(val generationStarted: Boolean, val generationJob: GenerationJobSnapshot, val delivery: PushDeliverySummary?)
data class MorningStatusResponse(val date: LocalDate?, val productionReady: Boolean, val stories: Int, val activeSubscriptions: Int, val generationJob: GenerationJobSnapshot)
data class OperatorTestRequest(val expectedActiveSubscriptions: Int)

@RestController
@RequestMapping("/api/admin/briefings")
class GenerationController(
    private val generationJob: MorningGenerationJob,
    private val briefingService: BriefingService,
    private val webPushService: WebPushService,
    private val subscriptionMetricsService: SubscriptionMetricsService,
    private val adminAuthorizer: AdminAuthorizer,
) {
    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun generate(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): GenerationJobSnapshot {
        adminAuthorizer.authorize(suppliedToken)
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
        val current = runCatching { briefingService.latest() }.getOrNull()
        return if (current?.briefingDate == today && current.productionReady) generationJob.status() else generationJob.start(today)
    }

    @PostMapping("/dispatch")
    fun dispatch(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.deliverDueBriefings()
    }

    @PostMapping("/test-push")
    fun testPush(
        @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?,
        @RequestBody request: OperatorTestRequest,
    ): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.sendOperatorTestToActive(request.expectedActiveSubscriptions)
    }

    @PostMapping("/retry-failed/{editionId}")
    fun retryFailed(@PathVariable editionId: Long, @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.retryFailedDeliveries(editionId)
    }

    @PostMapping("/run")
    fun runMorning(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): MorningRunResult {
        adminAuthorizer.authorize(suppliedToken)
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
        val current = runCatching { briefingService.latest() }.getOrNull()
        return if (current?.briefingDate == today && current.productionReady) {
            MorningRunResult(false, generationJob.status(), webPushService.deliverDueBriefings())
        } else {
            MorningRunResult(true, generationJob.start(today), null)
        }
    }

    @GetMapping("/status")
    fun status(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): MorningStatusResponse {
        adminAuthorizer.authorize(suppliedToken)
        val current = runCatching { briefingService.latest() }.getOrNull()
        return MorningStatusResponse(current?.briefingDate, current?.productionReady == true, current?.stories?.size ?: 0, webPushService.activeSubscriptionCount(), generationJob.status())
    }

    @GetMapping("/subscriptions")
    fun subscriptions(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): ActiveSubscriptionStatus {
        adminAuthorizer.authorize(suppliedToken)
        return subscriptionMetricsService.current()
    }

}
