package kr.briefly.service

import kr.briefly.domain.VerificationStatus
import org.springframework.stereotype.Component

data class QualityDecision(val score: Int, val status: VerificationStatus, val publishable: Boolean)

@Component
class QualityGate {
    fun evaluate(independentSources: Int, hasPrimarySource: Boolean, factsChecked: Boolean, sourcesConflict: Boolean): QualityDecision {
        val score = (independentSources.coerceAtMost(3) * 20) + (if (hasPrimarySource) 20 else 0) + (if (factsChecked) 20 else 0) - (if (sourcesConflict) 25 else 0)
        val status = when {
            sourcesConflict -> VerificationStatus.CONFLICTING
            independentSources < 2 -> VerificationStatus.SINGLE_SOURCE
            score >= 80 -> VerificationStatus.VERIFIED
            else -> VerificationStatus.DEVELOPING
        }
        return QualityDecision(score.coerceIn(0, 100), status, independentSources >= 2 && !sourcesConflict)
    }
}
