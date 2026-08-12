package kr.briefly.service

import kr.briefly.domain.VerificationStatus
import org.springframework.stereotype.Component

data class QualityDecision(val score: Int, val status: VerificationStatus, val publishable: Boolean, val reasons: List<String> = emptyList())

@Component
class QualityGate {
    fun evaluate(
        independentSources: Int,
        hasPrimarySource: Boolean,
        factsChecked: Boolean,
        sourcesConflict: Boolean,
        verifiedClaims: Int = if (factsChecked) 2 else 0,
        allClaimsMultiSource: Boolean = factsChecked,
        staleEvidence: Boolean = false,
        promotionalLanguage: Boolean = false,
    ): QualityDecision {
        val reasons = buildList {
            if (independentSources < 2) add("독립 출처 부족")
            if (!factsChecked || verifiedClaims < 2) add("검증된 핵심 사실 부족")
            if (!allClaimsMultiSource) add("단일 출처 주장 포함")
            if (sourcesConflict) add("출처 간 충돌")
            if (staleEvidence) add("브리핑 대상일과 맞지 않는 근거")
            if (promotionalLanguage) add("홍보성 표현 감지")
        }
        val score = (independentSources.coerceAtMost(3) * 20) + (if (hasPrimarySource) 20 else 0) +
            (if (factsChecked && allClaimsMultiSource && verifiedClaims >= 2) 20 else 0) -
            (if (sourcesConflict) 25 else 0) - (if (staleEvidence) 15 else 0) - (if (promotionalLanguage) 10 else 0)
        val status = when {
            sourcesConflict -> VerificationStatus.CONFLICTING
            independentSources < 2 -> VerificationStatus.SINGLE_SOURCE
            score >= 80 -> VerificationStatus.VERIFIED
            else -> VerificationStatus.DEVELOPING
        }
        val publishable = independentSources >= 2 && factsChecked && verifiedClaims >= 2 && allClaimsMultiSource && !sourcesConflict && !staleEvidence && !promotionalLanguage
        return QualityDecision(score.coerceIn(0, 100), status, publishable, reasons)
    }
}
