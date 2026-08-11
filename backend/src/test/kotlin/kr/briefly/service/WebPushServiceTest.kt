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
    fun `a briefing remains due after the selected minute until it is delivered`() {
        val scheduled = LocalTime.of(7, 0)

        assertThat(deliveryIsDue(LocalTime.of(6, 59), scheduled)).isFalse()
        assertThat(deliveryIsDue(LocalTime.of(7, 0), scheduled)).isTrue()
        assertThat(deliveryIsDue(LocalTime.of(7, 12), scheduled)).isTrue()
    }
}
