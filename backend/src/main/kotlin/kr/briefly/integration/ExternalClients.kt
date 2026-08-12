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
    val oneLineSummary: String,
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
    private val mapper = jacksonObjectMapper()
    private val client = RestClient.builder().baseUrl(baseUrl).build()

    override fun search(query: String, display: Int): List<CollectedArticle> {
        val responseBody = client.get()
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
            .body(String::class.java)
            ?: return emptyList()
        val root = mapper.readTree(responseBody)

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
            // GPT-5 reasoning tokens share this budget with the visible JSON output.
            // A very small limit can therefore finish before output_text is emitted.
            "max_output_tokens" to 5000,
            "reasoning" to mapOf("effort" to "low"),
            "input" to listOf(
                mapOf(
                    "role" to "developer",
                    "content" to """
                        당신은 한국어 아침 뉴스 브리핑의 팩트 에디터입니다.
                        제공된 기사 제목과 설명에 공통으로 명시된 사실만 사용하세요. 한 출처에만 있는 주장, 추측, 선정적 표현은 제외하세요.
                        기사 게시 시각과 사건 발생 시각을 혼동하지 마세요. 날짜·수치·인명·기관명·정책 시행 여부는 서로 독립된 출처 두 곳에서 같은 의미로 확인될 때만 확정 사실로 쓰세요.
                        기사 설명만으로 알 수 없는 배경, 원인, 전망을 상식으로 보충하지 마세요. 정부·기업의 계획이나 검토는 확정·시행으로 바꾸어 표현하지 마세요.
                        title은 한눈에 사건을 이해할 수 있는 중립적인 자체 제목으로 작성하세요.
                        oneLineSummary는 기사에 공통으로 확인된 가장 중요한 결론 하나만 70자 이내의 완결된 문장으로 작성하세요.
                        summary는 '무슨 일이 있었는지 → 확인된 핵심 수치·대상·시점 → 현재 확정된 상태' 순서로 2~4문장을 작성하고, 문장마다 하나의 핵심 사실만 담으세요.
                        whyItMatters는 독자가 오늘 알아야 할 영향, 적용 시점, 확인하거나 행동할 사항을 1~2문장으로 구체적으로 작성하세요. 실질적인 행동 사항이 없으면 억지로 만들지 마세요.
                        keyFacts에는 독자가 원문을 읽지 않아도 사건의 확정된 골격을 이해할 수 있도록 중요한 사실을 빠뜨리지 말고 2~5개 담으세요. 각 사실에는 그 사실을 직접 뒷받침하는 sourceIds를 두 개 이상 넣으세요.
                        출처가 충돌하거나 발표 전·검토 중·추산 상태이면 sourcesConflict 또는 uncertainty에 구체적으로 적고 확정형으로 쓰지 마세요.
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
            oneLineSummary = json.path("oneLineSummary").asText(),
            summary = json.path("summary").asText(),
            whyItMatters = json.path("whyItMatters").asText(),
            keyFacts = facts,
            uncertainty = json.path("uncertainty").asText().takeIf(String::isNotBlank),
            sourcesConflict = json.path("sourcesConflict").asBoolean(false),
        )
    }

    private fun extractOutputText(root: JsonNode): String {
        if (root.path("status").asText() == "incomplete") {
            val reason = root.path("incomplete_details").path("reason").asText("unknown")
            error("OpenAI 요약이 완료되지 않았습니다 (reason=$reason)")
        }

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
        val outputTypes = root.path("output").toList()
            .map { it.path("type").asText("unknown") }
            .distinct()
        error(
            refusal?.let { "OpenAI가 요약을 거부했습니다: $it" }
                ?: "OpenAI 요약 형식을 읽을 수 없습니다 (status=${root.path("status").asText("unknown")}, outputTypes=$outputTypes)",
        )
    }

    private fun summarySchema(sourceIds: List<String>): Map<String, Any> = mapOf(
        "type" to "object",
        "additionalProperties" to false,
        "properties" to mapOf(
            "title" to mapOf("type" to "string"),
            "oneLineSummary" to mapOf("type" to "string", "description" to "공통으로 확인된 가장 중요한 결론 한 문장, 70자 이내"),
            "summary" to mapOf("type" to "string", "description" to "무슨 일, 확인된 핵심 수치·대상·시점, 현재 상태를 담은 2~4문장"),
            "whyItMatters" to mapOf("type" to "string", "description" to "독자가 알아야 할 영향·적용 시점·행동 사항 1~2문장"),
            "keyFacts" to mapOf(
                "type" to "array",
                "minItems" to 2,
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
        "required" to listOf("title", "oneLineSummary", "summary", "whyItMatters", "keyFacts", "uncertainty", "sourcesConflict"),
    )
}
