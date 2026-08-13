package kr.briefly.config

import kr.briefly.domain.Category
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class DatabaseSchemaCompatibility(private val jdbcTemplate: JdbcTemplate) : ApplicationRunner {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    override fun run(args: ApplicationArguments) {
        val isPostgres = jdbcTemplate.dataSource?.connection?.use { connection ->
            connection.metaData.databaseProductName.contains("PostgreSQL", ignoreCase = true)
        } == true
        if (!isPostgres) return

        val allowedCategories = Category.entries.joinToString(", ") { "'${it.name}'" }
        jdbcTemplate.execute(
            "ALTER TABLE news_stories DROP CONSTRAINT IF EXISTS news_stories_category_check",
        )
        jdbcTemplate.execute(
            "ALTER TABLE news_stories ADD CONSTRAINT news_stories_category_check " +
                "CHECK (category IN ($allowedCategories))",
        )
        log.info("Synchronized news_stories category constraint: {}", Category.entries.joinToString { it.name })
    }
}
