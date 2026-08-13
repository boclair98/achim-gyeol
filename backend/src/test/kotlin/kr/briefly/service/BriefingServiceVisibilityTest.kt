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
    private val service = BriefingService(editionRepository, storyRepository, feedbackRepository, correctionRepository, BriefingCoveragePolicy(1, 1))

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

    @Test
    fun `두 건 한 분야여도 검증된 브리핑은 정규 발송 준비로 표시한다`() {
        val date = LocalDate.of(2026, 8, 13)
        val thinEdition = edition(date, EditorialState.AUTO_APPROVED, 13)
        thinEdition.addStory(story(Category.TECH, 131))
        `when`(editionRepository.findTop30ByOrderByBriefingDateDesc()).thenReturn(listOf(thinEdition))
        `when`(correctionRepository.findAllByStoryIdOrderByCreatedAtDesc(130L)).thenReturn(emptyList())
        `when`(correctionRepository.findAllByStoryIdOrderByCreatedAtDesc(131L)).thenReturn(emptyList())
        val strictService = BriefingService(
            editionRepository, storyRepository, feedbackRepository, correctionRepository,
            BriefingCoveragePolicy(minimumStories = 8, minimumCategories = 5),
        )

        val result = strictService.latest()

        assertThat(result.stories).hasSize(2)
        assertThat(result.productionReady).isTrue()
    }

    @Test
    fun `검증 카드가 없는 날도 생성 완료 안내 브리핑을 공개한다`() {
        val date = LocalDate.of(2026, 8, 13)
        val emptyEdition = BriefingEdition(
            briefingDate = date,
            lead = "자동 검증을 통과한 카드가 아직 없습니다.",
            pipelineGenerated = true,
            editorialState = EditorialState.AUTO_APPROVED,
            id = 14,
        )
        `when`(editionRepository.findTop30ByOrderByBriefingDateDesc()).thenReturn(listOf(emptyEdition))

        val result = service.latest()

        assertThat(result.stories).isEmpty()
        assertThat(result.productionReady).isTrue()
    }

    private fun edition(date: LocalDate, state: EditorialState, id: Long): BriefingEdition {
        val edition = BriefingEdition(
            briefingDate = date,
            lead = "검증된 브리핑",
            pipelineGenerated = true,
            editorialState = state,
            id = id,
        )
        edition.addStory(story(Category.SOCIETY, id * 10))
        return edition
    }

    private fun story(category: Category, id: Long): NewsStory {
        val story = NewsStory(
            category = category,
            title = "검증된 뉴스",
            summary = "서로 다른 출처에서 확인한 사실입니다.",
            oneLineSummary = "확인된 한 줄 결론입니다.",
            whyItMatters = "독자가 알아야 할 이유입니다.",
            verificationStatus = VerificationStatus.VERIFIED,
            qualityScore = 90,
            displayOrder = 1,
            id = id,
        )
        story.addSource(NewsSource("출처 A", "https://a.example/news", OffsetDateTime.now()))
        story.addSource(NewsSource("출처 B", "https://b.example/news", OffsetDateTime.now()))
        story.addClaim(NewsClaim("두 출처에서 확인한 핵심입니다.", "0,1", 1))
        return story
    }
}
