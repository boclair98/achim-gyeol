package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.repository.BriefingEditionRepository
import kr.briefly.repository.NewsStoryRepository
import kr.briefly.repository.StoryFeedbackRepository
import kr.briefly.repository.StoryCorrectionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

data class SourceResponse(val publisher: String, val url: String, val publishedAt: String, val primarySource: Boolean)
data class ClaimResponse(val statement: String, val sources: List<SourceResponse>)
data class CorrectionResponse(val correctedAt: String, val reason: String)
data class StoryResponse(val id: Long, val category: String, val title: String, val oneLineSummary: String, val summary: String, val whyItMatters: String, val whatToWatch: String?, val verificationStatus: VerificationStatus, val qualityScore: Int, val uncertainty: String?, val evidenceAvailable: Boolean, val claims: List<ClaimResponse>, val sources: List<SourceResponse>, val corrections: List<CorrectionResponse> = emptyList(), val viewerInterest: StoryInterest? = null, val backgroundContext: String, val plainExplanation: String, val imageUrl: String? = null, val imagePublisher: String? = null)
data class BriefingResponse(val id: Long, val briefingDate: LocalDate, val productionReady: Boolean, val editorialState: EditorialState, val humanReviewed: Boolean, val dateLabel: String, val lead: String, val readMinutes: Int, val verifiedCount: Int, val lastVerifiedAt: String, val stories: List<StoryResponse>, val personalized: Boolean = false)
data class ArchiveEditionResponse(val id: Long, val briefingDate: LocalDate, val dateLabel: String, val lead: String, val readMinutes: Int, val verifiedCount: Int, val storyCount: Int, val categories: List<String>, val headlines: List<String>)
data class BriefingBuildStatus(val briefingDate: LocalDate, val coverageReady: Boolean, val productionReady: Boolean, val stories: Int, val categories: Int, val minimumStories: Int, val minimumCategories: Int, val blockReasons: List<String>)

@Service
class BriefingService(
    private val editionRepository: BriefingEditionRepository,
    private val storyRepository: NewsStoryRepository,
    private val feedbackRepository: StoryFeedbackRepository,
    private val correctionRepository: StoryCorrectionRepository,
    private val coveragePolicy: BriefingCoveragePolicy,
) {
    @Transactional(readOnly = true)
    fun latest(viewerId: String? = null): BriefingResponse {
        val editions = editionRepository.findTop30ByOrderByBriefingDateDesc()
        val publicEdition = editions.firstOrNull { it.isPubliclyReadable() }
        val demoEdition = editions.firstOrNull { it.pipelineGenerated != true }
        return (publicEdition ?: demoEdition)?.toResponse(viewerId) ?: error("발행된 브리핑이 없습니다")
    }

    @Transactional(readOnly = true)
    fun byDate(date: LocalDate, viewerId: String? = null): BriefingResponse = editionRepository.findByBriefingDate(date)
        ?.takeIf { it.isPubliclyReadable() }
        ?.toResponse(viewerId)
        ?: error("해당 날짜의 발행된 브리핑이 없습니다")

    @Transactional(readOnly = true)
    fun archive(): List<ArchiveEditionResponse> = editionRepository.findTop30ByOrderByBriefingDateDesc()
        .filter { it.isPubliclyReadable() }
        .map { edition -> ArchiveEditionResponse(
            id = requireNotNull(edition.id), briefingDate = edition.briefingDate,
            dateLabel = edition.briefingDate.format(DateTimeFormatter.ofPattern("M월 d일 EEEE", Locale.KOREAN)),
            lead = edition.lead, readMinutes = edition.readMinutes,
            verifiedCount = edition.stories.count { it.verificationStatus == VerificationStatus.VERIFIED },
            storyCount = edition.stories.size, categories = edition.stories.map { categoryLabel(it.category) }.distinct(),
            headlines = edition.stories.take(5).map(NewsStory::title),
        ) }

    @Transactional(readOnly = true)
    fun buildStatus(date: LocalDate): BriefingBuildStatus? = editionRepository.findByBriefingDate(date)?.let { edition ->
        val coverage = coveragePolicy.evaluate(edition.stories)
        val publishableState = (edition.editorialState ?: EditorialState.AUTO_APPROVED) in
            setOf(EditorialState.AUTO_APPROVED, EditorialState.APPROVED, EditorialState.PUBLISHED)
        BriefingBuildStatus(
            briefingDate = edition.briefingDate,
            coverageReady = coverage.ready,
            // Story/category targets are editorial warnings, not a reason to make
            // the daily news service go silent. Individual stories have already
            // passed the source and claim checks before they reach the edition.
            productionReady = edition.pipelineGenerated == true && publishableState,
            stories = coverage.storyCount,
            categories = coverage.categoryCount,
            minimumStories = coverage.minimumStories,
            minimumCategories = coverage.minimumCategories,
            blockReasons = buildList {
                addAll(coverage.reasons)
                if (!publishableState) add("발행 상태: ${edition.editorialState ?: EditorialState.AUTO_APPROVED}")
            },
        )
    }

    @Transactional
    fun feedback(storyId: Long, userId: String, type: FeedbackType, detail: String?) {
        if (!storyRepository.existsById(storyId)) error("해당 뉴스를 찾을 수 없습니다")
        if (feedbackRepository.existsByStoryIdAndUserIdAndType(storyId, userId, type)) return
        feedbackRepository.save(StoryFeedback(storyId = storyId, userId = userId, type = type, detail = detail?.take(600)))
    }

    @Transactional
    fun interest(storyId: Long, userId: String, interest: StoryInterest) {
        if (!storyRepository.existsById(storyId)) error("해당 뉴스를 찾을 수 없습니다")
        feedbackRepository.deleteAllByStoryIdAndUserIdAndTypeIn(storyId, userId, interestFeedbackTypes)
        feedbackRepository.save(
            StoryFeedback(
                storyId = storyId,
                userId = userId,
                type = if (interest == StoryInterest.INTERESTED) FeedbackType.INTERESTED else FeedbackType.NOT_INTERESTED,
            ),
        )
    }

    private fun BriefingEdition.toResponse(viewerId: String?): BriefingResponse {
        val zone = ZoneId.of("Asia/Seoul")
        val signals: Map<Long, StoryFeedback> = if (viewerId == null) emptyMap() else feedbackRepository
            .findAllByUserIdAndTypeInAndCreatedAtAfter(viewerId, interestFeedbackTypes, OffsetDateTime.now().minusDays(90))
            .groupBy(StoryFeedback::storyId)
            .mapValues { (_, values) -> values.maxBy(StoryFeedback::createdAt) }
        val currentStories = stories.sortedBy(NewsStory::displayOrder)
        val currentCategories = currentStories.associate { requireNotNull(it.id) to it.category }
        val missingStoryIds = signals.keys.filterNot(currentCategories::containsKey)
        val categoryByStory = currentCategories + if (missingStoryIds.isEmpty()) emptyMap() else
            storyRepository.findAllById(missingStoryIds).associate { requireNotNull(it.id) to it.category }
        val categoryScores: Map<Category, Int> = signals.values
            .mapNotNull { signal: StoryFeedback -> categoryByStory[signal.storyId]?.let { it to signal.type.interestWeight() } }
            .groupBy(keySelector = { it.first }, valueTransform = { it.second })
            .mapValues { (_, weights) -> weights.sum() }
        val orderedStories = BriefingStoryPersonalizer.order(currentStories, categoryScores)
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
            stories = orderedStories.map { story ->
                val sources = story.sources.map { SourceResponse(it.publisher, it.url, it.publishedAt.toString(), it.primarySource) }
                val claims = story.claims.map { claim ->
                    ClaimResponse(claim.statement, claim.sourceIndexes.split(',').mapNotNull(String::toIntOrNull).distinct().mapNotNull(sources::getOrNull))
                }
                StoryResponse(
                    requireNotNull(story.id), categoryLabel(story.category), story.title,
                    story.oneLineSummary?.takeIf(String::isNotBlank) ?: firstSentence(story.summary),
                    story.summary, story.whyItMatters, story.whatToWatch, story.verificationStatus, story.qualityScore,
                    story.uncertainty, claims.isNotEmpty(), claims, sources,
                    correctionRepository.findAllByStoryIdOrderByCreatedAtDesc(requireNotNull(story.id)).map { CorrectionResponse(it.createdAt.toString(), it.reason) },
                    viewerInterest = signals[requireNotNull(story.id)]?.type?.toStoryInterest(),
                    backgroundContext = story.backgroundContext?.takeIf(String::isNotBlank)
                        ?: story.oneLineSummary?.takeIf(String::isNotBlank) ?: firstSentence(story.summary),
                    plainExplanation = story.plainExplanation?.takeIf(String::isNotBlank) ?: story.summary,
                    imageUrl = story.imageUrl?.takeIf(String::isNotBlank),
                    imagePublisher = story.imagePublisher?.takeIf(String::isNotBlank),
                )
            },
            personalized = categoryScores.values.any { it != 0 },
        )
    }

    private fun firstSentence(summary: String): String = summary.split(Regex("(?<=[.!?])\\s+")).firstOrNull()?.trim().orEmpty().ifBlank { summary.take(120) }

    private fun BriefingEdition.isPubliclyReadable(): Boolean = pipelineGenerated == true &&
        (editorialState ?: EditorialState.AUTO_APPROVED) in setOf(EditorialState.AUTO_APPROVED, EditorialState.APPROVED, EditorialState.PUBLISHED)

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

    private fun FeedbackType.interestWeight(): Int = when (this) {
        FeedbackType.INTERESTED -> 2
        FeedbackType.NOT_INTERESTED -> -1
        else -> 0
    }

    private fun FeedbackType.toStoryInterest(): StoryInterest? = when (this) {
        FeedbackType.INTERESTED -> StoryInterest.INTERESTED
        FeedbackType.NOT_INTERESTED -> StoryInterest.NOT_INTERESTED
        else -> null
    }

    companion object {
        private val interestFeedbackTypes = listOf(FeedbackType.INTERESTED, FeedbackType.NOT_INTERESTED)
    }
}

internal object BriefingStoryPersonalizer {
    private const val CORE_STORY_COUNT = 3

    fun order(stories: List<NewsStory>, categoryScores: Map<Category, Int>): List<NewsStory> {
        val editorialOrder = stories.sortedBy(NewsStory::displayOrder)
        if (editorialOrder.size <= CORE_STORY_COUNT || categoryScores.isEmpty()) return editorialOrder
        return editorialOrder.take(CORE_STORY_COUNT) + editorialOrder.drop(CORE_STORY_COUNT)
            .sortedWith(compareByDescending<NewsStory> { categoryScores[it.category] ?: 0 }.thenBy(NewsStory::displayOrder))
    }
}
