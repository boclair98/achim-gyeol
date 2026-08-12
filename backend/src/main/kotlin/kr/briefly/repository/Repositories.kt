package kr.briefly.repository

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.FeedbackType
import kr.briefly.domain.NewsStory
import kr.briefly.domain.StoryFeedback
import kr.briefly.domain.PushSubscription
import kr.briefly.domain.SubscriptionMetricSnapshot
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.time.OffsetDateTime

interface BriefingEditionRepository : JpaRepository<BriefingEdition, Long> {
    fun findFirstByOrderByBriefingDateDesc(): BriefingEdition?
    fun findByBriefingDate(date: LocalDate): BriefingEdition?
}

interface NewsStoryRepository : JpaRepository<NewsStory, Long>

interface StoryFeedbackRepository : JpaRepository<StoryFeedback, Long> {
    fun existsByStoryIdAndUserIdAndType(storyId: Long, userId: String, type: FeedbackType): Boolean
    fun findAllByCreatedAtBefore(cutoff: OffsetDateTime): List<StoryFeedback>
}

interface PushSubscriptionRepository : JpaRepository<PushSubscription, Long> {
    fun findByEndpointHash(endpointHash: String): PushSubscription?
    fun findAllByActiveTrue(): List<PushSubscription>
    fun findAllByActiveFalseAndUpdatedAtBefore(cutoff: OffsetDateTime): List<PushSubscription>
    fun countByActiveTrue(): Long
}

interface SubscriptionMetricSnapshotRepository : JpaRepository<SubscriptionMetricSnapshot, Long> {
    fun findFirstByOrderByCapturedAtDesc(): SubscriptionMetricSnapshot?
}
