package kr.briefly.service

import kr.briefly.integration.AiFact
import kr.briefly.integration.CollectedArticle
import java.math.BigDecimal
import java.net.URI
import java.text.Normalizer
import java.util.Locale

private val trackingKeys = setOf("fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "igshid")

/** Keep article identifiers such as idxno, news_id and no; many publishers reuse one path. */
internal fun articleIdentity(rawUrl: String): String {
    val value = rawUrl.trim()
    val uri = runCatching { URI(value) }.getOrNull() ?: return value
    val scheme = uri.scheme?.lowercase(Locale.ROOT)
    val host = uri.host?.lowercase(Locale.ROOT)
    if (scheme !in setOf("http", "https") || host == null || uri.rawUserInfo != null) return value
    val query = uri.rawQuery?.split('&')?.filterNot { parameter ->
        val name = parameter.substringBefore('=').lowercase(Locale.ROOT)
        name.startsWith("utm_") || name in trackingKeys
    }?.filter(String::isNotEmpty)?.joinToString("&").orEmpty()
    return buildString {
        append(scheme).append("://").append(host)
        if (uri.port != -1 && !(scheme == "https" && uri.port == 443) && !(scheme == "http" && uri.port == 80)) {
            append(':').append(uri.port)
        }
        append(uri.rawPath.orEmpty().ifEmpty { "/" })
        if (query.isNotEmpty()) append('?').append(query)
    }
}

internal data class CitedFact(val statement: String, val sourceIndexes: List<Int>)

internal fun resolveCitedFacts(facts: List<AiFact>, articleCount: Int): List<CitedFact> = facts.map { fact ->
    val indexes = fact.sourceIds.mapNotNull { id ->
        id.removePrefix("S").toIntOrNull()?.takeIf { it in 1..articleCount }?.minus(1)
    }.distinct().sorted()
    CitedFact(fact.statement.trim(), indexes)
}

private const val amount = """\d+(?:,\d{3})*(?:\.\d+)?"""
private val numericFigure = Regex(
    """(?<![A-Za-z\p{N}.,+−-])([+−-]?$amount(?:\s*[조억만천](?:\s*$amount)?)*)\s*(%\s*[pP]|%\s*포인트|퍼센트\s*포인트|%|퍼센트|달러|원|명|가구|건|곳|개|대|표|개월|시간|년)(?![A-Za-z0-9])""",
)
private val amountPart = Regex("""($amount)\s*([조억만천]?)""")
private val magnitude = mapOf(
    "조" to BigDecimal("1000000000000"),
    "억" to BigDecimal("100000000"),
    "만" to BigDecimal("10000"),
    "천" to BigDecimal("1000"),
)
private data class Figure(val value: BigDecimal, val unit: String)

private fun figures(text: String): Set<Figure> {
    val normalized = Normalizer.normalize(text, Normalizer.Form.NFKC)
    return numericFigure.findAll(normalized).mapNotNull { match ->
        val (amountText, rawUnit) = match.destructured
        val unit = when (val compact = rawUnit.replace(" ", "").lowercase(Locale.ROOT)) {
            "%", "퍼센트" -> "%"
            "%p", "%포인트", "퍼센트포인트" -> "%p"
            else -> compact
        }
        // A coarse expression like 5%대 is not asserting an exact 5.0%.
        if (unit == "%" && normalized.getOrNull(match.range.last + 1) == '대') return@mapNotNull null
        val absolute = amountPart.findAll(amountText).fold(BigDecimal.ZERO) { total, part ->
            val value = part.groupValues[1].replace(",", "").toBigDecimal()
            total + value * (magnitude[part.groupValues[2]] ?: BigDecimal.ONE)
        }
        val signed = if (amountText.startsWith('-') || amountText.startsWith('−')) -absolute else absolute
        Figure(signed.stripTrailingZeros(), unit)
    }.toSet()
}

/**
 * A second check of headline numbers only, not a substitute for reporting.
 * A number must be attached to a fact with matching snippets from two outlets.
 * An omitted snippet means inconclusive, never that the figure is false.
 */
internal fun headlineHasUnconfirmedFigure(
    title: String,
    lead: String,
    facts: List<CitedFact>,
    articles: List<CollectedArticle>,
): Boolean {
    val targets = figures(title) + figures(lead)
    if (targets.isEmpty()) return false
    val figuresByFact = facts.map { fact -> figures(fact.statement) to fact.sourceIndexes }
    val figuresByArticle = articles.map { figures("${it.title}\n${it.description}") }
    return targets.any { figure ->
        figuresByFact.asSequence()
            .filter { (stated, _) -> figure in stated }
            .flatMap { (_, indexes) -> indexes.asSequence() }
            .distinct()
            .filter { index -> figure in figuresByArticle.getOrNull(index).orEmpty() }
            .map { index -> newsSourceFamily(articles[index].originalUrl) }
            .distinct()
            .take(2)
            .count() < 2
    }
}
