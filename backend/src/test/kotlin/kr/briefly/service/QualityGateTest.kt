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
}
