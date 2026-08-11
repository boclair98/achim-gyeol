package kr.briefly.repository

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.StoryFeedback
import kr.briefly.domain.PushSubscription
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface BriefingEditionRepository : JpaRepository<BriefingEdition, Long> {
    fun findFirstByOrderByBriefingDateDesc(): BriefingEdition?
    fun findByBriefingDate(date: LocalDate): BriefingEdition?
}

interface StoryFeedbackRepository : JpaRepository<StoryFeedback, Long>

interface PushSubscriptionRepository : JpaRepository<PushSubscription, Long> {
    fun findByEndpointHash(endpointHash: String): PushSubscription?
    fun findAllByActiveTrue(): List<PushSubscription>
}
