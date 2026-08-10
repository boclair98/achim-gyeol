package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.repository.BriefingEditionRepository
import kr.briefly.repository.StoryFeedbackRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

data class SourceResponse(val publisher: String, val url: String, val publishedAt: String)
data class StoryResponse(val id: Long, val category: String, val title: String, val summary: String, val whyItMatters: String, val verificationStatus: VerificationStatus, val qualityScore: Int, val uncertainty: String?, val sources: List<SourceResponse>)
data class BriefingResponse(val id: Long, val dateLabel: String, val lead: String, val readMinutes: Int, val verifiedCount: Int, val lastVerifiedAt: String, val stories: List<StoryResponse>)

@Service
class BriefingService(
    private val editionRepository: BriefingEditionRepository,
    private val feedbackRepository: StoryFeedbackRepository,
) {
    @Transactional(readOnly = true)
    fun latest(): BriefingResponse = editionRepository.findFirstByOrderByBriefingDateDesc()?.toResponse() ?: error("발행된 브리핑이 없습니다")

    @Transactional(readOnly = true)
    fun byDate(date: LocalDate): BriefingResponse = editionRepository.findByBriefingDate(date)?.toResponse() ?: error("해당 날짜의 브리핑이 없습니다")

    @Transactional
    fun feedback(storyId: Long, userId: String, type: FeedbackType, detail: String?) {
        feedbackRepository.save(StoryFeedback(storyId = storyId, userId = userId, type = type, detail = detail?.take(600)))
    }

    private fun BriefingEdition.toResponse(): BriefingResponse {
        val zone = ZoneId.of("Asia/Seoul")
        return BriefingResponse(
            id = requireNotNull(id),
            dateLabel = briefingDate.format(DateTimeFormatter.ofPattern("M월 d일 EEEE")),
            lead = lead,
            readMinutes = readMinutes,
            verifiedCount = stories.count { it.verificationStatus == VerificationStatus.VERIFIED },
            lastVerifiedAt = lastVerifiedAt.atZoneSameInstant(zone).format(DateTimeFormatter.ofPattern("a h:mm")),
            stories = stories.map { story -> StoryResponse(requireNotNull(story.id), categoryLabel(story.category), story.title, story.summary, story.whyItMatters, story.verificationStatus, story.qualityScore, story.uncertainty, story.sources.map { SourceResponse(it.publisher, it.url, it.publishedAt.toString()) }) },
        )
    }

    private fun categoryLabel(category: Category) = when (category) { Category.POLICY -> "정책"; Category.ECONOMY -> "경제"; Category.SOCIETY -> "사회"; Category.TECH -> "테크" }
}
