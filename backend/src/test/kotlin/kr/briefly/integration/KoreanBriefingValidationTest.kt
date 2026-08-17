package kr.briefly.integration

import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test

class KoreanBriefingValidationTest {
    @Test
    fun `해외 기사도 모든 독자 노출 필드를 한국어로 작성해야 한다`() {
        val summary = validSummary().copy(summary = "Global markets fell after the announcement.")

        assertThatThrownBy { requireKoreanBriefing(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("한국어")
    }

    @Test
    fun `고유명사와 약어가 섞인 한국어 요약은 허용한다`() {
        requireKoreanBriefing(
            validSummary().copy(
                title = "미 연준, 기준금리 동결",
                summary = "미국 연방준비제도(Fed)는 기준금리를 동결했습니다. 향후 결정은 물가와 고용 지표를 확인해 내리겠다고 밝혔습니다.",
            ),
        )
    }

    private fun validSummary() = AiSummary(
        title = "주요 정책 변화가 발표됐습니다",
        oneLineSummary = "복수의 출처가 같은 정책 변화를 확인했습니다.",
        summary = "정부가 새로운 정책을 발표했습니다. 구체적인 시행 시점은 추가 발표가 필요합니다.",
        whyItMatters = "생활과 비용에 영향을 줄 수 있어 적용 대상을 확인해야 합니다.",
        whatToWatch = "후속 시행계획 발표를 확인해야 합니다.",
        keyFacts = listOf(
            AiFact("정책 발표 사실은 두 출처에서 확인됐습니다.", listOf("S1", "S2")),
            AiFact("시행 시점은 아직 확정되지 않았습니다.", listOf("S1", "S2")),
        ),
        uncertainty = "세부 적용 기준은 아직 공개되지 않았습니다.",
        sourcesConflict = false,
        importanceScore = 80,
        recommendedForMorningBriefing = true,
        importanceReason = "많은 사람의 생활에 영향을 줄 수 있는 변화입니다.",
        backgroundContext = "이 정책을 담당하는 기관과 적용 대상의 관계를 먼저 이해하면 됩니다.",
        plainExplanation = "쉽게 말하면 지원을 받는 방식이 달라질 수 있다는 뜻입니다.",
    )
}
