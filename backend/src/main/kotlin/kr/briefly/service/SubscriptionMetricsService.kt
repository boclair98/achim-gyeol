package kr.briefly.service

import kr.briefly.domain.SubscriptionMetricSnapshot
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
)

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
        val activeSubscriptions = subscriptionRepository.countByActiveTrue().toInt()
        return snapshotRepository.findFirstByOrderByCapturedAtDesc().toStatus(activeSubscriptions)
    }

    private fun SubscriptionMetricSnapshot?.toStatus(currentCount: Int) = ActiveSubscriptionStatus(
        activeSubscriptions = currentCount,
        lastChangedAt = this?.capturedAt,
        lastChangeReason = this?.reason,
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
