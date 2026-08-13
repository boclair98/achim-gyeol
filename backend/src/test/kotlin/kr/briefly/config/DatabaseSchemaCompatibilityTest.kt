package kr.briefly.config

import kr.briefly.domain.FeedbackType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.jdbc.core.JdbcTemplate

class DatabaseSchemaCompatibilityTest {
    @Test
    fun `피드백 제약조건에는 관심과 비관심 값이 모두 포함된다`() {
        val values = enumCheckValues(FeedbackType.entries.map { it.name })

        assertThat(values).contains("'INTERESTED'", "'NOT_INTERESTED'")
    }

    @Test
    fun `PostgreSQL이 아닌 로컬 테스트 DB에는 운영 제약 DDL을 실행하지 않는다`() {
        val jdbcTemplate = mock(JdbcTemplate::class.java)

        DatabaseSchemaCompatibility(jdbcTemplate).run(DefaultApplicationArguments())

        verify(jdbcTemplate).dataSource
        verifyNoMoreInteractions(jdbcTemplate)
    }
}
