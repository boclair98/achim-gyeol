package kr.briefly.service

import kr.briefly.integration.CollectedArticle
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime

class BalancedCoverageArticleSelectionTest {
    @Test
    fun `query results are interleaved and capped without duplicate urls`() {
        val first = listOf(article("a1"), article("shared"), article("a3"))
        val second = listOf(article("b1"), article("shared"), article("b3"))

        val selected = selectBalancedCoverageArticles(listOf(first, second), maxTotal = 5)

        assertThat(selected.map(CollectedArticle::originalUrl))
            .containsExactly("https://news.example/a1", "https://news.example/b1", "https://news.example/shared", "https://news.example/b3", "https://news.example/a3")
    }

    private fun article(id: String) = CollectedArticle(
        title = id,
        description = id,
        originalUrl = "https://news.example/$id",
        publishedAt = OffsetDateTime.parse("2026-08-12T12:00:00+09:00"),
        publisher = "example",
    )
}
