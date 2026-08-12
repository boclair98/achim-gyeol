package kr.briefly.service

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.Category
import kr.briefly.domain.NewsSource
import kr.briefly.domain.NewsStory
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.NewsProvider
import kr.briefly.repository.BriefingEditionRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.ObjectProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.net.URI
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import kotlin.math.max

data class GenerationResult(
    val briefingDate: LocalDate,
    val coverageDate: LocalDate,
    val collectedArticles: Int,
    val candidateClusters: Int,
    val publishedStories: Int,
)

data class ArticleCluster(val category: Category, val articles: List<CollectedArticle>, val rank: Int)

@Component
class ArticleClusterer {
    private val stopWords = setOf(
        "관련", "대한", "위해", "통해", "이번", "오늘", "어제", "내일", "정부", "발표", "공개", "기자", "뉴스",
    )

    fun cluster(category: Category, articles: List<CollectedArticle>, limit: Int = 2): List<ArticleCluster> {
        val unique = articles
            .filter { it.title.isNotBlank() && it.originalUrl.isNotBlank() }
            .distinctBy { canonicalUrl(it.originalUrl) }
            .sortedByDescending { it.publishedAt }
        val groups = mutableListOf<MutableList<CollectedArticle>>()

        unique.forEach { article ->
            val target = groups
                .map { group -> group to similarity(article.title, group.first().title) }
                .filter { (_, score) -> score >= 0.42 }
                .maxByOrNull { (_, score) -> score }
                ?.first
            if (target == null) groups.add(mutableListOf(article)) else target.add(article)
        }

        return groups.mapNotNull { group ->
            val independent = group.distinctBy { it.publisher }
            if (independent.size < 2) return@mapNotNull null
            val selected = independent.take(6)
            val rank = selected.size * 100 + group.size * 10 + selected.maxOf { it.publishedAt.toEpochSecond() }.rem(1000).toInt()
            ArticleCluster(category, selected, rank)
        }.sortedByDescending(ArticleCluster::rank).take(limit)
    }

    internal fun similarity(left: String, right: String): Double {
        val leftTokens = tokens(left)
        val rightTokens = tokens(right)
        if (leftTokens.isEmpty() || rightTokens.isEmpty()) return 0.0
        val common = leftTokens.intersect(rightTokens).size.toDouble()
        val containment = common / minOf(leftTokens.size, rightTokens.size)
        val dice = (2.0 * common) / (leftTokens.size + rightTokens.size)
        return max(containment * 0.65 + dice * 0.35, characterSimilarity(left, right))
    }

    private fun tokens(title: String): Set<String> = title.lowercase()
        .replace(Regex("\\[[^]]+]"), " ")
        .replace(Regex("[^가-힣a-z0-9]+"), " ")
        .split(Regex("\\s+"))
        .map(String::trim)
        .filter { it.length >= 2 && it !in stopWords }
        .toSet()

    private fun characterSimilarity(left: String, right: String): Double {
        val a = bigrams(left)
        val b = bigrams(right)
        if (a.isEmpty() || b.isEmpty()) return 0.0
        return (2.0 * a.intersect(b).size) / (a.size + b.size)
    }

    private fun bigrams(value: String): Set<String> {
        val normalized = value.lowercase().replace(Regex("[^가-힣a-z0-9]"), "")
        return normalized.windowed(2).toSet()
    }

    private fun canonicalUrl(value: String): String = runCatching {
        val uri = URI(value)
        URI(uri.scheme, uri.authority, uri.path, null, null).toString()
    }.getOrDefault(value)
}

@Service
class NewsBriefingGenerator(
    private val newsProvider: ObjectProvider<NewsProvider>,
    private val aiSummarizer: ObjectProvider<AiSummarizer>,
    private val clusterer: ArticleClusterer,
    private val qualityGate: QualityGate,
    private val editionRepository: BriefingEditionRepository,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val zone = ZoneId.of("Asia/Seoul")
    private val queries = linkedMapOf(
        Category.POLICY to listOf("정부 정책", "복지 주거 고용 정책"),
        Category.ECONOMY to listOf("한국 경제 금융", "기업 실적 공시"),
        Category.SOCIETY to listOf("사회 주요 뉴스", "재난 교통 교육"),
        Category.TECH to listOf("AI 반도체 과학 기술", "플랫폼 개인정보 보안"),
    )

    @Transactional
    fun generate(briefingDate: LocalDate = LocalDate.now(ZoneId.of("Asia/Seoul"))): GenerationResult {
        val provider = newsProvider.ifAvailable ?: error("NAVER API HUB 키가 설정되지 않았습니다")
        val summarizer = aiSummarizer.ifAvailable ?: error("OpenAI API 키가 설정되지 않았습니다")
        val coverageDate = briefingDate.minusDays(1)
        var collectedCount = 0
        val clusters = queries.flatMap { (category, categoryQueries) ->
            val articles = categoryQueries.flatMap { query -> provider.search(query, 100) }
                .filter { it.publishedAt.atZoneSameInstant(zone).toLocalDate() == coverageDate }
                .distinctBy { it.originalUrl }
            collectedCount += articles.size
            clusterer.cluster(category, articles, limit = 2)
        }.sortedByDescending(ArticleCluster::rank)

        val failures = mutableListOf<String>()
        val stories = clusters.take(8).mapNotNull { cluster ->
            runCatching { buildStory(cluster, summarizer) }
                .onFailure { exception ->
                    val reason = "${cluster.category}: ${exception.message ?: exception.javaClass.simpleName}"
                    failures += reason
                    log.warn("Briefing candidate rejected: {}", reason)
                }
                .getOrNull()
        }.take(6)
        check(stories.isNotEmpty()) {
            "교차 검증 기준을 통과한 뉴스가 없습니다 (수집 $collectedCount, 사건 ${clusters.size}, 실패 ${failures.take(3).joinToString(" | ")})"
        }

        val edition = editionRepository.findByBriefingDate(briefingDate)
            ?: BriefingEdition(
                briefingDate = briefingDate,
                lead = "",
            )
        edition.lead = "${coverageDate.monthValue}월 ${coverageDate.dayOfMonth}일 보도 중 서로 다른 출처에서 공통으로 확인된 핵심만 정리했습니다."
        edition.readMinutes = max(3, stories.size)
        edition.lastVerifiedAt = OffsetDateTime.now(zone)
        edition.pipelineGenerated = true
        edition.stories.clear()
        stories.forEachIndexed { index, story ->
            story.displayOrder = index + 1
            edition.addStory(story)
        }
        editionRepository.save(edition)

        return GenerationResult(briefingDate, coverageDate, collectedCount, clusters.size, stories.size)
    }

    private fun buildStory(cluster: ArticleCluster, summarizer: AiSummarizer): NewsStory? {
        val articles = cluster.articles.distinctBy { it.publisher }.take(6)
        val summary = summarizer.summarize(articles)
        val validSourceIds = articles.indices.map { "S${it + 1}" }.toSet()
        val factsChecked = summary.keyFacts.isNotEmpty() && summary.keyFacts.all { fact ->
            fact.statement.isNotBlank() && fact.sourceIds.filter { it in validSourceIds }.distinct().size >= 2
        }
        val primarySource = articles.any { isPrimarySource(it.originalUrl) }
        val decision = qualityGate.evaluate(
            independentSources = articles.map(CollectedArticle::publisher).distinct().size,
            hasPrimarySource = primarySource,
            factsChecked = factsChecked,
            sourcesConflict = summary.sourcesConflict,
        )
        check(decision.publishable) {
            "품질 게이트 탈락 sources=${articles.map(CollectedArticle::publisher).distinct().size}, factsChecked=$factsChecked, conflict=${summary.sourcesConflict}"
        }

        val story = NewsStory(
            category = cluster.category,
            title = summary.title.trim().take(300),
            summary = summary.summary.trim().take(1200),
            whyItMatters = summary.whyItMatters.trim().take(700),
            verificationStatus = decision.status,
            qualityScore = decision.score,
            displayOrder = 0,
            uncertainty = summary.uncertainty?.trim()?.take(600),
        )
        articles.forEach { article ->
            story.addSource(
                NewsSource(
                    publisher = article.publisher,
                    url = article.originalUrl,
                    publishedAt = article.publishedAt,
                    primarySource = isPrimarySource(article.originalUrl),
                ),
            )
        }
        return story
    }

    private fun isPrimarySource(url: String): Boolean {
        val host = runCatching { URI(url).host?.lowercase() }.getOrNull() ?: return false
        return host.endsWith(".go.kr") || host == "korea.kr" || host.endsWith(".korea.kr") ||
            host == "opendart.fss.or.kr" || host.endsWith(".bok.or.kr") || host.endsWith(".kosis.kr")
    }
}

@Component
@ConditionalOnProperty(name = ["app.pipeline.enabled"], havingValue = "true")
class NewsGenerationScheduler(private val generator: NewsBriefingGenerator) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(cron = "\${app.pipeline.cron:0 0 6 * * *}", zone = "Asia/Seoul")
    fun generateEveryMorning() {
        runCatching { generator.generate() }
            .onSuccess { log.info("Morning briefing generated: {}", it) }
            .onFailure { log.error("Morning briefing generation failed", it) }
    }
}

@Component
@ConditionalOnProperty(name = ["app.pipeline.generate-on-startup"], havingValue = "true")
class StartupNewsGeneration(private val generator: NewsBriefingGenerator) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        generator.generate()
    }
}
