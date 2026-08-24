package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.domain.NewsStory
import kr.briefly.domain.VerificationStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class BriefingCoveragePolicyTest {
    private val policy = BriefingCoveragePolicy(minimumStories = 8, minimumCategories = 5)

    @Test
    fun `두 건이거나 한 분야에 몰린 브리핑은 목표를 채우지 못한다`() {
        val decision = policy.evaluate(listOf(story(Category.TECH), story(Category.TECH)))

        assertThat(decision.ready).isTrue()
        assertThat(decision.targetMet).isFalse()
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
        assertThat(decision.targetMet).isTrue()
        assertThat(decision.storyCount).isEqualTo(8)
        assertThat(decision.categoryCount).isEqualTo(8)
    }

    @Test
    fun `스포츠와 e스포츠가 없어도 전날 뉴스는 발송 준비가 된다`() {
        val requiredPolicy = BriefingCoveragePolicy(10, 5, "SPORTS,ESPORTS")
        val stories = listOf(
            Category.POLICY, Category.ECONOMY, Category.SOCIETY, Category.INTERNATIONAL,
            Category.TECH, Category.LIFE, Category.CULTURE, Category.SPORTS, Category.FINANCE, Category.TECH,
        ).map(::story)

        val decision = requiredPolicy.evaluate(stories)

        assertThat(decision.ready).isTrue()
        assertThat(decision.targetMet).isFalse()
        assertThat(decision.reasons).contains("해당 분야 뉴스 없음: e스포츠")
    }

    @Test
    fun `열 건보다 적어도 스포츠와 e스포츠가 있으면 중요 뉴스는 발송한다`() {
        val requiredPolicy = BriefingCoveragePolicy(10, 5, "SPORTS,ESPORTS")
        val stories = listOf(
            Category.SPORTS, Category.ESPORTS, Category.TECH,
        ).map(::story)

        val decision = requiredPolicy.evaluate(stories)

        assertThat(decision.ready).isTrue()
        assertThat(decision.targetMet).isFalse()
        assertThat(decision.reasons).contains("뉴스 수 부족: 3/10", "분야 다양성 부족: 3/5")
    }

    @Test
    fun `스포츠와 e스포츠를 포함한 열 건은 발송할 수 있다`() {
        val requiredPolicy = BriefingCoveragePolicy(10, 5, "SPORTS,ESPORTS")
        val stories = listOf(
            Category.POLICY, Category.ECONOMY, Category.SOCIETY, Category.INTERNATIONAL,
            Category.TECH, Category.LIFE, Category.CULTURE, Category.SPORTS, Category.ESPORTS, Category.FINANCE,
        ).map(::story)

        val decision = requiredPolicy.evaluate(stories)

        assertThat(decision.ready).isTrue()
        assertThat(decision.targetMet).isTrue()
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
