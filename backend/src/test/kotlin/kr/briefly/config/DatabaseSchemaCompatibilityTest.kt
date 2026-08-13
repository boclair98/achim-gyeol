package kr.briefly.config

import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.jdbc.core.JdbcTemplate

class DatabaseSchemaCompatibilityTest {
    @Test
    fun `PostgreSQL이 아닌 로컬 테스트 DB에는 운영 제약 DDL을 실행하지 않는다`() {
        val jdbcTemplate = mock(JdbcTemplate::class.java)

        DatabaseSchemaCompatibility(jdbcTemplate).run(DefaultApplicationArguments())

        verify(jdbcTemplate).dataSource
        verifyNoMoreInteractions(jdbcTemplate)
    }
}
