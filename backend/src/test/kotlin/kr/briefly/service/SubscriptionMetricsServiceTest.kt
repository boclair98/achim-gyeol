package kr.briefly.service

import kr.briefly.domain.SubscriptionMetricSnapshot
import kr.briefly.domain.PushSubscription
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

    @Test
    fun `classifies common mobile clients without exposing the raw user agent`() {
        assertThat(classifyDeviceClient("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"))
            .isEqualTo(DeviceClient("iPhone/iPad", "Safari/PWA"))
        assertThat(classifyDeviceClient("Mozilla/5.0 (Linux; Android 15; SM-S938N) AppleWebKit/537.36 Chrome/130.0 SamsungBrowser/27.0"))
            .isEqualTo(DeviceClient("Galaxy/Android", "Samsung Internet"))
        assertThat(classifyDeviceClient("Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0"))
            .isEqualTo(DeviceClient("Android", "Chrome"))
    }

    @Test
    fun `returns privacy-safe active device details and grouped counts`() {
        val iphone = subscription("iphone", "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Safari/604.1")
        val galaxy = subscription("galaxy", "Mozilla/5.0 (Linux; Android 15; SM-S938N) Chrome/130.0")
        Mockito.`when`(subscriptionRepository.findAllByActiveTrue()).thenReturn(listOf(iphone, galaxy))
        Mockito.`when`(snapshotRepository.findFirstByOrderByCapturedAtDesc()).thenReturn(null)

        val status = service.current()

        assertThat(status.activeSubscriptions).isEqualTo(2)
        assertThat(status.deviceBreakdown).containsExactly(
            ActiveDeviceBreakdown("Galaxy/Android", "Chrome", 1),
            ActiveDeviceBreakdown("iPhone/iPad", "Safari/PWA", 1),
        )
        assertThat(status.activeDevices).allSatisfy {
            assertThat(it.deviceType).isNotBlank()
            assertThat(it.browser).isNotBlank()
        }
    }

    private fun subscription(suffix: String, userAgent: String) = PushSubscription(
        ownerId = "owner-$suffix",
        endpointHash = suffix.padEnd(64, '0'),
        endpoint = "https://push.example/$suffix",
        p256dh = "p256dh",
        auth = "auth",
        userAgent = userAgent,
    )
}
