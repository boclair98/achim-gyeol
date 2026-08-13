package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.domain.NewsStory
import kr.briefly.domain.VerificationStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class BriefingStoryPersonalizerTest {
    @Test
    fun `공통 핵심 세 건은 유지하고 이후 카드만 관심도에 따라 정렬한다`() {
        val stories = listOf(
            story(1, Category.POLICY),
            story(2, Category.ECONOMY),
            story(3, Category.SOCIETY),
            story(4, Category.CULTURE),
            story(5, Category.TECH),
            story(6, Category.SPORTS),
        )

        val ordered = BriefingStoryPersonalizer.order(
            stories,
            mapOf(Category.TECH to 4, Category.CULTURE to -2),
        )

        assertThat(ordered.map { it.displayOrder }).containsExactly(1, 2, 3, 5, 6, 4)
    }

    @Test
    fun `관심 신호가 없으면 편집 순서를 그대로 유지한다`() {
        val stories = listOf(story(2, Category.TECH), story(1, Category.POLICY))

        val ordered = BriefingStoryPersonalizer.order(stories, emptyMap())

        assertThat(ordered.map { it.displayOrder }).containsExactly(1, 2)
    }

    private fun story(order: Int, category: Category) = NewsStory(
        category = category,
        title = "$category 뉴스",
        summary = "확인된 사실입니다.",
        whyItMatters = "알아야 할 이유입니다.",
        verificationStatus = VerificationStatus.VERIFIED,
        qualityScore = 90,
        displayOrder = order,
        id = order.toLong(),
    )
}
