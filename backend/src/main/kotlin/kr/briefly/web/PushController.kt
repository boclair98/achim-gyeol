package kr.briefly.web

import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import kr.briefly.service.PushKeys
import kr.briefly.service.PushRegistration
import kr.briefly.service.WebPushService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

data class PushKeysRequest(@field:NotBlank @field:Size(max = 255) val p256dh: String, @field:NotBlank @field:Size(max = 255) val auth: String)
data class PushSubscriptionRequest(
    @field:NotBlank @field:Size(max = 3000) val endpoint: String,
    @field:Valid val keys: PushKeysRequest,
    @field:NotBlank @field:Size(max = 64) val timezone: String = "Asia/Seoul",
    @field:Min(0) @field:Max(23) val deliveryHour: Int = 7,
    @field:Min(0) @field:Max(59) val deliveryMinute: Int = 0,
    @field:Size(min = 1, max = 7) val weekdays: Set<Int> = setOf(0, 1, 2, 3, 4),
)
data class PushEndpointRequest(@field:NotBlank @field:Size(max = 3000) val endpoint: String)

@RestController
@RequestMapping("/api/push")
class PushController(private val webPushService: WebPushService) {
    @GetMapping("/session")
    fun session(@RequestHeader("X-Coders-User", required = false) user: String?) = mapOf("authenticated" to (user != null))

    @GetMapping("/public-key")
    fun publicKey() = webPushService.config()

    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.CREATED)
    fun subscribe(@Valid @RequestBody request: PushSubscriptionRequest, @RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("User-Agent", required = false) userAgent: String?) =
        webPushService.subscribe(requireUser(user), PushRegistration(
            endpoint = request.endpoint,
            keys = PushKeys(request.keys.p256dh, request.keys.auth),
            timezone = request.timezone,
            deliveryHour = request.deliveryHour,
            deliveryMinute = request.deliveryMinute,
            weekdays = request.weekdays,
            userAgent = userAgent,
        )).let { mapOf("subscribed" to true) }

    @DeleteMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unsubscribe(@Valid @RequestBody request: PushEndpointRequest, @RequestHeader("X-Coders-User", required = false) user: String?) = webPushService.unsubscribe(requireUser(user), request.endpoint)

    @PostMapping("/test")
    fun test(@Valid @RequestBody request: PushEndpointRequest, @RequestHeader("X-Coders-User", required = false) user: String?) = webPushService.sendTest(requireUser(user), request.endpoint)

    private fun requireUser(user: String?) = user ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "알림 등록에는 로그인이 필요합니다.")
}
