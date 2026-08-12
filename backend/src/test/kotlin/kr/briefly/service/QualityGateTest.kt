package kr.briefly.service

import kr.briefly.domain.VerificationStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class QualityGateTest {
    private val gate = QualityGate()

    @Test fun `복수 출처와 1차 자료를 확인하면 발행할 수 있다`() {
        val result = gate.evaluate(3, hasPrimarySource = true, factsChecked = true, sourcesConflict = false)
        assertThat(result.publishable).isTrue()
        assertThat(result.status).isEqualTo(VerificationStatus.VERIFIED)
        assertThat(result.score).isEqualTo(100)
    }

    @Test fun `단일 출처는 발행하지 않는다`() {
        val result = gate.evaluate(1, hasPrimarySource = false, factsChecked = true, sourcesConflict = false)
        assertThat(result.publishable).isFalse()
        assertThat(result.status).isEqualTo(VerificationStatus.SINGLE_SOURCE)
    }

    @Test fun `복수 출처라도 공통 사실을 확인하지 못하면 발행하지 않는다`() {
        val result = gate.evaluate(3, hasPrimarySource = false, factsChecked = false, sourcesConflict = false)
        assertThat(result.publishable).isFalse()
        assertThat(result.status).isEqualTo(VerificationStatus.DEVELOPING)
    }

    @Test fun `출처가 충돌하면 복수 출처여도 발행하지 않는다`() {
        val result = gate.evaluate(3, hasPrimarySource = true, factsChecked = true, sourcesConflict = true)
        assertThat(result.publishable).isFalse()
        assertThat(result.status).isEqualTo(VerificationStatus.CONFLICTING)
    }

    @Test fun `같은 한국 언론사의 하위 도메인은 하나의 출처 계열이다`() {
        assertThat(newsSourceFamily("https://news.kbs.co.kr/news/view.do?id=1"))
            .isEqualTo("kbs.co.kr")
        assertThat(newsSourceFamily("https://sports.kbs.co.kr/article/2"))
            .isEqualTo("kbs.co.kr")
    }

    @Test fun `서로 다른 한국 언론사는 다른 출처 계열이다`() {
        assertThat(newsSourceFamily("https://news.kbs.co.kr/news/view.do?id=1"))
            .isNotEqualTo(newsSourceFamily("https://imnews.imbc.com/news/2026/article/2"))
    }
}
