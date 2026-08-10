package kr.briefly.integration

import tools.jackson.databind.JsonNode
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.time.OffsetDateTime
import java.net.URI

data class CollectedArticle(val title: String, val description: String, val originalUrl: String, val publishedAt: OffsetDateTime, val publisher: String)
data class AiSummary(val title: String, val summary: String, val whyItMatters: String)

interface NewsProvider { fun search(query: String, display: Int = 30): List<CollectedArticle> }
interface AiSummarizer { fun summarize(articles: List<CollectedArticle>): AiSummary }

@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('\${app.news.naver.client-id:}') && T(org.springframework.util.StringUtils).hasText('\${app.news.naver.client-secret:}')")
class NaverNewsClient(
    @Value("\${app.news.naver.client-id}") private val clientId: String,
    @Value("\${app.news.naver.client-secret}") private val clientSecret: String,
) : NewsProvider {
    private val client = RestClient.builder().baseUrl("https://openapi.naver.com").build()
    override fun search(query: String, display: Int): List<CollectedArticle> {
        val root = client.get().uri { it.path("/v1/search/news.json").queryParam("query", query).queryParam("display", display.coerceIn(1, 100)).queryParam("sort", "date").build() }
            .header("X-Naver-Client-Id", clientId).header("X-Naver-Client-Secret", clientSecret).retrieve().body(JsonNode::class.java) ?: return emptyList()
        return root.path("items").map { item ->
            val originalUrl = item.path("originallink").asText()
            CollectedArticle(item.path("title").asText().replace(Regex("<[^>]+>"), ""), item.path("description").asText().replace(Regex("<[^>]+>"), ""), originalUrl, java.time.ZonedDateTime.parse(item.path("pubDate").asText(), java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME).toOffsetDateTime(), runCatching { URI(originalUrl).host.removePrefix("www.") }.getOrDefault("원문 언론사"))
        }
    }
}

@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('\${app.ai.openai.api-key:}')")
class OpenAiSummarizer(
    @Value("\${app.ai.openai.api-key}") private val apiKey: String,
    @Value("\${app.ai.openai.model:gpt-5.6-luna}") private val model: String,
) : AiSummarizer {
    private val client = RestClient.builder().baseUrl("https://api.openai.com/v1").defaultHeader("Authorization", "Bearer $apiKey").build()
    override fun summarize(articles: List<CollectedArticle>): AiSummary {
        val evidence = articles.joinToString("\n") { "- ${it.title}: ${it.description} (${it.originalUrl})" }
        val schema = mapOf("type" to "object", "additionalProperties" to false, "properties" to mapOf("title" to mapOf("type" to "string"), "summary" to mapOf("type" to "string"), "whyItMatters" to mapOf("type" to "string")), "required" to listOf("title", "summary", "whyItMatters"))
        val body = mapOf("model" to model, "input" to listOf(mapOf("role" to "developer", "content" to "제공된 근거에서 공통으로 확인되는 사실만 한국어로 요약하세요. 추측하지 마세요."), mapOf("role" to "user", "content" to evidence)), "text" to mapOf("format" to mapOf("type" to "json_schema", "name" to "news_summary", "strict" to true, "schema" to schema)))
        val root = client.post().uri("/responses").body(body).retrieve().body(JsonNode::class.java) ?: error("AI 응답이 비어 있습니다")
        val text = root.path("output").path(0).path("content").path(0).path("text").asText().takeIf(String::isNotBlank) ?: error("AI 요약 형식을 읽을 수 없습니다")
        val json = tools.jackson.module.kotlin.jacksonObjectMapper().readTree(text)
        return AiSummary(json.path("title").asText(), json.path("summary").asText(), json.path("whyItMatters").asText())
    }
}
