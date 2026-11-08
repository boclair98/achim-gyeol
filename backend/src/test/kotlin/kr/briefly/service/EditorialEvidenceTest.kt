package kr.briefly.service

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.Category
import kr.briefly.domain.VerificationStatus
import kr.briefly.integration.AiFact
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.AiSummary
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.NewsProvider
import kr.briefly.repository.BriefingEditionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.LocalDate
import java.time.OffsetDateTime

class EditorialEvidenceTest {
    private val published = OffsetDateTime.parse("2026-11-05T18:20:00+09:00")

    @Test
    fun `기사 번호는 그대로 두고 명백한 추적 매개변수만 뺀다`() {
        val first = "https://paper.example/news/articleView.html?idxno=21"
        val second = "https://paper.example/news/articleView.html?idxno=22"
        assertThat(articleIdentity("https://PAPER.example:443/news/articleView.html?UTM_source=test&idxno=21&fbclid=test#photo")).isEqualTo(first)
        assertThat(articleIdentity(second)).isNotEqualTo(first)
        assertThat(articleIdentity("https://paper.example/view?id=%2F42&edition=print")).endsWith("?id=%2F42&edition=print")
        assertThat(
            selectBalancedCoverageArticles(
                listOf(
                    listOf(article(first, "첫 기사"), article(second, "두 번째 기사")),
                    listOf(article("$first&utm_campaign=briefing", "첫 기사의 재유입")),
                ), 4,
            ).map(CollectedArticle::title),
        ).containsExactly("첫 기사", "두 번째 기사")
    }

    @Test
    fun `같은 주소 경로에 있는 다른 사건이 각각 출처를 갖고 남는다`() {
        val samePath = "https://paper.example/news/articleView.html"
        val football = "여자 축구 국가대표 결승 우승"
        val vaccine = "광역시 가금농장 조류인플루엔자 방역"
        val clusters = ArticleClusterer().cluster(
            Category.SOCIETY,
            listOf(
                article("$samePath?idxno=21", football),
                article("$samePath?idxno=22", vaccine),
                article("https://other.example/news?no=31", football),
                article("https://other.example/news?no=32", vaccine),
            ),
        )
        assertThat(clusters.map { cluster -> cluster.articles.map(CollectedArticle::title).toSet() })
            .containsExactlyInAnyOrder(setOf(football), setOf(vaccine))
        assertThat(clusters).allMatch { it.articles.size == 2 }
    }

    @Test
    fun `같은 사건의 공식 원문은 나중 보도에 밀려 요약 입력에서 빠지지 않는다`() {
        val title = "금융위원회 금융권 보안 강화 정책 발표"
        val official = article("https://www.fsc.go.kr/no010101/123", title, at = published.minusHours(5))
        val reporters = (1..7).map { article("https://paper$it.example/news", title) }
        val cluster = ArticleClusterer().cluster(Category.FINANCE, reporters + official).single()
        assertThat(cluster.articles).hasSize(6)
        assertThat(cluster.articles.first()).isEqualTo(official)
    }

    @Test
    fun `쉼표와 한국어 단위를 정규화해 같은 금액을 찾는다`() {
        val outlets = listOf(
            article("https://a.example/a", "과징금 1조 4,000억 원"),
            article("https://b.example/b", "과징금 1400000000000원"),
        )
        val facts = resolveCitedFacts(listOf(AiFact("과징금이 1조4000억 원으로 결정됐다.", listOf("S1", "S2", "S8", "S1"))), 2)
        assertThat(facts.single().sourceIndexes).containsExactly(0, 1)
        assertThat(headlineHasUnconfirmedFigure("과징금 1조4000억원", "", facts, outlets)).isFalse()
    }

    @Test
    fun `퍼센트포인트와 퍼센트는 다르고 같은 매체 두 링크는 두 근거가 아니다`() {
        val first = article("https://a.example/a", "기준금리 0.25%p 인하")
        val facts = listOf(CitedFact("기준금리가 0.25%포인트 낮아졌다.", listOf(0, 1)))
        assertThat(
            headlineHasUnconfirmedFigure(
                "기준금리 0.25%p 인하", "", facts,
                listOf(first, article("https://b.example/b", "기준금리 0.25% 인하")),
            ),
        ).isTrue()
        assertThat(
            headlineHasUnconfirmedFigure(
                "기준금리 0.25%p 인하", "", facts,
                listOf(first, article("https://m.a.example/b", "기준금리 0.250%p 인하")),
            ),
        ).isTrue()
        assertThat(
            headlineHasUnconfirmedFigure(
                "기준금리 0.25%p 인하", "", facts,
                listOf(first, article("https://b.example/b", "기준금리 0.250%p 인하")),
            ),
        ).isFalse()
        assertThat(headlineHasUnconfirmedFigure("지수 5%대 움직임", "", emptyList(), emptyList())).isFalse()
    }

    @Test
    fun `근거가 덜 확인된 수치는 표시를 낮추되 발행과 실제 원문은 보존한다`() {
        val date = LocalDate.of(2026, 11, 6)
        val edition = BriefingEdition(date, "")
        val repository = mock(BriefingEditionRepository::class.java)
        `when`(repository.findByBriefingDate(date)).thenReturn(edition)
        val reports = listOf(
            article("https://a.example/a", "한국은행 기준금리 인하", "조정 폭은 0.25%p다."),
            article("https://b.example/b", "한국은행 기준금리 인하", "인하를 결정했다."),
            article("https://c.example/c", "한국은행 기준금리 인하", "회의 결과를 발표했다."),
        )
        val provider = object : NewsProvider {
            override fun search(query: String, display: Int, start: Int) =
                if (query == "한국은행 금리" && start == 1) reports else emptyList()
        }
        val summarizer = object : AiSummarizer {
            override fun summarize(articles: List<CollectedArticle>) = AiSummary(
                title = "한국은행 기준금리 0.25%p 인하",
                oneLineSummary = "한국은행이 기준금리를 0.25%p 내렸다.",
                summary = "기준금리 인하가 발표됐다. 조정 폭은 0.25%p로 제시됐다.",
                whyItMatters = "대출 금리 변화에 관심이 있는 독자가 확인할 만하다.",
                whatToWatch = "",
                keyFacts = listOf(
                    AiFact("조정 폭은 0.25%p였다.", listOf("S1", "S2")),
                    AiFact("한국은행이 기준금리 인하를 발표했다.", listOf("S1", "S2")),
                ),
                uncertainty = null,
                sourcesConflict = false,
                importanceScore = 95,
                recommendedForMorningBriefing = true,
                importanceReason = "검증용 핵심 소식",
                backgroundContext = "",
                plainExplanation = "",
            )
        }
        val result = NewsBriefingGenerator(
            listOf(provider), summarizer, null, ArticleClusterer(), QualityGate(),
            BriefingCoveragePolicy(10, 5, "SPORTS,ESPORTS"), repository,
        ).generate(date, force = true)
        val story = edition.stories.single()
        assertThat(result.deliveryReady).isTrue()
        assertThat(result.publishedStories).isEqualTo(1)
        assertThat(story.verificationStatus).isEqualTo(VerificationStatus.DEVELOPING)
        assertThat(story.uncertainty).contains("같은 값과 단위로 확인하지 못했어요")
        assertThat(story.sources.map { it.url }).containsExactlyElementsOf(reports.map(CollectedArticle::originalUrl))
        assertThat(story.claims.first().sourceIndexes).isEqualTo("0,1")
    }

    private fun article(url: String, title: String, description: String = title, at: OffsetDateTime = published) =
        CollectedArticle(title, description, url, at, "검증용 출처", editorialPriority = 70)
}
