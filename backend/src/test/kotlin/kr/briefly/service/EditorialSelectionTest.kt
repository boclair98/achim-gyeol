package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.domain.NewsStory
import kr.briefly.domain.VerificationStatus
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test

class EditorialSelectionTest {
    @Test
    fun `최종 편집기가 선택한 후보만 지정한 순서로 적용한다`() {
        val economy = candidate("경제", Category.ECONOMY, 90)
        val society = candidate("사회", Category.SOCIETY, 85)
        val tech = candidate("기술", Category.TECH, 80)

        val selected = resolveEditorialSelection(
            linkedMapOf("N1" to economy, "N2" to society, "N3" to tech),
            orderedRefs = listOf("N3", "N1", "N3"),
        )

        assertThat(selected).containsExactly(tech, economy)
    }

    @Test
    fun `알 수 없는 후보만 반환하면 안전한 기본 순서로 대체할 수 있도록 실패한다`() {
        val economy = candidate("경제", Category.ECONOMY, 90)

        assertThatThrownBy {
            resolveEditorialSelection(mapOf("N1" to economy), listOf("UNKNOWN"))
        }.isInstanceOf(IllegalStateException::class.java)
    }

    private fun candidate(title: String, category: Category, importance: Int) = EditorialStory(
        NewsStory(
            category = category,
            title = title,
            summary = "$title 요약",
            oneLineSummary = "$title 핵심",
            whyItMatters = "$title 의미",
            verificationStatus = VerificationStatus.VERIFIED,
            qualityScore = 90,
            displayOrder = 0,
        ),
        importanceScore = importance,
        clusterRank = importance,
    )
}
