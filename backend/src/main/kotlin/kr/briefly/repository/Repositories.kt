package kr.briefly.repository

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.FeedbackType
import kr.briefly.domain.NewsStory
import kr.briefly.domain.StoryFeedback
import kr.briefly.domain.PushSubscription
import kr.briefly.domain.SubscriptionMetricSnapshot
import kr.briefly.domain.EditorialAuditLog
import kr.briefly.domain.PushDeliveryAttempt
import kr.briefly.domain.ReaderEvent
import kr.briefly.domain.ReaderPreference
import kr.briefly.domain.StoryCorrection
import kr.briefly.domain.DeliveryState
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.time.OffsetDateTime

interface BriefingEditionRepository : JpaRepository<BriefingEdition, Long> {
    fun findFirstByOrderByBriefingDateDesc(): BriefingEdition?
    fun findByBriefingDate(date: LocalDate): BriefingEdition?
    fun findTop30ByOrderByBriefingDateDesc(): List<BriefingEdition>
}

interface NewsStoryRepository : JpaRepository<NewsStory, Long> {
    fun findAllByEdition_IdOrderByDisplayOrder(editionId: Long): List<NewsStory>
}

interface StoryFeedbackRepository : JpaRepository<StoryFeedback, Long> {
    fun existsByStoryIdAndUserIdAndType(storyId: Long, userId: String, type: FeedbackType): Boolean
    fun findAllByUserIdAndTypeInAndCreatedAtAfter(userId: String, types: Collection<FeedbackType>, cutoff: OffsetDateTime): List<StoryFeedback>
    fun deleteAllByStoryIdAndUserIdAndTypeIn(storyId: Long, userId: String, types: Collection<FeedbackType>)
    fun findAllByCreatedAtBefore(cutoff: OffsetDateTime): List<StoryFeedback>
}

interface PushSubscriptionRepository : JpaRepository<PushSubscription, Long> {
    fun findByEndpointHash(endpointHash: String): PushSubscription?
    fun findAllByActiveTrue(): List<PushSubscription>
    fun findAllByActiveFalseAndLastError(lastError: String): List<PushSubscription>
    fun findAllByActiveFalseAndUpdatedAtBefore(cutoff: OffsetDateTime): List<PushSubscription>
    fun countByActiveTrue(): Long
    fun findAllByOwnerId(ownerId: String): List<PushSubscription>
}

interface SubscriptionMetricSnapshotRepository : JpaRepository<SubscriptionMetricSnapshot, Long> {
    fun findFirstByOrderByCapturedAtDesc(): SubscriptionMetricSnapshot?
}

interface EditorialAuditLogRepository : JpaRepository<EditorialAuditLog, Long> {
    fun findTop100ByOrderByCreatedAtDesc(): List<EditorialAuditLog>
    fun existsByActionAndCreatedAtAfter(action: String, createdAt: OffsetDateTime): Boolean
}

interface StoryCorrectionRepository : JpaRepository<StoryCorrection, Long> {
    fun findAllByStoryIdOrderByCreatedAtDesc(storyId: Long): List<StoryCorrection>
    fun findTop100ByOrderByCreatedAtDesc(): List<StoryCorrection>
}

interface PushDeliveryAttemptRepository : JpaRepository<PushDeliveryAttempt, Long> {
    fun findByEditionIdAndSubscriptionId(editionId: Long, subscriptionId: Long): PushDeliveryAttempt?
    fun countByEditionIdAndState(editionId: Long, state: DeliveryState): Long
    fun findTop200ByOrderByCreatedAtDesc(): List<PushDeliveryAttempt>
    fun findAllByEditionIdAndState(editionId: Long, state: DeliveryState): List<PushDeliveryAttempt>
}

interface ReaderPreferenceRepository : JpaRepository<ReaderPreference, Long> {
    fun findByOwnerId(ownerId: String): ReaderPreference?
}

interface ReaderEventRepository : JpaRepository<ReaderEvent, Long> {
    fun findAllByCreatedAtAfter(createdAt: OffsetDateTime): List<ReaderEvent>
    fun findAllByCreatedAtBefore(createdAt: OffsetDateTime): List<ReaderEvent>
    fun existsByTypeAndEditionIdAndStoryIdAndActorHash(type: kr.briefly.domain.ReaderEventType, editionId: Long, storyId: Long?, actorHash: String): Boolean
}
