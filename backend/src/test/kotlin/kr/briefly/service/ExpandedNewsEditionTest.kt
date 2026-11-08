package kr.briefly.service

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.Category
import kr.briefly.integration.AiEditorialReviewer
import kr.briefly.integration.AiFact
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.AiSummary
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.EditorialCandidate
import kr.briefly.integration.EditorialReview
import kr.briefly.integration.NewsProvider
import kr.briefly.repository.BriefingEditionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.concurrent.atomic.AtomicInteger

class ExpandedNewsEditionTest {
    private val date = LocalDate.of(2026, 11, 6)
    private val economyTitles = listOf(
        "반도체공급망", "주택재건축", "제조업생산", "관세협정", "자영업소비", "국내자동차", "연금개혁", "농산물유통", "석유화학수출",
    )
    private val financeTitles = listOf(
        "원달러환율", "은행건전성", "기준금리", "국고채수익률", "가상자산거래", "보험보장범위", "코스피수급", "상장지수펀드", "카드결제수수료",
    )
    private val sportsTitle = "프로야구우승"
    private val esportsTitle = "발로란트결승"
    private val widelyReportedTitle = "로봇산업투자"
    private val lessReportedTitle = "교통요금조정"
    private val conflictingTitle = "전력공급망규제"

    @Test
    fun `최종 편집이 한 건만 앞세워도 나머지 적격 기사와 스포츠를 모두 발행한다`() {
        var firstTitle = ""
        val editor = reviewer { candidates, limit ->
            assertThat(limit).isEqualTo(6)
            assertThat(candidates.size).isLessThanOrEqualTo(32)
            val picked = candidates.first { it.title == financeTitles.last() }
            firstTitle = picked.title
            EditorialReview(listOf(picked.ref, picked.ref), "앞 순서만 지정")
        }
        val (result, edition, summaryCalls) = generate(editor)

        assertThat(result.publishedStories).isEqualTo(21)
        assertThat(result.editorialPassApplied).isTrue()
        assertThat(result.deliveryReady).isTrue()
        assertThat(summaryCalls).isEqualTo(23)
        assertThat(edition.stories.first().title).isEqualTo(firstTitle)
        assertThat(edition.stories.map { it.title }).containsExactlyInAnyOrderElementsOf(
            economyTitles + financeTitles + listOf(sportsTitle, esportsTitle, widelyReportedTitle),
        )
        assertThat(edition.stories.map { it.displayOrder }).containsExactlyElementsOf(1..21)
        assertThat(edition.stories.filter { it.category in setOf(Category.ECONOMY, Category.FINANCE) }).hasSize(18)
        assertThat(edition.stories.map { it.title }).doesNotContain(lessReportedTitle, conflictingTitle)
    }

    @Test
    fun `편집 모델이 실패하고 스포츠 기사가 없어도 모든 적격 뉴스를 기본 순서로 공개한다`() {
        val (result, edition) = generate(reviewer { _, _ -> error("test editor unavailable") }, includeSports = false)

        assertThat(result.publishedStories).isEqualTo(19)
        assertThat(result.editorialPassApplied).isFalse()
        assertThat(result.editorialFallbackReason).contains("test editor unavailable")
        assertThat(result.deliveryReady).isTrue()
        assertThat(edition.stories.map { it.title }).containsExactlyInAnyOrderElementsOf(
            economyTitles + financeTitles + widelyReportedTitle,
        )
    }

    private fun generate(editor: AiEditorialReviewer, includeSports: Boolean = true): Triple<GenerationResult, BriefingEdition, Int> {
        val edition = BriefingEdition(date, "")
        val repository = mock(BriefingEditionRepository::class.java)
        `when`(repository.findByBriefingDate(date)).thenReturn(edition)
        val previousDay = date.minusDays(1).atTime(14, 0).atOffset(ZoneOffset.ofHours(9))
        fun articles(titles: List<String>, sources: Int) = titles.flatMap { title ->
            (1..sources).map { index ->
                CollectedArticle(
                    title, "$title 관련 결과를 발표했다.",
                    "https://paper$index.example/news/${title.hashCode()}", previousDay, "테스트 출처 $index",
                    editorialPriority = 65,
                )
            }
        }
        val provider = object : NewsProvider {
            override fun search(query: String, display: Int, start: Int): List<CollectedArticle> =
                if (start != 1) emptyList() else when (query) {
                    "물가 소비 경기" -> articles(economyTitles, 2)
                    "한국은행 금리" -> articles(financeTitles, 2)
                    "AI 인공지능" -> articles(listOf(widelyReportedTitle, conflictingTitle), 4)
                    // Frequent coverage is not an exception to the importance gate.
                    "날씨 재난 생활" -> articles(listOf(lessReportedTitle), 6)
                    "프로야구 경기 결과" -> if (includeSports) articles(listOf(sportsTitle), 2) else emptyList()
                    "LCK e스포츠" -> if (includeSports) articles(listOf(esportsTitle), 2) else emptyList()
                    // An already-seen event appears under a second query.
                    "국제 외교 안보" -> articles(listOf(financeTitles.first()), 2)
                    else -> emptyList()
                }
        }
        val calls = AtomicInteger()
        val summarizer = object : AiSummarizer {
            override fun summarize(articles: List<CollectedArticle>): AiSummary {
                calls.incrementAndGet()
                val title = articles.first().title
                return AiSummary(
                    title, "$title 결과", "$title 결과가 공개됐다.", "$title 맥락", "",
                    listOf(AiFact("$title 핵심 사실 하나", listOf("S1", "S2")), AiFact("$title 핵심 사실 둘", listOf("S1", "S2"))),
                    uncertainty = null,
                    sourcesConflict = title == conflictingTitle,
                    importanceScore = if (title == lessReportedTitle) 62 else 85,
                    recommendedForMorningBriefing = true,
                    importanceReason = "테스트용 추천",
                    backgroundContext = "$title 배경",
                    plainExplanation = "$title 설명",
                )
            }
        }
        val generator = NewsBriefingGenerator(
            listOf(provider), summarizer, editor, ArticleClusterer(), QualityGate(),
            BriefingCoveragePolicy(10, 5, "SPORTS,ESPORTS"), repository,
        )
        return Triple(generator.generate(date, force = true), edition, calls.get())
    }

    private fun reviewer(result: (List<EditorialCandidate>, Int) -> EditorialReview) = object : AiEditorialReviewer {
        override val modelName = "test-editor"
        override fun review(candidates: List<EditorialCandidate>, headlineLimit: Int) = result(candidates, headlineLimit)
    }
}
