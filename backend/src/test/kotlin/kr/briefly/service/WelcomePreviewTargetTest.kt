package kr.briefly.service

import kr.briefly.domain.PushSubscription
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime

class WelcomePreviewTargetTest {
    @Test
    fun `selects oldest active operator and only active subscribers without a production delivery`() {
        val now = OffsetDateTime.now()
        val operator = subscription(1, now.minusDays(10), lastSentAt = now.minusHours(8))
        val existing = subscription(2, now.minusDays(5), lastSentAt = now.minusHours(8))
        val newOne = subscription(3, now.minusHours(2))
        val newTwo = subscription(4, now.minusHours(1))
        val inactive = subscription(5, now.minusMinutes(30), active = false)

        val targets = selectWelcomePreviewTargets(listOf(newTwo, inactive, existing, newOne, operator))

        assertThat(targets.operator?.id).isEqualTo(1)
        assertThat(targets.newSubscribers.map { it.id }).containsExactly(3, 4)
        assertThat(targets.all.map { it.id }).containsExactly(1, 3, 4)
    }

    @Test
    fun `does not select a new subscriber whose welcome preview was already sent`() {
        val now = OffsetDateTime.now()
        val operator = subscription(1, now.minusDays(10), lastSentAt = now.minusHours(8))
        val alreadyPreviewed = subscription(2, now.minusHours(2), onboardingPreviewSentAt = now.minusHours(1))

        val targets = selectWelcomePreviewTargets(listOf(operator, alreadyPreviewed))

        assertThat(targets.newSubscribers).isEmpty()
        assertThat(targets.all.map { it.id }).containsExactly(1)
    }

    private fun subscription(
        id: Long,
        createdAt: OffsetDateTime,
        lastSentAt: OffsetDateTime? = null,
        onboardingPreviewSentAt: OffsetDateTime? = null,
        active: Boolean = true,
    ) = PushSubscription(
        ownerId = "owner-$id",
        endpointHash = "hash-$id",
        endpoint = "https://push.example/$id",
        p256dh = "p256dh-$id",
        auth = "auth-$id",
        active = active,
        createdAt = createdAt,
        updatedAt = createdAt,
        lastSentAt = lastSentAt,
        onboardingPreviewSentAt = onboardingPreviewSentAt,
        id = id,
    )
}
