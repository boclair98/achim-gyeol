package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.NewsProvider
import kr.briefly.repository.BriefingEditionRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.mockingDetails
import org.mockito.Mockito.`when`
import java.time.LocalDate

class NewsBriefingGeneratorIdempotencyTest {
    @Test
    fun `보존할 기존 뉴스가 없으면 빈 수집 결과를 정상 기록한다`() {
        val date = LocalDate.of(2026, 11, 4)
        val provider = mock(NewsProvider::class.java)
        val summarizer = mock(AiSummarizer::class.java)
        val repository = mock(BriefingEditionRepository::class.java)
        val generator = NewsBriefingGenerator(listOf(provider), summarizer, null, ArticleClusterer(), QualityGate(), BriefingCoveragePolicy(1, 1), repository)

        val result = generator.generate(date, force = true)

        assertThat(result.publishedStories).isZero()
        assertThat(mockingDetails(repository).invocations.map { it.method.name }).contains("save")
        verifyNoInteractions(summarizer)
    }

    @Test
    fun `같은 날짜의 생성본이 있으면 외부 API를 다시 호출하지 않는다`() {
        val date = LocalDate.of(2026, 8, 13)
        val provider = mock(NewsProvider::class.java)
        val summarizer = mock(AiSummarizer::class.java)
        val repository = mock(BriefingEditionRepository::class.java)
        val edition = BriefingEdition(date, "이미 생성된 브리핑", pipelineGenerated = true)
        edition.addStory(NewsStory(Category.ECONOMY, "기존 뉴스", "기존 요약", whyItMatters = "기존 의미", verificationStatus = VerificationStatus.VERIFIED, qualityScore = 90, displayOrder = 1))
        `when`(repository.findByBriefingDate(date)).thenReturn(edition)
        val generator = NewsBriefingGenerator(listOf(provider), summarizer, null, ArticleClusterer(), QualityGate(), BriefingCoveragePolicy(1, 1), repository)

        val result = generator.generate(date)

        assertThat(result.publishedStories).isEqualTo(1)
        assertThat(result.collectedArticles).isZero()
        verifyNoInteractions(provider, summarizer)
    }

    @Test
    fun `강제 재생성에서 새 기사가 없으면 기존 뉴스는 보존한다`() {
        val date = LocalDate.of(2026, 8, 15)
        val provider = mock(NewsProvider::class.java)
        val summarizer = mock(AiSummarizer::class.java)
        val repository = mock(BriefingEditionRepository::class.java)
        val edition = BriefingEdition(date, "기존 브리핑", pipelineGenerated = true)
        edition.addStory(NewsStory(Category.POLICY, "기존 뉴스", "기존 요약", whyItMatters = "기존 의미", verificationStatus = VerificationStatus.VERIFIED, qualityScore = 90, displayOrder = 1))
        `when`(repository.findByBriefingDate(date)).thenReturn(edition)
        val generator = NewsBriefingGenerator(listOf(provider), summarizer, null, ArticleClusterer(), QualityGate(), BriefingCoveragePolicy(1, 1), repository)

        assertThatThrownBy { generator.generate(date, force = true) }
            .isInstanceOf(IllegalStateException::class.java)
            .hasMessageContaining("기존 1건을 유지")
        assertThat(edition.stories).hasSize(1)
        assertThat(edition.stories.first().title).isEqualTo("기존 뉴스")
        assertThat(edition.lead).isEqualTo("기존 브리핑")
        assertThat(mockingDetails(repository).invocations.map { it.method.name }).doesNotContain("save")
        assertThat(mockingDetails(provider).invocations.map { it.method.name }).contains("searchForDate")
        verifyNoInteractions(summarizer)
    }
}
