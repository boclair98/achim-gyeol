package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.NewsProvider
import kr.briefly.repository.BriefingEditionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.LocalDate

class NewsBriefingGeneratorIdempotencyTest {
    @Test
    fun `같은 날짜의 생성본이 있으면 외부 API를 다시 호출하지 않는다`() {
        val date = LocalDate.of(2026, 8, 13)
        val provider = mock(NewsProvider::class.java)
        val summarizer = mock(AiSummarizer::class.java)
        val repository = mock(BriefingEditionRepository::class.java)
        val edition = BriefingEdition(date, "이미 생성된 브리핑", pipelineGenerated = true)
        edition.addStory(NewsStory(Category.ECONOMY, "기존 뉴스", "기존 요약", whyItMatters = "기존 의미", verificationStatus = VerificationStatus.VERIFIED, qualityScore = 90, displayOrder = 1))
        `when`(repository.findByBriefingDate(date)).thenReturn(edition)
        val generator = NewsBriefingGenerator(listOf(provider), summarizer, ArticleClusterer(), QualityGate(), BriefingCoveragePolicy(1, 1), repository)

        val result = generator.generate(date)

        assertThat(result.publishedStories).isEqualTo(1)
        assertThat(result.collectedArticles).isZero()
        verifyNoInteractions(provider, summarizer)
    }
}
