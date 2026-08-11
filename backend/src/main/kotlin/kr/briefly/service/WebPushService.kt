package kr.briefly.service

import kr.briefly.domain.PushSubscription
import kr.briefly.repository.PushSubscriptionRepository
import nl.martijndwars.webpush.Notification
import nl.martijndwars.webpush.PushService
import nl.martijndwars.webpush.Urgency
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.Security
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.zone.ZoneRulesException

data class PushKeys(val p256dh: String, val auth: String)
data class PushRegistration(
    val endpoint: String,
    val keys: PushKeys,
    val timezone: String,
    val deliveryHour: Int,
    val deliveryMinute: Int,
    val weekdays: Set<Int>,
    val userAgent: String?,
)
data class PushConfigResponse(val enabled: Boolean, val publicKey: String)
data class PushResult(val delivered: Boolean, val message: String)

internal fun deliveryWeekdayIndex(dayOfWeek: DayOfWeek): Int = dayOfWeek.value - 1
internal fun deliveryIsDue(current: LocalTime, scheduled: LocalTime): Boolean = !current.isBefore(scheduled)

@Service
class WebPushService(
    private val repository: PushSubscriptionRepository,
    private val briefingService: BriefingService,
    @Value("\${app.push.enabled:false}") private val enabled: Boolean,
    @Value("\${app.push.public-key:}") private val publicKey: String,
    @Value("\${app.push.private-key:}") private val privateKey: String,
    @Value("\${app.push.subject:https://morningnews.coders.kr}") private val subject: String,
    @Value("\${app.push.public-url:https://morningnews.coders.kr}") private val publicUrl: String,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val mapper = jacksonObjectMapper()

    init {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) Security.addProvider(BouncyCastleProvider())
    }

    fun config() = PushConfigResponse(isConfigured(), if (isConfigured()) publicKey else "")

    @Transactional
    fun subscribe(ownerId: String, registration: PushRegistration): PushSubscription {
        requireConfigured()
        require(registration.endpoint.startsWith("https://")) { "올바른 푸시 구독 주소가 아닙니다." }
        require(registration.deliveryHour in 0..23 && registration.deliveryMinute in 0..59) { "발송 시간이 올바르지 않습니다." }
        require(registration.weekdays.isNotEmpty() && registration.weekdays.all { it in 0..6 }) { "발송 요일이 올바르지 않습니다." }
        try { ZoneId.of(registration.timezone) } catch (_: ZoneRulesException) { throw IllegalArgumentException("시간대가 올바르지 않습니다.") }

        val hash = endpointHash(registration.endpoint)
        val subscription = repository.findByEndpointHash(hash) ?: PushSubscription(
            ownerId = ownerId,
            endpointHash = hash,
            endpoint = registration.endpoint,
            p256dh = registration.keys.p256dh,
            auth = registration.keys.auth,
        )
        subscription.ownerId = ownerId
        subscription.endpoint = registration.endpoint
        subscription.p256dh = registration.keys.p256dh
        subscription.auth = registration.keys.auth
        subscription.timezone = registration.timezone
        subscription.deliveryHour = registration.deliveryHour
        subscription.deliveryMinute = registration.deliveryMinute
        subscription.weekdays = registration.weekdays.sorted().joinToString(",")
        subscription.userAgent = registration.userAgent?.take(500)
        subscription.active = true
        subscription.updatedAt = OffsetDateTime.now()
        subscription.lastError = null
        return repository.save(subscription)
    }

    @Transactional
    fun unsubscribe(ownerId: String, endpoint: String) {
        repository.findByEndpointHash(endpointHash(endpoint))?.takeIf { it.ownerId == ownerId }?.let {
            it.active = false
            it.updatedAt = OffsetDateTime.now()
            repository.save(it)
        }
    }

    @Transactional
    fun sendTest(ownerId: String, endpoint: String): PushResult {
        requireConfigured()
        val subscription = repository.findByEndpointHash(endpointHash(endpoint))
            ?.takeIf { it.active && it.ownerId == ownerId } ?: return PushResult(false, "이 계정의 활성 구독을 찾을 수 없습니다.")
        val briefing = runCatching { briefingService.latest() }.getOrNull()
        val count = briefing?.stories?.size ?: 0
        return send(
            subscription,
            title = "아침결 · 테스트 뉴스가 도착했어요",
            body = if (count > 0) "오늘의 핵심 뉴스 ${count}건을 카드로 확인해 보세요." else "웹푸시 연결이 정상적으로 완료됐어요.",
            test = true,
        )
    }

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    fun deliverScheduledBriefings() {
        if (!isConfigured()) return
        val briefing = runCatching { briefingService.latest() }.getOrElse {
            logger.info("Push delivery skipped: briefing is not available")
            return
        }
        if (briefing.briefingDate != LocalDate.now(ZoneId.of("Asia/Seoul")) || !briefing.productionReady) {
            logger.info("Push delivery skipped: today's pipeline-generated briefing is not ready")
            return
        }
        repository.findAllByActiveTrue().forEach { subscription ->
            val zone = runCatching { ZoneId.of(subscription.timezone) }.getOrDefault(ZoneId.of("Asia/Seoul"))
            val now = OffsetDateTime.now(zone)
            val weekday = deliveryWeekdayIndex(now.dayOfWeek)
            val scheduledDays = subscription.weekdays.split(',').mapNotNull(String::toIntOrNull).toSet()
            val alreadySentToday = subscription.lastSentAt?.atZoneSameInstant(zone)?.toLocalDate() == now.toLocalDate()
            val scheduledTime = LocalTime.of(subscription.deliveryHour, subscription.deliveryMinute)
            if (deliveryIsDue(now.toLocalTime(), scheduledTime) && weekday in scheduledDays && !alreadySentToday) {
                send(subscription, "아침결 · 어제 뉴스 종합이 도착했어요", "어제 핵심 뉴스 ${briefing.stories.size}건 · 약 ${briefing.readMinutes}분", false)
            }
        }
    }

    private fun send(subscription: PushSubscription, title: String, body: String, test: Boolean): PushResult = try {
        val payload = mapper.writeValueAsString(mapOf(
            "title" to title,
            "body" to body,
            "url" to "${publicUrl.trimEnd('/')}/#delivery-deck",
            "tag" to if (test) "achim-gyeol-test" else "achim-gyeol-daily",
        ))
        val notification = Notification(subscription.endpoint, subscription.p256dh, subscription.auth, payload, Urgency.NORMAL)
        val response = PushService(publicKey, privateKey, subject).send(notification)
        val status = response.statusLine.statusCode
        if (status in 200..299) {
            // An operator test proves the device connection only. It must not consume
            // the subscriber's once-per-day production delivery slot.
            if (!test) subscription.lastSentAt = OffsetDateTime.now()
            subscription.lastError = null
            repository.save(subscription)
            PushResult(true, "푸시 알림을 발송했습니다.")
        } else {
            if (status == 404 || status == 410) subscription.active = false
            subscription.lastError = "Push provider returned HTTP $status"
            repository.save(subscription)
            PushResult(false, "푸시 제공자가 발송을 거절했습니다. (HTTP $status)")
        }
    } catch (exception: Exception) {
        logger.warn("Web push delivery failed: {}", exception.message)
        subscription.lastError = exception.message?.take(600)
        repository.save(subscription)
        PushResult(false, "푸시 발송 중 오류가 발생했습니다.")
    }

    private fun isConfigured() = enabled && publicKey.isNotBlank() && privateKey.isNotBlank()
    private fun requireConfigured() = check(isConfigured()) { "웹푸시가 아직 설정되지 않았습니다." }

    companion object {
        fun endpointHash(endpoint: String): String = MessageDigest.getInstance("SHA-256")
            .digest(endpoint.toByteArray(StandardCharsets.UTF_8)).joinToString("") { "%02x".format(it) }
    }
}
