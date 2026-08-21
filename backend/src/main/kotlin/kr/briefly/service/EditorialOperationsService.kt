package kr.briefly.service

import kr.briefly.domain.*
import kr.briefly.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.time.ZoneId

data class EditorialStoryItem(
    val id: Long,
    val order: Int,
    val category: String,
    val title: String,
    val oneLineSummary: String?,
    val summary: String,
    val whyItMatters: String,
    val whatToWatch: String?,
    val uncertainty: String?,
    val verificationStatus: VerificationStatus,
    val qualityScore: Int,
    val editorialState: EditorialState,
    val claims: Int,
    val sources: Int,
)

data class EditorialQueue(
    val editionId: Long,
    val briefingDate: String,
    val state: EditorialState,
    val approvedAt: OffsetDateTime?,
    val stories: List<EditorialStoryItem>,
)

data class EditorialStoryUpdate(
    val title: String? = null,
    val oneLineSummary: String? = null,
    val summary: String? = null,
    val whyItMatters: String? = null,
    val whatToWatch: String? = null,
    val uncertainty: String? = null,
    val state: EditorialState? = null,
)

data class CorrectionInput(val afterText: String, val reason: String)
data class OperationMetric(
    val activeSubscriptions: Int,
    val uniqueReaders30d: Int,
    val returningReaders30d: Int,
    val loyalReaders7d: Int,
    val loyalReaders14d: Int,
    val loyalReaders30d: Int,
    val averageActiveDays30d: Double,
    val opens30d: Int,
    val completed30d: Int,
    val sourceOpens30d: Int,
    val shares30d: Int,
    val recentDelivered: Long,
    val recentFailed: Long,
)

@Service
class EditorialOperationsService(
    private val editionRepository: BriefingEditionRepository,
    private val storyRepository: NewsStoryRepository,
    private val auditRepository: EditorialAuditLogRepository,
    private val correctionRepository: StoryCorrectionRepository,
    private val eventRepository: ReaderEventRepository,
    private val deliveryRepository: PushDeliveryAttemptRepository,
    private val pushRepository: PushSubscriptionRepository,
) {
    @Transactional(readOnly = true)
    fun queue(): EditorialQueue {
        val edition = editionRepository.findFirstByOrderByBriefingDateDesc() ?: error("브리핑이 없습니다")
        return EditorialQueue(
            editionId = requireNotNull(edition.id),
            briefingDate = edition.briefingDate.toString(),
            state = edition.editorialState ?: EditorialState.AUTO_APPROVED,
            approvedAt = edition.approvedAt,
            stories = edition.stories.map { story ->
                EditorialStoryItem(
                    id = requireNotNull(story.id), order = story.displayOrder, category = story.category.name,
                    title = story.title, oneLineSummary = story.oneLineSummary, summary = story.summary,
                    whyItMatters = story.whyItMatters, whatToWatch = story.whatToWatch, uncertainty = story.uncertainty,
                    verificationStatus = story.verificationStatus, qualityScore = story.qualityScore,
                    editorialState = story.editorialState ?: EditorialState.AUTO_APPROVED,
                    claims = story.claims.size, sources = story.sources.size,
                )
            },
        )
    }

    @Transactional
    fun updateStory(storyId: Long, input: EditorialStoryUpdate, actor: String): EditorialStoryItem {
        val story = storyRepository.findById(storyId).orElseThrow { IllegalStateException("뉴스를 찾을 수 없습니다") }
        val before = "${story.title} | ${story.summary}"
        input.title?.trim()?.takeIf(String::isNotBlank)?.let { story.title = it.take(300) }
        input.oneLineSummary?.trim()?.let { story.oneLineSummary = it.take(400) }
        input.summary?.trim()?.takeIf(String::isNotBlank)?.let { story.summary = it.take(1200) }
        input.whyItMatters?.trim()?.takeIf(String::isNotBlank)?.let { story.whyItMatters = it.take(700) }
        input.whatToWatch?.trim()?.let { story.whatToWatch = it.take(500).ifBlank { null } }
        input.uncertainty?.trim()?.let { story.uncertainty = it.take(600).ifBlank { null } }
        input.state?.let { requested ->
            require(requested != EditorialState.PUBLISHED) { "뉴스 단위로 발행 완료 상태를 지정할 수 없습니다" }
            if (requested == EditorialState.APPROVED) require(story.verificationStatus == VerificationStatus.VERIFIED) { "검증 완료 뉴스만 승인할 수 있습니다" }
            story.editorialState = requested
        }
        storyRepository.save(story)
        audit("STORY_UPDATED", "STORY", storyId, actor, "before=${before.take(420)}; state=${story.editorialState}")
        return EditorialStoryItem(
            requireNotNull(story.id), story.displayOrder, story.category.name, story.title, story.oneLineSummary,
            story.summary, story.whyItMatters, story.whatToWatch, story.uncertainty, story.verificationStatus, story.qualityScore,
            story.editorialState ?: EditorialState.AUTO_APPROVED, story.claims.size, story.sources.size,
        )
    }

    @Transactional
    fun approveEdition(editionId: Long, actor: String): EditorialQueue {
        val edition = editionRepository.findById(editionId).orElseThrow { IllegalStateException("브리핑을 찾을 수 없습니다") }
        require(edition.stories.isNotEmpty()) { "승인할 뉴스가 없습니다" }
        require(edition.stories.none { (it.editorialState ?: EditorialState.AUTO_APPROVED) in setOf(EditorialState.HELD, EditorialState.REVIEW) }) { "검토 또는 보류 중인 뉴스가 있습니다" }
        require(edition.stories.all { it.verificationStatus == VerificationStatus.VERIFIED && it.claims.isNotEmpty() }) { "근거 검증을 통과하지 못한 뉴스가 있습니다" }
        edition.editorialState = EditorialState.APPROVED
        edition.approvedAt = OffsetDateTime.now()
        edition.approvedBy = actor.take(80)
        edition.stories.forEach { it.editorialState = EditorialState.APPROVED }
        editionRepository.save(edition)
        audit("EDITION_APPROVED", "EDITION", editionId, actor, "stories=${edition.stories.size}")
        return queue()
    }

    @Transactional
    fun holdEdition(editionId: Long, actor: String, reason: String): EditorialQueue {
        val edition = editionRepository.findById(editionId).orElseThrow { IllegalStateException("브리핑을 찾을 수 없습니다") }
        edition.editorialState = EditorialState.HELD
        editionRepository.save(edition)
        audit("EDITION_HELD", "EDITION", editionId, actor, reason.take(800))
        return queue()
    }

    @Transactional
    fun declareIncident(editionId: Long, actor: String, reason: String): EditorialQueue {
        require(reason.trim().length >= 10) { "사고 내용과 중단 이유를 10자 이상 입력해 주세요" }
        val edition = editionRepository.findById(editionId).orElseThrow { IllegalStateException("브리핑을 찾을 수 없습니다") }
        edition.editorialState = EditorialState.HELD
        edition.stories.forEach { it.editorialState = EditorialState.HELD }
        editionRepository.save(edition)
        audit("EDITORIAL_INCIDENT_DECLARED", "EDITION", editionId, actor, reason.trim().take(800))
        return queue()
    }

    @Transactional
    fun correct(storyId: Long, input: CorrectionInput, actor: String): StoryCorrection {
        require(input.afterText.isNotBlank() && input.reason.isNotBlank()) { "정정 내용과 이유가 필요합니다" }
        val story = storyRepository.findById(storyId).orElseThrow { IllegalStateException("뉴스를 찾을 수 없습니다") }
        val before = story.summary
        story.summary = input.afterText.trim().take(1200)
        storyRepository.save(story)
        val correction = correctionRepository.save(StoryCorrection(storyId, before.take(800), story.summary.take(800), input.reason.take(500), actor.take(80)))
        audit("STORY_CORRECTED", "STORY", storyId, actor, input.reason.take(800))
        return correction
    }

    @Transactional(readOnly = true)
    fun metrics(): OperationMetric {
        val since = OffsetDateTime.now().minusDays(30)
        val events = eventRepository.findAllByCreatedAtAfter(since)
        val activeDaysByReader = events.asSequence()
            .filter { it.type == ReaderEventType.BRIEFING_OPEN }
            .groupBy(ReaderEvent::actorHash)
            .mapValues { (_, readerEvents) ->
                readerEvents.map { it.createdAt.atZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDate() }.toSet().size
            }
        val latestEdition = editionRepository.findFirstByOrderByBriefingDateDesc()
        val editionId = latestEdition?.id
        return OperationMetric(
            activeSubscriptions = pushRepository.countByActiveTrue().toInt(),
            uniqueReaders30d = activeDaysByReader.size,
            returningReaders30d = activeDaysByReader.count { it.value >= 2 },
            loyalReaders7d = activeDaysByReader.count { it.value >= 5 },
            loyalReaders14d = activeDaysByReader.count { it.value >= 10 },
            loyalReaders30d = activeDaysByReader.count { it.value >= 20 },
            averageActiveDays30d = activeDaysByReader.values.takeIf { it.isNotEmpty() }?.average()?.let { kotlin.math.round(it * 10) / 10.0 } ?: 0.0,
            opens30d = events.count { it.type == ReaderEventType.BRIEFING_OPEN },
            completed30d = events.count { it.type == ReaderEventType.COMPLETE },
            sourceOpens30d = events.count { it.type == ReaderEventType.SOURCE_OPEN },
            shares30d = events.count { it.type == ReaderEventType.SHARE },
            recentDelivered = editionId?.let { deliveryRepository.countByEditionIdAndState(it, DeliveryState.DELIVERED) } ?: 0,
            recentFailed = editionId?.let { deliveryRepository.countByEditionIdAndState(it, DeliveryState.FAILED) } ?: 0,
        )
    }

    @Transactional(readOnly = true) fun audits() = auditRepository.findTop100ByOrderByCreatedAtDesc()
    @Transactional(readOnly = true) fun corrections() = correctionRepository.findTop100ByOrderByCreatedAtDesc()
    @Transactional(readOnly = true) fun deliveries() = deliveryRepository.findTop200ByOrderByCreatedAtDesc()

    private fun audit(action: String, targetType: String, targetId: Long, actor: String, detail: String?) {
        auditRepository.save(EditorialAuditLog(action, targetType, targetId, actor.take(80), detail?.take(1000)))
    }
}

@Service
class ReaderExperienceService(
    private val preferenceRepository: ReaderPreferenceRepository,
    private val eventRepository: ReaderEventRepository,
    private val feedbackRepository: StoryFeedbackRepository,
    private val pushRepository: PushSubscriptionRepository,
    private val subscriptionMetricsService: SubscriptionMetricsService,
) {
    data class PreferenceExport(val categories: List<String>, val digestSize: String, val consent: Boolean, val updatedAt: OffsetDateTime)
    data class SubscriptionExport(val active: Boolean, val timezone: String, val deliveryTime: String, val createdAt: OffsetDateTime, val updatedAt: OffsetDateTime, val lastSentAt: OffsetDateTime?)
    data class FeedbackExport(val storyId: Long, val type: FeedbackType, val detail: String?, val createdAt: OffsetDateTime)
    data class EventExport(val type: ReaderEventType, val editionId: Long, val storyId: Long?, val createdAt: OffsetDateTime)
    data class ReaderDataExport(val exportedAt: OffsetDateTime, val preferences: PreferenceExport?, val subscriptions: List<SubscriptionExport>, val feedback: List<FeedbackExport>, val events: List<EventExport>)
    data class ReaderDataDeletion(val deletedPreferences: Int, val deletedSubscriptions: Int, val deletedFeedback: Int, val deletedEvents: Int)

    @Transactional(readOnly = true)
    fun preferences(ownerId: String): ReaderPreference = preferenceRepository.findByOwnerId(ownerId) ?: ReaderPreference(ownerId)

    @Transactional
    fun savePreferences(ownerId: String, categories: Set<String>, digestSize: String, consent: Boolean): ReaderPreference {
        require(digestSize in setOf("compact", "standard", "deep")) { "브리핑 분량이 올바르지 않습니다" }
        val allowed = setOf("정책", "경제", "사회", "국제", "테크", "생활", "문화", "스포츠", "e스포츠")
        val selected = categories.intersect(allowed)
        require(selected.isNotEmpty()) { "관심 분야를 한 개 이상 선택해 주세요" }
        val preference = preferenceRepository.findByOwnerId(ownerId) ?: ReaderPreference(ownerId)
        preference.categories = selected.sorted().joinToString(",")
        preference.digestSize = digestSize
        preference.weekdays = allDeliveryWeekdaysValue
        preference.consent = consent
        preference.updatedAt = OffsetDateTime.now()
        val saved = preferenceRepository.save(preference)
        val subscriptions = pushRepository.findAllByOwnerId(ownerId)
        subscriptions.forEach { subscription ->
            subscription.weekdays = allDeliveryWeekdaysValue
            subscription.active = consent
            subscription.updatedAt = OffsetDateTime.now()
        }
        if (subscriptions.isNotEmpty()) {
            pushRepository.saveAll(subscriptions)
            subscriptionMetricsService.recordIfChanged(if (consent) "PREFERENCE_CONSENT_ENABLED" else "PREFERENCE_CONSENT_WITHDRAWN")
        }
        return saved
    }

    @Transactional
    fun recordEvent(ownerId: String, type: ReaderEventType, editionId: Long, storyId: Long?) {
        val actorHash = ownerHash(ownerId)
        if (eventRepository.existsByTypeAndEditionIdAndStoryIdAndActorHash(type, editionId, storyId, actorHash)) return
        eventRepository.save(ReaderEvent(type, editionId, storyId, actorHash))
    }

    @Transactional(readOnly = true)
    fun exportData(ownerId: String): ReaderDataExport {
        val preference = preferenceRepository.findByOwnerId(ownerId)?.let {
            PreferenceExport(it.categories.split(',').filter(String::isNotBlank), it.digestSize, it.consent, it.updatedAt)
        }
        val subscriptions = pushRepository.findAllByOwnerId(ownerId).map {
            SubscriptionExport(it.active, it.timezone, "%02d:%02d".format(it.deliveryHour, it.deliveryMinute), it.createdAt, it.updatedAt, it.lastSentAt)
        }
        val feedback = feedbackRepository.findAllByUserId(ownerId).map { FeedbackExport(it.storyId, it.type, it.detail, it.createdAt) }
        val events = eventRepository.findAllByActorHash(ownerHash(ownerId)).map { EventExport(it.type, it.editionId, it.storyId, it.createdAt) }
        return ReaderDataExport(OffsetDateTime.now(), preference, subscriptions, feedback, events)
    }

    @Transactional
    fun deleteData(ownerId: String): ReaderDataDeletion {
        val preferences = if (preferenceRepository.findByOwnerId(ownerId) != null) 1 else 0
        val subscriptions = pushRepository.findAllByOwnerId(ownerId)
        val feedback = feedbackRepository.findAllByUserId(ownerId)
        val events = eventRepository.findAllByActorHash(ownerHash(ownerId))
        if (subscriptions.isNotEmpty()) pushRepository.deleteAllInBatch(subscriptions)
        if (preferences > 0) preferenceRepository.deleteByOwnerId(ownerId)
        if (feedback.isNotEmpty()) feedbackRepository.deleteAllByUserId(ownerId)
        if (events.isNotEmpty()) eventRepository.deleteAllByActorHash(ownerHash(ownerId))
        if (subscriptions.isNotEmpty()) subscriptionMetricsService.recordIfChanged("READER_DATA_DELETED")
        return ReaderDataDeletion(preferences, subscriptions.size, feedback.size, events.size)
    }

    private fun ownerHash(ownerId: String): String = MessageDigest.getInstance("SHA-256")
        .digest(ownerId.toByteArray(StandardCharsets.UTF_8)).joinToString("") { "%02x".format(it) }
}
