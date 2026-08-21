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
        val summary = validSummary().copy(
            title = "미 연준, 기준금리 동결",
            summary = "미국 연방준비제도(Fed)는 기준금리를 동결했습니다. 복수의 출처는 물가와 고용 지표를 더 확인하겠다는 설명을 전했습니다. 향후 결정 시점은 아직 확정되지 않았습니다.",
        )

        requireKoreanBriefing(summary)
        requireBriefingContentShape(summary)
    }

    @Test
    fun `한 줄 요약은 60자를 넘길 수 없다`() {
        val summary = validSummary().copy(oneLineSummary = "가".repeat(61))

        assertThatThrownBy { requireBriefingContentShape(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("60자")
    }

    @Test
    fun `한 줄 요약에는 줄바꿈을 넣을 수 없다`() {
        val summary = validSummary().copy(
            oneLineSummary = "정부가 정책을 발표했습니다\n세부 기준은 추후 공개됩니다",
        )

        assertThatThrownBy { requireBriefingContentShape(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("줄바꿈")
    }

    @Test
    fun `한 줄 요약에는 두 문장을 넣을 수 없다`() {
        val summary = validSummary().copy(
            oneLineSummary = "정부가 정책을 발표했습니다. 세부 기준은 추후 공개됩니다.",
        )

        assertThatThrownBy { requireBriefingContentShape(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("한 문장")
    }

    @Test
    fun `상세 요약은 최소 두 문장이어야 한다`() {
        val summary = validSummary().copy(summary = "정부가 새로운 정책을 발표했습니다.")

        assertThatThrownBy { requireBriefingContentShape(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("최소 두 문장")
    }

    @Test
    fun `상단 문구를 상세 필드에 그대로 반복할 수 없다`() {
        val base = validSummary()
        val summary = base.copy(backgroundContext = "  ${base.oneLineSummary}  ")

        assertThatThrownBy { requireBriefingContentShape(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("반복")
    }

    @Test
    fun `상세 필드의 결합 분량은 한 줄 요약보다 길어야 한다`() {
        val summary = validSummary().copy(
            oneLineSummary = "중요한 변화가 확인돼 후속 발표를 계속 살펴봐야 합니다.",
            summary = "가. 나.",
            backgroundContext = "다",
            plainExplanation = "라",
            whyItMatters = "마",
            whatToWatch = "바",
        )

        assertThatThrownBy { requireBriefingContentShape(summary) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("결합 분량")
    }

    private fun validSummary() = AiSummary(
        title = "주요 정책 변화가 발표됐습니다",
        oneLineSummary = "복수의 출처가 같은 정책 변화를 확인했습니다.",
        summary = "정부가 새로운 정책을 발표했습니다. 복수의 출처는 적용 대상과 발표 시점을 같은 내용으로 전했습니다. 구체적인 시행 기준은 후속 발표가 필요한 상태입니다.",
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
        backgroundContext = "이 정책을 담당하는 기관이 적용 대상을 정합니다. 세부 기준은 후속 시행계획에서 확정됩니다.",
        plainExplanation = "지원 대상에 포함되면 신청 방식이 달라질 수 있습니다. 지급 시점은 추가 발표를 확인해야 합니다.",
    )
}
