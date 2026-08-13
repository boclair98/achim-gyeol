package kr.briefly.service

import kr.briefly.domain.Category
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class BalancedAiCandidateSelectionTest {
    @Test
    fun `AI 후보는 특정 분야가 독점하지 않도록 라운드 로빈으로 고른다`() {
        val clusters = listOf(
            cluster(Category.POLICY, 99),
            cluster(Category.POLICY, 89),
            cluster(Category.POLICY, 79),
            cluster(Category.ECONOMY, 98),
            cluster(Category.ECONOMY, 88),
            cluster(Category.SOCIETY, 97),
            cluster(Category.TECH, 96),
        )

        val selected = selectBalancedAiCandidates(clusters, maxPerCategory = 3, maxTotal = 6)

        assertThat(selected.map(ArticleCluster::category)).containsExactly(
            Category.POLICY,
            Category.ECONOMY,
            Category.SOCIETY,
            Category.TECH,
            Category.POLICY,
            Category.ECONOMY,
        )
        assertThat(selected.map(ArticleCluster::rank)).containsExactly(99, 98, 97, 96, 89, 88)
    }

    @Test
    fun `분야별 후보 수와 전체 AI 호출 수를 함께 제한한다`() {
        val clusters = Category.entries.flatMap { category ->
            (1..6).map { offset -> cluster(category, 100 - offset) }
        }

        val selected = selectBalancedAiCandidates(clusters, maxPerCategory = 2, maxTotal = 18)

        assertThat(selected).hasSize(18)
        assertThat(selected.groupingBy(ArticleCluster::category).eachCount().values).containsOnly(2)
    }

    private fun cluster(category: Category, rank: Int) = ArticleCluster(category, emptyList(), rank)
}
