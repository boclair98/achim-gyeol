package kr.briefly.service

import kr.briefly.domain.ReaderEvent
import kr.briefly.domain.ReaderEventType
import kr.briefly.repository.PushSubscriptionRepository
import kr.briefly.repository.ReaderEventRepository
import kr.briefly.repository.ReaderPreferenceRepository
import kr.briefly.repository.StoryFeedbackRepository
import kr.briefly.repository.SubscriptionMetricSnapshotRepository
import org.assertj.core.api.Assertions.assertThat
import org.mockito.ArgumentCaptor
import org.mockito.Mockito

class ReaderExperienceServiceTest {
    private val preferenceRepository = Mockito.mock(ReaderPreferenceRepository::class.java)
    private val eventRepository = Mockito.mock(ReaderEventRepository::class.java)
    private val feedbackRepository = Mockito.mock(StoryFeedbackRepository::class.java)
    private val pushRepository = Mockito.mock(PushSubscriptionRepository::class.java)
    private val snapshotRepository = Mockito.mock(SubscriptionMetricSnapshotRepository::class.java)
    private val service = ReaderExperienceService(
        preferenceRepository,
        eventRepository,
        feedbackRepository,
        pushRepository,
        SubscriptionMetricsService(pushRepository, snapshotRepository),
    )

    @org.junit.jupiter.api.Test
    fun `normalizes and records a known feature vote`() {
        service.recordEvent("device-1", ReaderEventType.PREMIUM_FEATURE_VOTE, 0, null, "  custom_topics  ")

        val captor = ArgumentCaptor.forClass(ReaderEvent::class.java)
        Mockito.verify(eventRepository).save(captor.capture())
        assertThat(captor.value.type).isEqualTo(ReaderEventType.PREMIUM_FEATURE_VOTE)
        assertThat(captor.value.eventKey).isEqualTo("custom_topics")
    }

    @org.junit.jupiter.api.Test
    fun `ignores unknown feature keys`() {
        service.recordEvent("device-1", ReaderEventType.PREMIUM_FEATURE_VOTE, 0, null, "unknown")

        Mockito.verify(eventRepository, Mockito.never()).save(Mockito.any(ReaderEvent::class.java))
    }
}
