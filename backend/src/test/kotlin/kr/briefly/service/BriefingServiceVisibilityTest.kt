package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.repository.BriefingEditionRepository
import kr.briefly.repository.NewsStoryRepository
import kr.briefly.repository.StoryCorrectionRepository
import kr.briefly.repository.StoryFeedbackRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.LocalDate
import java.time.OffsetDateTime

class BriefingServiceVisibilityTest {
    private val editionRepository = mock(BriefingEditionRepository::class.java)
    private val storyRepository = mock(NewsStoryRepository::class.java)
    private val feedbackRepository = mock(StoryFeedbackRepository::class.java)
    private val correctionRepository = mock(StoryCorrectionRepository::class.java)
    private val service = BriefingService(editionRepository, storyRepository, feedbackRepository, correctionRepository)

    @Test
    fun `검수 중인 최신판 대신 가장 최근 발행본을 공개한다`() {
        val review = edition(LocalDate.of(2026, 8, 13), EditorialState.REVIEW, 13)
        val published = edition(LocalDate.of(2026, 8, 12), EditorialState.AUTO_APPROVED, 12)
        `when`(editionRepository.findTop30ByOrderByBriefingDateDesc()).thenReturn(listOf(review, published))
        `when`(correctionRepository.findAllByStoryIdOrderByCreatedAtDesc(120L)).thenReturn(emptyList())

        val result = service.latest()

        assertThat(result.id).isEqualTo(12L)
        assertThat(result.briefingDate).isEqualTo(LocalDate.of(2026, 8, 12))
        assertThat(result.productionReady).isTrue()
    }

    @Test
    fun `검수 중인 날짜는 공개 주소로 조회할 수 없다`() {
        val date = LocalDate.of(2026, 8, 13)
        `when`(editionRepository.findByBriefingDate(date)).thenReturn(edition(date, EditorialState.REVIEW, 13))

        assertThatThrownBy { service.byDate(date) }
            .isInstanceOf(IllegalStateException::class.java)
            .hasMessageContaining("발행된 브리핑")
    }

    private fun edition(date: LocalDate, state: EditorialState, id: Long): BriefingEdition {
        val edition = BriefingEdition(
            briefingDate = date,
            lead = "검증된 브리핑",
            pipelineGenerated = true,
            editorialState = state,
            id = id,
        )
        val story = NewsStory(
            category = Category.SOCIETY,
            title = "검증된 뉴스",
            summary = "서로 다른 출처에서 확인한 사실입니다.",
            oneLineSummary = "확인된 한 줄 결론입니다.",
            whyItMatters = "독자가 알아야 할 이유입니다.",
            verificationStatus = VerificationStatus.VERIFIED,
            qualityScore = 90,
            displayOrder = 1,
            id = id * 10,
        )
        story.addSource(NewsSource("출처 A", "https://a.example/news", OffsetDateTime.now()))
        story.addSource(NewsSource("출처 B", "https://b.example/news", OffsetDateTime.now()))
        story.addClaim(NewsClaim("두 출처에서 확인한 핵심입니다.", "0,1", 1))
        edition.addStory(story)
        return edition
    }
}
