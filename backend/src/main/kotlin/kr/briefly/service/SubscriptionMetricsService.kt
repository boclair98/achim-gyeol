package kr.briefly.service

import kr.briefly.domain.SubscriptionMetricSnapshot
import kr.briefly.domain.PushSubscription
import kr.briefly.repository.PushSubscriptionRepository
import kr.briefly.repository.SubscriptionMetricSnapshotRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

data class ActiveSubscriptionStatus(
    val activeSubscriptions: Int,
    val lastChangedAt: OffsetDateTime?,
    val lastChangeReason: String?,
    val deviceBreakdown: List<ActiveDeviceBreakdown> = emptyList(),
    val activeDevices: List<ActiveDeviceDetail> = emptyList(),
)

data class ActiveDeviceBreakdown(
    val deviceType: String,
    val browser: String,
    val count: Int,
)

data class ActiveDeviceDetail(
    val deviceType: String,
    val browser: String,
    val registeredAt: OffsetDateTime,
    val lastUpdatedAt: OffsetDateTime,
    val lastSentAt: OffsetDateTime?,
)

internal data class DeviceClient(val deviceType: String, val browser: String)

internal fun classifyDeviceClient(userAgent: String?): DeviceClient {
    val agent = userAgent.orEmpty()
    val deviceType = when {
        "iPhone" in agent || "iPad" in agent || "iPod" in agent -> "iPhone/iPad"
        "Android" in agent && Regex("\\bSM-[A-Z0-9-]+", RegexOption.IGNORE_CASE).containsMatchIn(agent) -> "Galaxy/Android"
        "Android" in agent -> "Android"
        "Windows" in agent -> "Windows PC"
        "Macintosh" in agent || "Mac OS X" in agent -> "macOS"
        "Linux" in agent -> "Linux PC"
        else -> "알 수 없음"
    }
    val browser = when {
        "SamsungBrowser" in agent -> "Samsung Internet"
        "EdgiOS" in agent || "EdgA" in agent || "Edg/" in agent -> "Edge"
        "CriOS" in agent || "Chrome/" in agent -> "Chrome"
        "FxiOS" in agent || "Firefox/" in agent -> "Firefox"
        "Safari/" in agent || deviceType == "iPhone/iPad" -> "Safari/PWA"
        agent.isBlank() -> "알 수 없음"
        else -> "기타 브라우저"
    }
    return DeviceClient(deviceType, browser)
}

@Service
class SubscriptionMetricsService(
    private val subscriptionRepository: PushSubscriptionRepository,
    private val snapshotRepository: SubscriptionMetricSnapshotRepository,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun recordIfChanged(reason: String): ActiveSubscriptionStatus {
        val activeSubscriptions = subscriptionRepository.countByActiveTrue().toInt()
        val latest = snapshotRepository.findFirstByOrderByCapturedAtDesc()
        val changed = latest?.activeSubscriptions != activeSubscriptions
        val snapshot = if (changed) {
            snapshotRepository.save(
                SubscriptionMetricSnapshot(
                    activeSubscriptions = activeSubscriptions,
                    reason = reason.take(64),
                ),
            )
        } else {
            latest
        }
        logger.info(
            "Active push subscription metric: count={}, reason={}, changed={}",
            activeSubscriptions,
            reason,
            changed,
        )
        return snapshot.toStatus(activeSubscriptions)
    }

    @Transactional(readOnly = true)
    fun current(): ActiveSubscriptionStatus {
        val subscriptions = subscriptionRepository.findAllByActiveTrue()
        val devices = subscriptions.sortedBy { it.createdAt }.map(::toDeviceDetail)
        val breakdown = devices.groupingBy { it.deviceType to it.browser }.eachCount()
            .map { (client, count) -> ActiveDeviceBreakdown(client.first, client.second, count) }
            .sortedWith(compareBy(ActiveDeviceBreakdown::deviceType, ActiveDeviceBreakdown::browser))
        return snapshotRepository.findFirstByOrderByCapturedAtDesc().toStatus(
            currentCount = subscriptions.size,
            breakdown = breakdown,
            devices = devices,
        )
    }

    private fun toDeviceDetail(subscription: PushSubscription): ActiveDeviceDetail {
        val client = classifyDeviceClient(subscription.userAgent)
        return ActiveDeviceDetail(
            deviceType = client.deviceType,
            browser = client.browser,
            registeredAt = subscription.createdAt,
            lastUpdatedAt = subscription.updatedAt,
            lastSentAt = subscription.lastSentAt,
        )
    }

    private fun SubscriptionMetricSnapshot?.toStatus(
        currentCount: Int,
        breakdown: List<ActiveDeviceBreakdown> = emptyList(),
        devices: List<ActiveDeviceDetail> = emptyList(),
    ) = ActiveSubscriptionStatus(
        activeSubscriptions = currentCount,
        lastChangedAt = this?.capturedAt,
        lastChangeReason = this?.reason,
        deviceBreakdown = breakdown,
        activeDevices = devices,
    )
}

@Component
class SubscriptionMetricsInitializer(
    private val metricsService: SubscriptionMetricsService,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        metricsService.recordIfChanged("STARTUP_BASELINE")
    }
}
