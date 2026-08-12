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
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component
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
data class PushDeliverySummary(
    val status: String,
    val activeSubscriptions: Int,
    val dueSubscriptions: Int,
    val delivered: Int,
    val failed: Int,
    val message: String,
)

internal fun deliveryWeekdayIndex(dayOfWeek: DayOfWeek): Int = dayOfWeek.value - 1
internal val fixedDeliveryTime: LocalTime = LocalTime.of(7, 30)
internal val lastDeliveryTime: LocalTime = LocalTime.of(8, 0)
internal fun deliveryIsDue(current: LocalTime, scheduled: LocalTime = fixedDeliveryTime): Boolean =
    !current.isBefore(scheduled) && !current.isAfter(lastDeliveryTime)

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
        // 아침결은 모든 독자에게 같은 한국 시간 기준 브리핑을 보냅니다.
        // 예전 프런트엔드가 임의 시간을 보내도 서버에서 07:30으로 정규화합니다.
        subscription.timezone = "Asia/Seoul"
        subscription.deliveryHour = fixedDeliveryTime.hour
        subscription.deliveryMinute = fixedDeliveryTime.minute
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
            title = "[운영자 테스트] 아침결 알림",
            body = if (count > 0) "연결 확인 완료 · 뉴스 카드 ${count}건을 열어볼 수 있어요." else "웹푸시 연결이 정상적으로 완료됐어요.",
            test = true,
        )
    }

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    fun deliverScheduledBriefings() {
        deliverDueBriefings()
    }

    @Transactional
    fun deliverDueBriefings(): PushDeliverySummary {
        if (!isConfigured()) return PushDeliverySummary("PUSH_DISABLED", 0, 0, 0, 0, "웹 푸시가 설정되지 않았습니다.")
        val briefing = runCatching { briefingService.latest() }.getOrElse {
            logger.info("Push delivery skipped: briefing is not available")
            return PushDeliverySummary("BRIEFING_UNAVAILABLE", repository.findAllByActiveTrue().size, 0, 0, 0, "발송할 브리핑이 없습니다.")
        }
        if (briefing.briefingDate != LocalDate.now(ZoneId.of("Asia/Seoul")) || !briefing.productionReady) {
            logger.info("Push delivery skipped: today's pipeline-generated briefing is not ready")
            return PushDeliverySummary("BRIEFING_NOT_READY", repository.findAllByActiveTrue().size, 0, 0, 0, "오늘의 실제 브리핑이 아직 준비되지 않았습니다.")
        }
        val subscriptions = repository.findAllByActiveTrue()
        var due = 0
        var delivered = 0
        var failed = 0
        subscriptions.forEach { subscription ->
            val zone = runCatching { ZoneId.of(subscription.timezone) }.getOrDefault(ZoneId.of("Asia/Seoul"))
            val now = OffsetDateTime.now(zone)
            val weekday = deliveryWeekdayIndex(now.dayOfWeek)
            val scheduledDays = subscription.weekdays.split(',').mapNotNull(String::toIntOrNull).toSet()
            val alreadySentToday = subscription.lastSentAt?.atZoneSameInstant(zone)?.toLocalDate() == now.toLocalDate()
            val scheduledTime = fixedDeliveryTime
            if (deliveryIsDue(now.toLocalTime(), scheduledTime) && weekday in scheduledDays && !alreadySentToday) {
                due += 1
                val lead = briefing.stories.firstOrNull()
                val body = lead?.let {
                    "핵심: ${it.title.take(38)} · 알아둘 것: ${it.whyItMatters.take(48)}"
                } ?: "어제 핵심 뉴스 ${briefing.stories.size}건 · 약 ${briefing.readMinutes}분"
                if (send(subscription, "아침결 · 오늘 알아야 할 뉴스 ${briefing.stories.size}건", body, false).delivered) delivered += 1 else failed += 1
            }
        }
        return PushDeliverySummary("COMPLETED", subscriptions.size, due, delivered, failed, "오늘 브리핑 발송 검사를 완료했습니다.")
    }

    fun activeSubscriptionCount(): Int = repository.findAllByActiveTrue().size

    @Transactional
    fun sendOperatorTestToActive(expectedActiveSubscriptions: Int): PushDeliverySummary {
        requireConfigured()
        val subscriptions = repository.findAllByActiveTrue()
        require(subscriptions.size == expectedActiveSubscriptions) {
            "등록 기기 수가 예상과 다릅니다. 예상 ${expectedActiveSubscriptions}대, 현재 ${subscriptions.size}대"
        }
        var delivered = 0
        var failed = 0
        subscriptions.forEach { subscription ->
            val result = send(
                subscription,
                title = "[운영자 테스트] 아침결 신뢰 브리핑",
                body = "한 줄 결론·확인된 핵심·근거 출처가 연결된 새 뉴스 카드를 확인해 보세요.",
                test = true,
            )
            if (result.delivered) delivered += 1 else failed += 1
        }
        return PushDeliverySummary(
            status = if (failed == 0) "TEST_COMPLETED" else "TEST_PARTIAL_FAILURE",
            activeSubscriptions = subscriptions.size,
            dueSubscriptions = subscriptions.size,
            delivered = delivered,
            failed = failed,
            message = "운영자 테스트 알림을 발송했습니다. 정기 브리핑 발송 기록에는 반영하지 않았습니다.",
        )
    }

    private fun send(subscription: PushSubscription, title: String, body: String, test: Boolean): PushResult = try {
        val payload = mapper.writeValueAsString(mapOf(
            "title" to title,
            "body" to body,
            "url" to "${publicUrl.trimEnd('/')}/briefing/",
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

@Component
class DefaultDeliveryTimeMigration(private val repository: PushSubscriptionRepository) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    override fun run(args: ApplicationArguments) {
        val migrated = repository.findAllByActiveTrue().filter {
            it.timezone != "Asia/Seoul" || it.deliveryHour != fixedDeliveryTime.hour || it.deliveryMinute != fixedDeliveryTime.minute
        }
        migrated.forEach {
            it.timezone = "Asia/Seoul"
            it.deliveryHour = fixedDeliveryTime.hour
            it.deliveryMinute = fixedDeliveryTime.minute
            it.updatedAt = OffsetDateTime.now()
        }
        if (migrated.isNotEmpty()) repository.saveAll(migrated)
        logger.info("Migrated {} push subscription(s) to the fixed 07:30 Asia/Seoul delivery", migrated.size)
    }
}
