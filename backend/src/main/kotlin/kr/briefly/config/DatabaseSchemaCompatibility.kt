package kr.briefly.config

import kr.briefly.domain.Category
import kr.briefly.domain.FeedbackType
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

        val allowedCategories = enumCheckValues(Category.entries.map { it.name })
        jdbcTemplate.execute(
            "ALTER TABLE news_stories DROP CONSTRAINT IF EXISTS news_stories_category_check",
        )
        jdbcTemplate.execute(
            "ALTER TABLE news_stories ADD CONSTRAINT news_stories_category_check " +
                "CHECK (category IN ($allowedCategories))",
        )
        log.info("Synchronized news_stories category constraint: {}", Category.entries.joinToString { it.name })

        val allowedFeedbackTypes = enumCheckValues(FeedbackType.entries.map { it.name })
        jdbcTemplate.execute(
            "ALTER TABLE story_feedback DROP CONSTRAINT IF EXISTS story_feedback_type_check",
        )
        jdbcTemplate.execute(
            "ALTER TABLE story_feedback ADD CONSTRAINT story_feedback_type_check " +
                "CHECK (type IN ($allowedFeedbackTypes))",
        )
        log.info("Synchronized story_feedback type constraint: {}", FeedbackType.entries.joinToString { it.name })
    }
}

internal fun enumCheckValues(values: List<String>): String = values.joinToString(", ") { "'$it'" }
