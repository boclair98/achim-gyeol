package kr.briefly.web

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.web.server.ResponseStatusException

class RequesterIdentityTest {
    private val standaloneIdentity = RequesterIdentity(trustCodersUserHeader = false)

    @Test
    fun `anonymous device UUID becomes a private subscription owner`() {
        val owner = standaloneIdentity.resolve(null, "123e4567-e89b-12d3-a456-426614174000")

        assertThat(owner).isEqualTo("device:123e4567-e89b-12d3-a456-426614174000")
    }

    @Test
    fun `platform identity remains supported when available`() {
        assertThat(RequesterIdentity(trustCodersUserHeader = true).resolve("reader-1", null)).isEqualTo("user:reader-1")
    }

    @Test
    fun `missing or malformed device identity is rejected`() {
        assertThatThrownBy { standaloneIdentity.resolve(null, "not-a-device") }
            .isInstanceOf(ResponseStatusException::class.java)
    }

    @Test
    fun `public briefing remains readable without a device identity`() {
        assertThat(standaloneIdentity.resolveOrNull(null, null)).isNull()
    }
}
