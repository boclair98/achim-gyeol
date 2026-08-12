package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.repository.BriefingEditionRepository
import kr.briefly.repository.NewsStoryRepository
import kr.briefly.repository.StoryFeedbackRepository
import kr.briefly.repository.StoryCorrectionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

data class SourceResponse(val publisher: String, val url: String, val publishedAt: String, val primarySource: Boolean)
data class ClaimResponse(val statement: String, val sources: List<SourceResponse>)
data class CorrectionResponse(val correctedAt: String, val reason: String)
data class StoryResponse(val id: Long, val category: String, val title: String, val oneLineSummary: String, val summary: String, val whyItMatters: String, val verificationStatus: VerificationStatus, val qualityScore: Int, val uncertainty: String?, val evidenceAvailable: Boolean, val claims: List<ClaimResponse>, val sources: List<SourceResponse>, val corrections: List<CorrectionResponse> = emptyList())
data class BriefingResponse(val id: Long, val briefingDate: LocalDate, val productionReady: Boolean, val editorialState: EditorialState, val humanReviewed: Boolean, val dateLabel: String, val lead: String, val readMinutes: Int, val verifiedCount: Int, val lastVerifiedAt: String, val stories: List<StoryResponse>)
data class ArchiveEditionResponse(val id: Long, val briefingDate: LocalDate, val dateLabel: String, val lead: String, val readMinutes: Int, val verifiedCount: Int, val storyCount: Int, val categories: List<String>, val headlines: List<String>)

@Service
class BriefingService(
    private val editionRepository: BriefingEditionRepository,
    private val storyRepository: NewsStoryRepository,
    private val feedbackRepository: StoryFeedbackRepository,
    private val correctionRepository: StoryCorrectionRepository,
) {
    @Transactional(readOnly = true)
    fun latest(): BriefingResponse = editionRepository.findFirstByOrderByBriefingDateDesc()?.toResponse() ?: error("발행된 브리핑이 없습니다")

    @Transactional(readOnly = true)
    fun byDate(date: LocalDate): BriefingResponse = editionRepository.findByBriefingDate(date)?.toResponse() ?: error("해당 날짜의 브리핑이 없습니다")

    @Transactional(readOnly = true)
    fun archive(): List<ArchiveEditionResponse> = editionRepository.findTop30ByOrderByBriefingDateDesc()
        .filter { it.pipelineGenerated == true && (it.editorialState ?: EditorialState.AUTO_APPROVED) !in setOf(EditorialState.HELD, EditorialState.REVIEW) }
        .map { edition -> ArchiveEditionResponse(
            id = requireNotNull(edition.id), briefingDate = edition.briefingDate,
            dateLabel = edition.briefingDate.format(DateTimeFormatter.ofPattern("M월 d일 EEEE", Locale.KOREAN)),
            lead = edition.lead, readMinutes = edition.readMinutes,
            verifiedCount = edition.stories.count { it.verificationStatus == VerificationStatus.VERIFIED },
            storyCount = edition.stories.size, categories = edition.stories.map { categoryLabel(it.category) }.distinct(),
            headlines = edition.stories.take(5).map(NewsStory::title),
        ) }

    @Transactional
    fun feedback(storyId: Long, userId: String, type: FeedbackType, detail: String?) {
        if (!storyRepository.existsById(storyId)) error("해당 뉴스를 찾을 수 없습니다")
        if (feedbackRepository.existsByStoryIdAndUserIdAndType(storyId, userId, type)) return
        feedbackRepository.save(StoryFeedback(storyId = storyId, userId = userId, type = type, detail = detail?.take(600)))
    }

    private fun BriefingEdition.toResponse(): BriefingResponse {
        val zone = ZoneId.of("Asia/Seoul")
        return BriefingResponse(
            id = requireNotNull(id),
            briefingDate = briefingDate,
            productionReady = pipelineGenerated == true && (editorialState ?: EditorialState.AUTO_APPROVED) in setOf(EditorialState.AUTO_APPROVED, EditorialState.APPROVED, EditorialState.PUBLISHED),
            editorialState = editorialState ?: EditorialState.AUTO_APPROVED,
            humanReviewed = (editorialState ?: EditorialState.AUTO_APPROVED) in setOf(EditorialState.APPROVED, EditorialState.PUBLISHED),
            dateLabel = briefingDate.format(DateTimeFormatter.ofPattern("M월 d일 EEEE", Locale.KOREAN)),
            lead = lead,
            readMinutes = readMinutes,
            verifiedCount = stories.count { it.verificationStatus == VerificationStatus.VERIFIED },
            lastVerifiedAt = lastVerifiedAt.atZoneSameInstant(zone).format(DateTimeFormatter.ofPattern("a h:mm", Locale.KOREAN)),
            stories = stories.map { story ->
                val sources = story.sources.map { SourceResponse(it.publisher, it.url, it.publishedAt.toString(), it.primarySource) }
                val claims = story.claims.map { claim ->
                    ClaimResponse(claim.statement, claim.sourceIndexes.split(',').mapNotNull(String::toIntOrNull).distinct().mapNotNull(sources::getOrNull))
                }
                StoryResponse(
                    requireNotNull(story.id), categoryLabel(story.category), story.title,
                    story.oneLineSummary?.takeIf(String::isNotBlank) ?: firstSentence(story.summary),
                    story.summary, story.whyItMatters, story.verificationStatus, story.qualityScore,
                    story.uncertainty, claims.isNotEmpty(), claims, sources,
                    correctionRepository.findAllByStoryIdOrderByCreatedAtDesc(requireNotNull(story.id)).map { CorrectionResponse(it.createdAt.toString(), it.reason) },
                )
            },
        )
    }

    private fun firstSentence(summary: String): String = summary.split(Regex("(?<=[.!?])\\s+")).firstOrNull()?.trim().orEmpty().ifBlank { summary.take(120) }

    private fun categoryLabel(category: Category) = when (category) {
        Category.POLICY -> "정책"
        Category.ECONOMY -> "경제"
        Category.SOCIETY -> "사회"
        Category.INTERNATIONAL -> "국제"
        Category.TECH -> "테크"
        Category.LIFE -> "생활"
        Category.CULTURE -> "문화"
        Category.SPORTS -> "스포츠"
        Category.ESPORTS -> "e스포츠"
    }
}
