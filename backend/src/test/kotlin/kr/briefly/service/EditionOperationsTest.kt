package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.domain.NewsClaim
import kr.briefly.domain.NewsStory
import kr.briefly.domain.VerificationStatus
import kr.briefly.integration.AiSummary
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.PreviousNewsContext
import kr.briefly.integration.briefingAiUsage
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.time.LocalDate
import java.time.LocalTime
import java.time.OffsetDateTime

class EditionOperationsTest {
    @Test
    fun `automatic catch up is weekday only and does not move the 0730 dispatch`() {
        val monday = LocalDate.of(2026, 11, 16)
        assertFalse(deliveryIsDue(LocalTime.of(7, 29)))
        assertTrue(deliveryIsDue(LocalTime.of(7, 30)))
        assertFalse(automaticRecoveryIsDue(monday, LocalTime.of(7, 59)))
        assertTrue(automaticRecoveryIsDue(monday, LocalTime.of(8, 0)))
        assertTrue(automaticRecoveryIsDue(monday, LocalTime.of(13, 29)))
        assertFalse(automaticRecoveryIsDue(monday, LocalTime.of(13, 30)))
        assertFalse(automaticRecoveryIsDue(monday.plusDays(5), LocalTime.of(9, 0)))
    }

    @Test
    fun `only equivalent lead and cited facts are demoted preserving material changes`() {
        val old = story("기준금리를 2.5%로 유지했다", "기준금리는 2.5%다")
        val repeated = story("기준금리를 2.5%로 유지했다.", "기준금리는 2.5%다.")
        val changed = story("기준금리를 2.75%로 인상했다", "기준금리는 2.75%다")
        val newFact = story("기준금리를 2.5%로 유지했다", "기준금리는 2.5%다")
            .apply { addClaim(NewsClaim("다음 회의 날짜가 발표됐다.", "0,1", 2)) }
        val similarity = ArticleClusterer()::similarity
        assertTrue(carriesNoNewFacts(repeated, old, similarity))
        assertFalse(carriesNoNewFacts(changed, old, similarity))
        assertFalse(carriesNoNewFacts(newFact, old, similarity))
        repeated.verificationStatus = VerificationStatus.DEVELOPING
        assertFalse(carriesNoNewFacts(repeated, old, similarity))
    }

    @Test
    fun `usage measures response tokens including charged output and persists the date total`() {
        val json = jacksonObjectMapper().readTree("""{"usage":{"input_tokens":1000,"input_tokens_details":{"cached_tokens":200,"cache_write_tokens":100},"output_tokens":400}}""")
        val measured = requireNotNull(briefingAiUsage(json, "gpt-6.1-sol"))
        val usage = GenerationUsage()
        usage.attempted()
        usage.attempted()
        usage.record(measured)
        usage.reused()
        val totals = usage.totals()
        assertEquals(2, totals.requests)
        assertEquals(1, totals.responsesMeasured)
        assertEquals(1, totals.cacheHits)
        assertEquals(0.00567, requireNotNull(totals.estimatedUsd), 0.00000001)
        assertNull(briefingAiUsage(jacksonObjectMapper().readTree("{}"), "gpt-6.1-sol"))
        assertNull(measured.copy(model = "unknown").estimateUsd())
        val daily = EditionOperationsMetrics(totals + totals, EditionQualitySignals(1, 2, 3))
        assertEquals(4, daily.usage.requests)
        assertEquals(daily, readEditionOperations(writeEditionOperations(daily)))
        assertNull(readEditionOperations(null))
    }

    @Test
    fun `same ordered evidence reuses summary within date but changed evidence and new date refresh it`() {
        val cache = EditionSummaryCache()
        val day = LocalDate.of(2026, 11, 18)
        val usage = GenerationUsage()
        val source = CollectedArticle("제목", "근거", "https://news.example/story", OffsetDateTime.parse("2026-11-17T08:00:00+09:00"), "출처")
        var requests = 0
        fun summarize(input: CollectedArticle, previous: PreviousNewsContext? = null) =
            cache.summarize(listOf(input), previous, usage) {
                requests++
                AiSummary("제목", "결론", "요약", "의미", "", emptyList(), null, false, 80, true, "중요", "배경", "설명")
            }
        cache.prepare(day)
        summarize(source)
        summarize(source.copy(imageUrl = "https://news.example/photo"))
        summarize(source.copy(description = "바뀐 근거"))
        summarize(source, PreviousNewsContext("이전 제목", "이전 요약", listOf("이전 근거")))
        cache.prepare(day.plusDays(1))
        summarize(source)
        assertEquals(4, requests)
        assertEquals(1, usage.totals().cacheHits)
    }

    private fun story(lead: String, fact: String) = NewsStory(
        category = Category.FINANCE, title = "한국은행, 기준금리 결정 공개", summary = lead,
        oneLineSummary = lead, whyItMatters = "대출 이용자에게 영향이 있다", verificationStatus = VerificationStatus.VERIFIED,
        qualityScore = 85, displayOrder = 1,
    ).apply { addClaim(NewsClaim(fact, "0,1", 1)) }
}
