package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.integration.CollectedArticle
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime

class ArticleClustererTest {
    private val clusterer = ArticleClusterer()

    @Test
    fun `같은 사건의 서로 다른 언론사 기사를 묶는다`() {
        val articles = listOf(
            article("기준금리 동결 결정, 물가 흐름 더 지켜본다", "a.example.com", "https://a.example.com/1"),
            article("물가 흐름 주시하며 기준금리 동결 결정", "b.example.com", "https://b.example.com/2"),
            article("프로야구 경기 우천 취소", "c.example.com", "https://c.example.com/3"),
        )

        val clusters = clusterer.cluster(Category.ECONOMY, articles)

        assertThat(clusters).hasSize(1)
        assertThat(clusters.first().articles.map { it.publisher }).containsExactlyInAnyOrder("a.example.com", "b.example.com")
    }

    @Test
    fun `한 언론사만 보도한 사건은 후보에서 제외한다`() {
        val articles = listOf(
            article("새로운 정책 발표", "a.example.com", "https://a.example.com/1"),
            article("새로운 정책 발표 후속 보도", "a.example.com", "https://a.example.com/2"),
        )

        assertThat(clusterer.cluster(Category.POLICY, articles)).isEmpty()
    }

    private fun article(title: String, publisher: String, url: String) = CollectedArticle(
        title = title,
        description = title,
        originalUrl = url,
        publishedAt = OffsetDateTime.now(),
        publisher = publisher,
    )
}
