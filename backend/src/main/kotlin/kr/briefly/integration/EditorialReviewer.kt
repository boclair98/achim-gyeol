package kr.briefly.integration

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import tools.jackson.databind.JsonNode
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.time.Duration

data class EditorialCandidate(
    val ref: String,
    val category: String,
    val title: String,
    val oneLineSummary: String,
    val whyItMatters: String,
    val importanceScore: Int,
    val qualityScore: Int,
    val sourceCount: Int,
    val claims: List<String>,
)

data class EditorialReview(
    val orderedRefs: List<String>,
    val excludedRefs: List<String>,
    val rationale: String,
)

interface AiEditorialReviewer {
    val modelName: String
    fun review(candidates: List<EditorialCandidate>, maxStories: Int): EditorialReview
}

@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('\${app.ai.openai.api-key:}')")
@ConditionalOnProperty(name = ["app.ai.openai.editor.enabled"], havingValue = "true")
class OpenAiEditorialReviewer(
    @Value("\${app.ai.openai.api-key}") apiKey: String,
    @Value("\${app.ai.openai.editor.model:gpt-5.6-sol}") override val modelName: String,
    @Value("\${app.ai.openai.connect-timeout-seconds:10}") connectTimeoutSeconds: Long,
    @Value("\${app.ai.openai.editor.read-timeout-seconds:180}") readTimeoutSeconds: Long,
) : AiEditorialReviewer {
    private val mapper = jacksonObjectMapper()
    private val client = RestClient.builder()
        .baseUrl("https://api.openai.com/v1")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .requestFactory(SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(Duration.ofSeconds(connectTimeoutSeconds.coerceIn(1, 60)))
            setReadTimeout(Duration.ofSeconds(readTimeoutSeconds.coerceIn(30, 300)))
        })
        .build()

    override fun review(candidates: List<EditorialCandidate>, maxStories: Int): EditorialReview {
        require(candidates.isNotEmpty()) { "최종 편집 후보가 없습니다" }
        val refs = candidates.map(EditorialCandidate::ref)
        val evidence = candidates.joinToString("\n\n") { candidate ->
            buildString {
                append("[").append(candidate.ref).append("] 분야=").append(candidate.category)
                append(" | 중요도=").append(candidate.importanceScore)
                append(" | 품질=").append(candidate.qualityScore)
                append(" | 독립출처=").append(candidate.sourceCount)
                append("\n제목: ").append(candidate.title)
                append("\n한줄: ").append(candidate.oneLineSummary)
                append("\n의미: ").append(candidate.whyItMatters)
                append("\n확인된 사실: ").append(candidate.claims.joinToString(" / "))
            }
        }
        val body = mapOf(
            "model" to modelName,
            "store" to false,
            "max_output_tokens" to 3000,
            "reasoning" to mapOf("effort" to "medium"),
            "input" to listOf(
                mapOf(
                    "role" to "developer",
                    "content" to """
                        역할: 한국어 아침 뉴스 브리핑의 최종 편집장입니다.

                        목표: 제공된 후보 중 전날 뉴스를 놓친 일반 독자가 오늘 아침 반드시 이해해야 할 기사들을 고르고 읽을 순서를 정하세요.

                        성공 기준:
                        - 국민 생활·돈·안전·권리와 파급 범위가 큰 뉴스를 앞에 둡니다.
                        - 같은 사건을 반복하는 후보는 하나만 남깁니다.
                        - 분야 균형을 유지하되 중요하지 않은 기사로 숫자를 채우지 않습니다.
                        - 단순 행사·홍보·반복 인용·지역 단신·경기 예고보다 확정된 변화와 결과를 우선합니다.
                        - 각 분야에서 가치 있는 기사를 최대 5건까지 고르고, 후보가 충분하면 전체 최대 허용 수에 가깝게 포함합니다.
                        - 특정 분야에 중요한 후보가 없으면 억지로 채우지 말고 다른 분야의 좋은 기사로 보완합니다.
                        - 출처 수, 품질 점수, 확인된 사실을 함께 고려합니다.

                        제약:
                        - 후보 ref만 선택할 수 있습니다. 새로운 사실이나 기사를 만들지 마세요.
                        - orderedRefs는 가장 중요한 순서이며 중복 없이 최대 $maxStories 개입니다.
                        - excludedRefs에는 중복 또는 아침 브리핑 가치가 낮아 제외한 후보만 넣으세요.
                        - 근거가 비슷하면 기존 중요도와 품질 점수가 높은 후보를 우선하세요.
                    """.trimIndent(),
                ),
                mapOf("role" to "user", "content" to evidence),
            ),
            "text" to mapOf(
                "format" to mapOf(
                    "type" to "json_schema",
                    "name" to "morning_editorial_selection",
                    "strict" to true,
                    "schema" to reviewSchema(refs, maxStories),
                ),
            ),
        )

        val root = client.post().uri("/responses").body(body).retrieve().body(JsonNode::class.java)
            ?: error("OpenAI 최종 편집 응답이 비어 있습니다")
        val json = mapper.readTree(extractOutputText(root))
        return EditorialReview(
            orderedRefs = json.path("orderedRefs").values().map { it.asText() },
            excludedRefs = json.path("excludedRefs").values().map { it.asText() },
            rationale = json.path("rationale").asText().take(1000),
        )
    }

    private fun reviewSchema(refs: List<String>, maxStories: Int): Map<String, Any> = mapOf(
        "type" to "object",
        "additionalProperties" to false,
        "properties" to mapOf(
            "orderedRefs" to mapOf(
                "type" to "array",
                "minItems" to 1,
                "maxItems" to maxStories.coerceAtLeast(1),
                "items" to mapOf("type" to "string", "enum" to refs),
            ),
            "excludedRefs" to mapOf(
                "type" to "array",
                "items" to mapOf("type" to "string", "enum" to refs),
            ),
            "rationale" to mapOf("type" to "string"),
        ),
        "required" to listOf("orderedRefs", "excludedRefs", "rationale"),
    )

    private fun extractOutputText(root: JsonNode): String {
        if (root.path("status").asText() == "incomplete") {
            error("OpenAI 최종 편집이 완료되지 않았습니다 (reason=${root.path("incomplete_details").path("reason").asText("unknown")})")
        }
        root.path("output").forEach { output ->
            output.path("content").forEach { content ->
                if (content.path("type").asText() == "output_text") {
                    return content.path("text").asText().takeIf(String::isNotBlank)
                        ?: error("OpenAI 최종 편집 본문이 비어 있습니다")
                }
            }
        }
        error("OpenAI 최종 편집 형식을 읽을 수 없습니다 (status=${root.path("status").asText("unknown")})")
    }
}
