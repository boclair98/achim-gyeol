package kr.briefly.integration

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.util.HtmlUtils
import tools.jackson.databind.JsonNode
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.net.URI
import java.time.OffsetDateTime
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

data class CollectedArticle(
    val title: String,
    val description: String,
    val originalUrl: String,
    val publishedAt: OffsetDateTime,
    val publisher: String,
)

data class AiFact(val statement: String, val sourceIds: List<String>)

data class AiSummary(
    val title: String,
    val summary: String,
    val whyItMatters: String,
    val keyFacts: List<AiFact>,
    val uncertainty: String?,
    val sourcesConflict: Boolean,
)

interface NewsProvider {
    fun search(query: String, display: Int = 100): List<CollectedArticle>
}

interface AiSummarizer {
    fun summarize(articles: List<CollectedArticle>): AiSummary
}

@Component
@ConditionalOnExpression(
    "T(org.springframework.util.StringUtils).hasText('\${app.news.naver.client-id:}') && " +
        "T(org.springframework.util.StringUtils).hasText('\${app.news.naver.client-secret:}')",
)
class NaverNewsClient(
    @Value("\${app.news.naver.client-id}") private val clientId: String,
    @Value("\${app.news.naver.client-secret}") private val clientSecret: String,
    @Value("\${app.news.naver.base-url:https://naverapihub.apigw.ntruss.com}") baseUrl: String,
) : NewsProvider {
    private val client = RestClient.builder().baseUrl(baseUrl).build()

    override fun search(query: String, display: Int): List<CollectedArticle> {
        val root = client.get()
            .uri {
                it.path("/search/v1/news")
                    .queryParam("query", query)
                    .queryParam("display", display.coerceIn(1, 100))
                    .queryParam("sort", "date")
                    .build()
            }
            .header("X-NCP-APIGW-API-KEY-ID", clientId)
            .header("X-NCP-APIGW-API-KEY", clientSecret)
            .retrieve()
            .body(JsonNode::class.java)
            ?: return emptyList()

        return root.path("items").mapNotNull { item ->
            val originalUrl = item.path("originallink").asText().ifBlank { item.path("link").asText() }
            val publishedAt = runCatching {
                ZonedDateTime.parse(item.path("pubDate").asText(), DateTimeFormatter.RFC_1123_DATE_TIME).toOffsetDateTime()
            }.getOrNull() ?: return@mapNotNull null
            if (originalUrl.isBlank()) return@mapNotNull null

            CollectedArticle(
                title = cleanText(item.path("title").asText()),
                description = cleanText(item.path("description").asText()),
                originalUrl = originalUrl,
                publishedAt = publishedAt,
                publisher = publisherFrom(originalUrl),
            )
        }
    }

    private fun cleanText(value: String): String = HtmlUtils.htmlUnescape(value.replace(Regex("<[^>]+>"), "")).trim()

    private fun publisherFrom(url: String): String = runCatching {
        URI(url).host?.removePrefix("www.")?.takeIf(String::isNotBlank)
    }.getOrNull() ?: "원문 출처"
}

@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('\${app.ai.openai.api-key:}')")
class OpenAiSummarizer(
    @Value("\${app.ai.openai.api-key}") private val apiKey: String,
    @Value("\${app.ai.openai.model:gpt-5-mini}") private val model: String,
) : AiSummarizer {
    private val mapper = jacksonObjectMapper()
    private val client = RestClient.builder()
        .baseUrl("https://api.openai.com/v1")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .build()

    override fun summarize(articles: List<CollectedArticle>): AiSummary {
        require(articles.size >= 2) { "교차 검증에는 기사 두 건 이상이 필요합니다" }

        val evidence = articles.mapIndexed { index, article ->
            "[S${index + 1}] 언론사=${article.publisher} | 시각=${article.publishedAt} | 제목=${article.title} | 설명=${article.description} | 원문=${article.originalUrl}"
        }.joinToString("\n")
        val sourceIds = articles.indices.map { "S${it + 1}" }
        val schema = summarySchema(sourceIds)
        val body = mapOf(
            "model" to model,
            "store" to false,
            "max_output_tokens" to 1400,
            "input" to listOf(
                mapOf(
                    "role" to "developer",
                    "content" to """
                        당신은 한국어 아침 뉴스 브리핑의 팩트 에디터입니다.
                        제공된 기사 제목과 설명에 공통으로 명시된 사실만 사용하세요. 한 출처에만 있는 주장, 추측, 선정적 표현은 제외하세요.
                        title은 중립적인 자체 제목, summary는 무슨 일·핵심 수치/범위·현재 상태를 담은 정확히 3문장, whyItMatters는 독자에게 미치는 영향을 1~2문장으로 작성하세요.
                        keyFacts의 각 사실에는 그 사실을 직접 뒷받침하는 sourceIds를 두 개 이상 넣으세요. 출처가 충돌하면 sourcesConflict=true로 하고 uncertainty에 충돌 내용을 적으세요.
                        근거가 부족하면 사실을 만들어내지 말고 uncertainty에 명시하세요.
                    """.trimIndent(),
                ),
                mapOf("role" to "user", "content" to evidence),
            ),
            "text" to mapOf(
                "format" to mapOf(
                    "type" to "json_schema",
                    "name" to "verified_news_summary",
                    "strict" to true,
                    "schema" to schema,
                ),
            ),
        )

        val root = client.post().uri("/responses").body(body).retrieve().body(JsonNode::class.java)
            ?: error("OpenAI 응답이 비어 있습니다")
        val responseText = extractOutputText(root)
        val json = mapper.readTree(responseText)
        val facts = json.path("keyFacts").values().map { fact ->
            AiFact(
                statement = fact.path("statement").asText(),
                sourceIds = fact.path("sourceIds").values().map { it.asText() }.distinct(),
            )
        }
        return AiSummary(
            title = json.path("title").asText(),
            summary = json.path("summary").asText(),
            whyItMatters = json.path("whyItMatters").asText(),
            keyFacts = facts,
            uncertainty = json.path("uncertainty").asText().takeIf(String::isNotBlank),
            sourcesConflict = json.path("sourcesConflict").asBoolean(false),
        )
    }

    private fun extractOutputText(root: JsonNode): String {
        for (output in root.path("output")) {
            for (content in output.path("content")) {
                if (content.path("type").asText() == "output_text") {
                    return content.path("text").asText().takeIf(String::isNotBlank)
                        ?: error("OpenAI 요약 본문이 비어 있습니다")
                }
            }
        }
        val refusal = root.path("output").flatMap { it.path("content").toList() }
            .firstOrNull { it.path("type").asText() == "refusal" }
            ?.path("refusal")?.asText()
        error(refusal?.let { "OpenAI가 요약을 거부했습니다: $it" } ?: "OpenAI 요약 형식을 읽을 수 없습니다")
    }

    private fun summarySchema(sourceIds: List<String>): Map<String, Any> = mapOf(
        "type" to "object",
        "additionalProperties" to false,
        "properties" to mapOf(
            "title" to mapOf("type" to "string"),
            "summary" to mapOf("type" to "string"),
            "whyItMatters" to mapOf("type" to "string"),
            "keyFacts" to mapOf(
                "type" to "array",
                "minItems" to 1,
                "maxItems" to 5,
                "items" to mapOf(
                    "type" to "object",
                    "additionalProperties" to false,
                    "properties" to mapOf(
                        "statement" to mapOf("type" to "string"),
                        "sourceIds" to mapOf(
                            "type" to "array",
                            "minItems" to 2,
                            "items" to mapOf("type" to "string", "enum" to sourceIds),
                        ),
                    ),
                    "required" to listOf("statement", "sourceIds"),
                ),
            ),
            "uncertainty" to mapOf("type" to "string"),
            "sourcesConflict" to mapOf("type" to "boolean"),
        ),
        "required" to listOf("title", "summary", "whyItMatters", "keyFacts", "uncertainty", "sourcesConflict"),
    )
}
