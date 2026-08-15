package kr.briefly.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class RequestRateLimitFilterTest {
    @Test
    fun `limits requests inside a rolling minute and allows them after expiry`() {
        val filter = RequestRateLimitFilter(publicWriteLimit = 2, adminLimit = 2)

        assertThat(filter.allow("public:device", 2, now = 1_000)).isTrue()
        assertThat(filter.allow("public:device", 2, now = 2_000)).isTrue()
        assertThat(filter.allow("public:device", 2, now = 3_000)).isFalse()
        assertThat(filter.allow("public:device", 2, now = 62_001)).isTrue()
    }

    @Test
    fun `keeps independent clients isolated`() {
        val filter = RequestRateLimitFilter(publicWriteLimit = 1, adminLimit = 1)

        assertThat(filter.allow("client-a", 1, now = 1_000)).isTrue()
        assertThat(filter.allow("client-a", 1, now = 1_001)).isFalse()
        assertThat(filter.allow("client-b", 1, now = 1_001)).isTrue()
    }
}
