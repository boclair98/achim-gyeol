package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.domain.NewsStory
import kr.briefly.domain.VerificationStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class BriefingCoveragePolicyTest {
    private val policy = BriefingCoveragePolicy(minimumStories = 8, minimumCategories = 5)

    @Test
    fun `두 건이거나 한 분야에 몰린 브리핑은 발송 준비가 아니다`() {
        val decision = policy.evaluate(listOf(story(Category.TECH), story(Category.TECH)))

        assertThat(decision.ready).isFalse()
        assertThat(decision.reasons).contains("뉴스 수 부족: 2/8", "분야 다양성 부족: 1/5")
    }

    @Test
    fun `여덟 건과 다섯 분야를 채우면 발송할 수 있다`() {
        val stories = listOf(
            Category.POLICY, Category.ECONOMY, Category.SOCIETY, Category.INTERNATIONAL,
            Category.TECH, Category.LIFE, Category.CULTURE, Category.SPORTS,
        ).map(::story)

        val decision = policy.evaluate(stories)

        assertThat(decision.ready).isTrue()
        assertThat(decision.storyCount).isEqualTo(8)
        assertThat(decision.categoryCount).isEqualTo(8)
    }

    private fun story(category: Category) = NewsStory(
        category = category,
        title = "검증된 뉴스",
        summary = "두 출처에서 확인했습니다.",
        whyItMatters = "오늘 알아야 합니다.",
        verificationStatus = VerificationStatus.VERIFIED,
        qualityScore = 80,
        displayOrder = 0,
    )
}
