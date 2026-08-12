package kr.briefly.service

import kr.briefly.domain.SubscriptionMetricSnapshot
import kr.briefly.repository.PushSubscriptionRepository
import kr.briefly.repository.SubscriptionMetricSnapshotRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito

class SubscriptionMetricsServiceTest {
    private val subscriptionRepository = Mockito.mock(PushSubscriptionRepository::class.java)
    private val snapshotRepository = Mockito.mock(SubscriptionMetricSnapshotRepository::class.java)
    private val service = SubscriptionMetricsService(subscriptionRepository, snapshotRepository)

    @Test
    fun `stores an aggregate snapshot when the active count changes`() {
        Mockito.`when`(subscriptionRepository.countByActiveTrue()).thenReturn(2L)
        Mockito.`when`(snapshotRepository.findFirstByOrderByCapturedAtDesc()).thenReturn(null)
        Mockito.`when`(snapshotRepository.save(any(SubscriptionMetricSnapshot::class.java))).thenAnswer {
            it.getArgument<SubscriptionMetricSnapshot>(0)
        }

        val status = service.recordIfChanged("SUBSCRIPTION_REGISTERED")

        assertThat(status.activeSubscriptions).isEqualTo(2)
        assertThat(status.lastChangeReason).isEqualTo("SUBSCRIPTION_REGISTERED")
        Mockito.verify(snapshotRepository).save(any(SubscriptionMetricSnapshot::class.java))
    }

    @Test
    fun `does not create duplicate snapshots while the active count is unchanged`() {
        val latest = SubscriptionMetricSnapshot(activeSubscriptions = 2, reason = "SUBSCRIPTION_REGISTERED")
        Mockito.`when`(subscriptionRepository.countByActiveTrue()).thenReturn(2L)
        Mockito.`when`(snapshotRepository.findFirstByOrderByCapturedAtDesc()).thenReturn(latest)

        val status = service.recordIfChanged("STARTUP_BASELINE")

        assertThat(status.activeSubscriptions).isEqualTo(2)
        assertThat(status.lastChangeReason).isEqualTo("SUBSCRIPTION_REGISTERED")
        Mockito.verify(snapshotRepository, Mockito.never()).save(any(SubscriptionMetricSnapshot::class.java))
    }
}
