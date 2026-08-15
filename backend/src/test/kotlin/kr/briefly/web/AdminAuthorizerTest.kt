package kr.briefly.web

import org.assertj.core.api.Assertions.assertThatCode
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.web.server.ResponseStatusException

class AdminAuthorizerTest {
    private val authorizer = AdminAuthorizer("current-secret", "previous-secret")

    @Test
    fun `accepts current and previous tokens during rotation`() {
        assertThatCode { authorizer.authorize("current-secret") }.doesNotThrowAnyException()
        assertThatCode { authorizer.authorize("previous-secret") }.doesNotThrowAnyException()
    }

    @Test
    fun `rejects missing and unknown tokens`() {
        assertThatThrownBy { authorizer.authorize(null) }.isInstanceOf(ResponseStatusException::class.java)
        assertThatThrownBy { authorizer.authorize("unknown") }.isInstanceOf(ResponseStatusException::class.java)
    }
}
