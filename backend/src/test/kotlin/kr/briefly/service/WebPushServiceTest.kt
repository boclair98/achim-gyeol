package kr.briefly.service

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.DayOfWeek
import java.time.LocalTime

class WebPushServiceTest {
    @Test
    fun `delivery weekday indexes follow the frontend Monday-first order`() {
        assertThat(deliveryWeekdayIndex(DayOfWeek.MONDAY)).isEqualTo(0)
        assertThat(deliveryWeekdayIndex(DayOfWeek.FRIDAY)).isEqualTo(4)
        assertThat(deliveryWeekdayIndex(DayOfWeek.SUNDAY)).isEqualTo(6)
    }

    @Test
    fun `a briefing is due only during the protected morning delivery window`() {
        val scheduled = LocalTime.of(7, 30)

        assertThat(deliveryIsDue(LocalTime.of(7, 29), scheduled)).isFalse()
        assertThat(deliveryIsDue(LocalTime.of(7, 30), scheduled)).isTrue()
        assertThat(deliveryIsDue(LocalTime.of(7, 48), scheduled)).isTrue()
        assertThat(deliveryIsDue(LocalTime.of(8, 0), scheduled)).isTrue()
        assertThat(deliveryIsDue(LocalTime.of(8, 1), scheduled)).isFalse()
    }

    @Test
    fun `only transient push provider statuses are retried`() {
        assertThat(pushStatusIsRetryable(408)).isTrue()
        assertThat(pushStatusIsRetryable(429)).isTrue()
        assertThat(pushStatusIsRetryable(503)).isTrue()
        assertThat(pushStatusIsRetryable(400)).isFalse()
        assertThat(pushStatusIsRetryable(404)).isFalse()
        assertThat(pushStatusIsRetryable(410)).isFalse()
    }

    @Test
    fun `invalid or expired subscriptions are deactivated for clean re-registration`() {
        assertThat(pushEndpointIsInvalid(400)).isTrue()
        assertThat(pushEndpointIsInvalid(401)).isTrue()
        assertThat(pushEndpointIsInvalid(403)).isTrue()
        assertThat(pushEndpointIsInvalid(404)).isTrue()
        assertThat(pushEndpointIsInvalid(410)).isTrue()
        assertThat(pushEndpointIsInvalid(429)).isFalse()
        assertThat(pushEndpointIsInvalid(503)).isFalse()
    }

    @Test
    fun `VAPID public key is derived from the configured private key`() {
        // P-256 scalar 1 maps to the standard curve generator point.
        val privateKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE"
        val expectedPublicKey = "BGsX0fLhLEJH-Lzm5WOkQPJ3A32BLeszoPShOUXYmMKWT-NC4v4af5uO5-tKfA-eFivOM1drMV7Oy7ZAaDe_UfU"

        val resolution = resolveVapidKey("mismatched-public-key", privateKey)

        assertThat(resolution.publicKey).isEqualTo(expectedPublicKey)
        assertThat(resolution.configuredPublicKeyMatchesPrivateKey).isFalse()
    }

    @Test
    fun `matching VAPID pair is recognized without padding`() {
        val privateKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE"
        val publicKey = "BGsX0fLhLEJH-Lzm5WOkQPJ3A32BLeszoPShOUXYmMKWT-NC4v4af5uO5-tKfA-eFivOM1drMV7Oy7ZAaDe_UfU"

        assertThat(resolveVapidKey("$publicKey=", privateKey).configuredPublicKeyMatchesPrivateKey).isTrue()
    }
}
