package kr.briefly.service

import kr.briefly.integration.CollectedArticle
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId

class NewsCoverageCollectionTest {
    private val zone = ZoneId.of("Asia/Seoul")
    private val coverageDate = LocalDate.of(2026, 8, 12)

    @Test
    fun `첫 페이지가 당일 기사로 차도 전날 날짜가 나올 때까지 다음 페이지를 읽는다`() {
        val starts = mutableListOf<Int>()
        val result = collectArticlesForDate(coverageDate, zone, maxPages = 3) { start ->
            starts += start
            when (start) {
                1 -> List(100) { article("2026-08-13T01:00:00+09:00", "today-$it") }
                101 -> List(100) { article("2026-08-12T12:00:00+09:00", "target-$it") }
                else -> listOf(article("2026-08-11T23:00:00+09:00", "old"))
            }
        }

        assertThat(starts).containsExactly(1, 101, 201)
        assertThat(result).hasSize(100)
        assertThat(result).allMatch { it.title.startsWith("target-") }
    }

    @Test
    fun `목표일보다 오래된 기사가 나타나면 불필요한 페이지 호출을 멈춘다`() {
        val starts = mutableListOf<Int>()
        collectArticlesForDate(coverageDate, zone, maxPages = 5) { start ->
            starts += start
            List(100) { index ->
                if (index == 99) article("2026-08-11T23:00:00+09:00", "old")
                else article("2026-08-12T12:00:00+09:00", "target-$index")
            }
        }

        assertThat(starts).containsExactly(1)
    }

    private fun article(timestamp: String, title: String) = CollectedArticle(
        title = title,
        description = title,
        originalUrl = "https://example.com/$title",
        publishedAt = OffsetDateTime.parse(timestamp),
        publisher = "example.com",
    )
}
