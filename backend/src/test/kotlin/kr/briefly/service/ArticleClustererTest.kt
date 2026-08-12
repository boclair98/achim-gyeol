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
            article("기준금리 동결 결정, 물가 흐름 더 지켜본다", "a-news.com", "https://a-news.com/1"),
            article("물가 흐름 주시하며 기준금리 동결 결정", "b-media.net", "https://b-media.net/2"),
            article("프로야구 경기 우천 취소", "c-sports.kr", "https://c-sports.kr/3"),
        )

        val clusters = clusterer.cluster(Category.ECONOMY, articles)

        assertThat(clusters).hasSize(1)
        assertThat(clusters.first().articles.map { it.publisher }).containsExactlyInAnyOrder("a-news.com", "b-media.net")
    }

    @Test
    fun `한 언론사만 보도한 사건은 후보에서 제외한다`() {
        val articles = listOf(
            article("새로운 정책 발표", "a.example.com", "https://a.example.com/1"),
            article("새로운 정책 발표 후속 보도", "a.example.com", "https://a.example.com/2"),
        )

        assertThat(clusterer.cluster(Category.POLICY, articles)).isEmpty()
    }

    @Test
    fun `표시 언론사명이 달라도 같은 도메인은 하나의 출처로 센다`() {
        val articles = listOf(
            article("기준금리 동결 결정", "KBS 뉴스", "https://news.kbs.co.kr/news/1"),
            article("기준금리 동결 결정", "KBS 경제", "https://economy.kbs.co.kr/news/2"),
        )

        assertThat(clusterer.cluster(Category.ECONOMY, articles)).isEmpty()
    }

    @Test
    fun `공공 영향 신호가 있는 복수 출처 사건은 개수 제한 없이 정렬 후보가 된다`() {
        val topics = listOf("연금 개편", "건강보험 조정", "기준금리 결정", "부동산 세제", "교육과정 개편", "고용보험 확대", "개인정보 규제")
        val articles = topics.mapIndexed { event, topic ->
            listOf(
                article("$topic 세부안", "a$event-news.com", "https://a$event-news.com/1"),
                article("$topic 세부안 발표", "b$event-media.net", "https://b$event-media.net/2"),
            )
        }.flatten()

        assertThat(clusterer.cluster(Category.POLICY, articles, limit = 20)).hasSize(7)
    }

    @Test
    fun `표현이 달라도 중간 기사를 통해 같은 사건으로 이어 묶는다`() {
        val articles = listOf(
            article("정부, 7대 첨단기술 SEED 프로젝트 발표", "a-news.com", "https://a-news.com/seed"),
            article("7대 첨단기술 씨앗 프로젝트에 SMR·양자 포함", "b-media.net", "https://b-media.net/seed"),
            article("SMR·양자 포함 첨단기술 씨앗 육성안 공개", "c-daily.kr", "https://c-daily.kr/seed"),
        )

        val clusters = clusterer.cluster(Category.TECH, articles)

        assertThat(clusters).hasSize(1)
        assertThat(clusters.first().articles).hasSize(3)
    }

    private fun article(title: String, publisher: String, url: String) = CollectedArticle(
        title = title,
        description = title,
        originalUrl = url,
        publishedAt = OffsetDateTime.now(),
        publisher = publisher,
    )
}
