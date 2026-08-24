package kr.briefly.web

import kr.briefly.service.GenerationJobSnapshot
import kr.briefly.service.BriefingService
import kr.briefly.service.MorningGenerationJob
import kr.briefly.service.PushDeliverySummary
import kr.briefly.service.ActiveSubscriptionStatus
import kr.briefly.service.SubscriptionMetricsService
import kr.briefly.service.WebPushService
import kr.briefly.service.WelcomePreviewStatus
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
data class MorningStatusResponse(val date: LocalDate?, val coverageReady: Boolean, val productionReady: Boolean, val stories: Int, val categories: Int, val minimumStories: Int, val minimumCategories: Int, val blockReasons: List<String>, val activeSubscriptions: Int, val generationJob: GenerationJobSnapshot)
data class OperatorTestRequest(val expectedActiveSubscriptions: Int)
data class WelcomePreviewRequest(val expectedNewSubscriptions: Int, val expectedTotalSubscriptions: Int)
data class ForceRegenerationRequest(val expectedBriefingDate: LocalDate)
data class ForceDispatchRequest(val expectedBriefingDate: LocalDate, val expectedActiveSubscriptions: Int)

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
        val current = briefingService.buildStatus(today)
        return if (current?.productionReady == true) generationJob.status()
        else generationJob.start(today)
    }

    @PostMapping("/regenerate")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun regenerate(
        @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?,
        @RequestBody request: ForceRegenerationRequest,
    ): GenerationJobSnapshot {
        adminAuthorizer.authorize(suppliedToken)
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
        require(request.expectedBriefingDate == today) {
            "강제 재생성 기준일이 오늘과 다릅니다. 예상 ${request.expectedBriefingDate}, 오늘 $today"
        }
        return generationJob.start(today, force = true)
    }

    @PostMapping("/dispatch")
    fun dispatch(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.deliverDueBriefings()
    }

    @PostMapping("/dispatch-all")
    fun dispatchAll(
        @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?,
        @RequestBody request: ForceDispatchRequest,
    ): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.deliverLatestToAll(
            request.expectedBriefingDate,
            request.expectedActiveSubscriptions,
        )
    }

    @PostMapping("/test-push")
    fun testPush(
        @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?,
        @RequestBody request: OperatorTestRequest,
    ): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.sendOperatorTestToActive(request.expectedActiveSubscriptions)
    }

    @GetMapping("/welcome-preview")
    fun welcomePreviewStatus(
        @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?,
    ): WelcomePreviewStatus {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.welcomePreviewStatus()
    }

    @PostMapping("/welcome-preview")
    fun welcomePreview(
        @RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?,
        @RequestBody request: WelcomePreviewRequest,
    ): PushDeliverySummary {
        adminAuthorizer.authorize(suppliedToken)
        return webPushService.sendWelcomePreview(request.expectedNewSubscriptions, request.expectedTotalSubscriptions)
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
        val current = briefingService.buildStatus(today)
        return if (current?.productionReady == true) {
            MorningRunResult(false, generationJob.status(), webPushService.deliverDueBriefings())
        } else {
            MorningRunResult(true, generationJob.start(today), null)
        }
    }

    @GetMapping("/status")
    fun status(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): MorningStatusResponse {
        adminAuthorizer.authorize(suppliedToken)
        val current = briefingService.buildStatus(LocalDate.now(ZoneId.of("Asia/Seoul")))
        return MorningStatusResponse(
            date = current?.briefingDate,
            coverageReady = current?.coverageReady == true,
            productionReady = current?.productionReady == true,
            stories = current?.stories ?: 0,
            categories = current?.categories ?: 0,
            minimumStories = current?.minimumStories ?: 0,
            minimumCategories = current?.minimumCategories ?: 0,
            blockReasons = current?.blockReasons ?: listOf("오늘 브리핑이 없습니다"),
            activeSubscriptions = webPushService.activeSubscriptionCount(),
            generationJob = generationJob.status(),
        )
    }

    @GetMapping("/subscriptions")
    fun subscriptions(@RequestHeader("X-Briefing-Admin-Token", required = false) suppliedToken: String?): ActiveSubscriptionStatus {
        adminAuthorizer.authorize(suppliedToken)
        return subscriptionMetricsService.current()
    }

}
