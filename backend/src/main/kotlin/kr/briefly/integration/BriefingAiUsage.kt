package kr.briefly.integration

import tools.jackson.databind.JsonNode

data class BriefingAiUsage(
    val model: String,
    val inputTokens: Long,
    val cachedInputTokens: Long,
    val cacheWriteTokens: Long,
    val outputTokens: Long,
) {
    /** Estimate Standard text-token charges; the provider invoice is authoritative. */
    fun estimateUsd(): Double? {
        val inputRate = when (model) {
            "gpt-6.1-terra" -> 1.0
            "gpt-6.1-sol" -> 2.0
            else -> return null
        }
        val inputScale = if (inputTokens > 272_000) 2.0 else 1.0
        val outputScale = if (inputTokens > 272_000) 1.5 else 1.0
        return ((inputTokens - cachedInputTokens - cacheWriteTokens +
            cachedInputTokens * 0.05 + cacheWriteTokens * 1.25) * inputRate * inputScale +
            outputTokens * inputRate * 5 * outputScale) / 1_000_000
    }
}

internal fun briefingAiUsage(root: JsonNode, model: String): BriefingAiUsage? {
    val usage = root.path("usage")
    val input = usage.path("input_tokens").asLong(-1)
    val output = usage.path("output_tokens").asLong(-1)
    if (input < 0 || output < 0) return null
    val details = usage.path("input_tokens_details")
    val cached = details.path("cached_tokens").asLong(0).coerceIn(0, input)
    val writes = details.path("cache_write_tokens").asLong(0).coerceIn(0, input - cached)
    return BriefingAiUsage(model, input, cached, writes, output)
}

data class PreviousNewsContext(val title: String, val oneLineSummary: String, val facts: List<String>)
