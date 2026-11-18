package kr.briefly.service

import kr.briefly.domain.NewsStory
import kr.briefly.integration.AiSummary
import kr.briefly.integration.BriefingAiUsage
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.PreviousNewsContext
import java.time.LocalDate
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicInteger
import tools.jackson.module.kotlin.jacksonObjectMapper

data class EditionAiTotals(
    val requests: Int = 0,
    val responsesMeasured: Int = 0,
    val cacheHits: Int = 0,
    val inputTokens: Long = 0,
    val cachedInputTokens: Long = 0,
    val outputTokens: Long = 0,
    val requestsPriced: Int = 0,
    val estimatedUsd: Double? = null,
) {
    operator fun plus(other: EditionAiTotals) = EditionAiTotals(
        requests + other.requests, responsesMeasured + other.responsesMeasured, cacheHits + other.cacheHits,
        inputTokens + other.inputTokens, cachedInputTokens + other.cachedInputTokens,
        outputTokens + other.outputTokens, requestsPriced + other.requestsPriced,
        if (estimatedUsd == null && other.estimatedUsd == null) null else (estimatedUsd ?: 0.0) + (other.estimatedUsd ?: 0.0),
    )
}

data class EditionQualitySignals(
    val repeatStoriesDemoted: Int,
    val titleSummaryDuplicates: Int,
    val storiesWithCaveats: Int,
    val sameDayDuplicatesExcluded: Int = 0,
    val headlineFiguresNeedingReview: Int = 0,
)

data class EditionOperationsMetrics(val usage: EditionAiTotals, val qualitySignals: EditionQualitySignals)
private val operationsMapper = jacksonObjectMapper()

internal fun readEditionOperations(json: String?): EditionOperationsMetrics? = json?.let {
    runCatching { operationsMapper.readValue(it, EditionOperationsMetrics::class.java) }.getOrNull()
}

internal fun writeEditionOperations(metrics: EditionOperationsMetrics): String = operationsMapper.writeValueAsString(metrics)

internal class GenerationUsage {
    private val requests = AtomicInteger()
    private val cacheHits = AtomicInteger()
    private val usage = ConcurrentLinkedQueue<BriefingAiUsage>()
    fun attempted() { requests.incrementAndGet() }
    fun reused() { cacheHits.incrementAndGet() }
    fun record(item: BriefingAiUsage) { usage.add(item) }
    fun totals(): EditionAiTotals {
        val entries = usage.toList()
        val costs = entries.mapNotNull(BriefingAiUsage::estimateUsd)
        return EditionAiTotals(
            requests.get(), entries.size, cacheHits.get(), entries.sumOf { it.inputTokens },
            entries.sumOf { it.cachedInputTokens }, entries.sumOf { it.outputTokens }, costs.size,
            costs.takeIf { it.isNotEmpty() }?.sum(),
        )
    }
}

/** Cache only definitive validated summaries with the exact same ordered model input. */
internal class EditionSummaryCache(private val maximum: Int = 720) {
    private data class Key(val articles: List<CollectedArticle>, val previous: PreviousNewsContext?)
    private var date: LocalDate? = null
    private val entries = LinkedHashMap<Key, AiSummary>(16, 0.75f, true)

    @Synchronized
    fun prepare(editionDate: LocalDate) {
        if (date != editionDate) {
            entries.clear()
            date = editionDate
        }
    }

    fun summarize(articles: List<CollectedArticle>, previous: PreviousNewsContext?, usage: GenerationUsage, load: () -> AiSummary): AiSummary {
        val key = Key(articles.map { it.copy(editorialPriority = 0, imageUrl = null) }, previous)
        synchronized(this) { entries[key] }?.let {
            usage.reused()
            return it
        }
        return load().also { result ->
            synchronized(this) {
                entries[key] = result
                if (entries.size > maximum) entries.remove(entries.keys.first())
            }
        }
    }
}

private val nonEditorialChars = Regex("[^\\p{L}\\p{N}.%+\\-]")
internal fun normalizedEditorialText(text: String): String = text.lowercase().replace(nonEditorialChars, "").trimEnd('.')

internal fun carriesNoNewFacts(current: NewsStory, previous: NewsStory, similarity: (String, String) -> Double): Boolean {
    if (current.category != previous.category || similarity(current.title, previous.title) < 0.64) return false
    if (current.verificationStatus != previous.verificationStatus ||
        normalizedEditorialText(current.uncertainty.orEmpty()) != normalizedEditorialText(previous.uncertainty.orEmpty())) return false
    val oldClaims = previous.claims.map { normalizedEditorialText(it.statement) }.filter(String::isNotEmpty).toSet()
    val newClaims = current.claims.map { normalizedEditorialText(it.statement) }.filter(String::isNotEmpty).toSet()
    if (newClaims.isEmpty() || !oldClaims.containsAll(newClaims)) return false
    val lead = normalizedEditorialText(current.oneLineSummary.orEmpty())
    return lead.isNotEmpty() && lead == normalizedEditorialText(previous.oneLineSummary.orEmpty())
}
