package kr.briefly.service

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.Category
import kr.briefly.domain.NewsSource
import kr.briefly.domain.NewsStory
import kr.briefly.domain.NewsClaim
import kr.briefly.domain.EditorialState
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.NewsProvider
import kr.briefly.repository.BriefingEditionRepository
import org.slf4j.LoggerFactory
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
import kotlin.math.ceil
import kotlin.math.max

data class GenerationResult(
    val briefingDate: LocalDate,
    val coverageDate: LocalDate,
    val collectedArticles: Int,
    val candidateClusters: Int,
    val publishedStories: Int,
)

data class ArticleCluster(val category: Category, val articles: List<CollectedArticle>, val rank: Int)
data class EditorialStory(val story: NewsStory, val importanceScore: Int, val clusterRank: Int)

@Component
class ArticleClusterer {
    private val stopWords = setOf(
        "관련", "대한", "위해", "통해", "이번", "오늘", "어제", "내일", "정부", "발표", "공개", "기자", "뉴스",
        "주요", "내용", "세부안", "개편", "조정", "확대", "변경", "확정", "결정", "추진", "검토", "계획",
    )
    private val publicImpactTerms = setOf(
        "정부", "국회", "대통령", "법원", "헌법", "전국", "시행", "법안", "규제", "지원금", "세금",
        "금리", "물가", "환율", "증시", "부동산", "고용", "수출", "관세", "연금", "건강보험",
        "재난", "경보", "태풍", "산불", "지진", "감염", "파업", "교통", "교육", "입시", "의료",
        "개인정보", "해킹", "보안", "인공지능", "AI", "반도체", "플랫폼",
        "외교", "전쟁", "휴전", "정상회담", "관세", "제재", "선거", "기후", "식품", "주거", "교통",
        "영화", "드라마", "음악", "공연", "수상", "국가대표", "월드컵", "올림픽", "메달", "우승", "결승",
        "e스포츠", "LCK", "MSI", "월즈", "리그오브레전드", "발로란트", "오버워치", "대회",
    )

    fun cluster(category: Category, articles: List<CollectedArticle>, limit: Int = 4): List<ArticleCluster> {
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
            val independent = group.distinctBy { newsSourceFamily(it.originalUrl) }
            if (independent.size < 2) return@mapNotNull null
            val selected = independent.take(6)
            val combinedText = group.joinToString(" ") { "${it.title} ${it.description}" }
            val impactSignals = publicImpactTerms.count { combinedText.contains(it, ignoreCase = true) }
            val primarySources = selected.count { isPrimaryNewsSource(it.originalUrl) }
            val broadCoverage = independent.size >= 4
            if (!broadCoverage && primarySources == 0 && impactSignals == 0) return@mapNotNull null
            val rank = selected.size * 100 + primarySources * 80 + impactSignals.coerceAtMost(5) * 30 + group.size.coerceAtMost(10) * 5
            ArticleCluster(category, selected, rank)
        }.sortedByDescending(ArticleCluster::rank).take(limit.coerceAtLeast(1))
    }

    internal fun similarity(left: String, right: String): Double {
        val leftTokens = tokens(left)
        val rightTokens = tokens(right)
        if (leftTokens.isEmpty() || rightTokens.isEmpty()) return 0.0
        val common = leftTokens.intersect(rightTokens).size.toDouble()
        val containment = common / minOf(leftTokens.size, rightTokens.size)
        val dice = (2.0 * common) / (leftTokens.size + rightTokens.size)
        return max(
            containment * 0.65 + dice * 0.35,
            characterSimilarity(leftTokens.sorted().joinToString(" "), rightTokens.sorted().joinToString(" ")),
        )
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
    private val newsProviders: List<NewsProvider>,
    private val aiSummarizer: AiSummarizer?,
    private val clusterer: ArticleClusterer,
    private val qualityGate: QualityGate,
    private val editionRepository: BriefingEditionRepository,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val zone = ZoneId.of("Asia/Seoul")
    private val queries = linkedMapOf(
        Category.POLICY to listOf("정부 국회 주요 정책", "복지 노동 주거 교육 정책", "법안 시행 규제"),
        Category.ECONOMY to listOf("한국 경제 금융 주요", "금리 물가 환율 부동산", "기업 실적 수출 관세"),
        Category.SOCIETY to listOf("사회 주요 뉴스", "재난 사고 의료 교통", "법원 검찰 교육 노동"),
        Category.INTERNATIONAL to listOf("국제 외교 안보 주요 뉴스", "미국 중국 일본 유럽 국제", "전쟁 휴전 관세 제재 선거"),
        Category.TECH to listOf("AI 반도체 과학 기술", "플랫폼 개인정보 보안", "통신 모빌리티 바이오"),
        Category.LIFE to listOf("생활 건강 소비자 주요 뉴스", "날씨 식품 주거 교통 생활", "여행 환경 기후 교육"),
        Category.CULTURE to listOf("문화 예술 주요 뉴스", "영화 드라마 음악 공연", "출판 전시 방송 수상"),
        Category.SPORTS to listOf("스포츠 주요 뉴스", "축구 야구 농구 배구", "국가대표 올림픽 월드컵 우승"),
        Category.ESPORTS to listOf("e스포츠 주요 뉴스", "LCK MSI 월즈 리그오브레전드", "발로란트 오버워치 e스포츠 대회"),
    )
    @Value("\${app.pipeline.max-candidates-per-category:4}") private var maxCandidatesPerCategory: Int = 4
    @Value("\${app.pipeline.max-stories-per-category:3}") private var maxStoriesPerCategory: Int = 3
    @Value("\${app.pipeline.max-stories:15}") private var maxStories: Int = 15
    @Value("\${app.pipeline.require-human-approval:false}") private var requireHumanApproval: Boolean = false
    @Synchronized
    @Transactional
    fun generate(briefingDate: LocalDate = LocalDate.now(ZoneId.of("Asia/Seoul"))): GenerationResult {
        editionRepository.findByBriefingDate(briefingDate)
            ?.takeIf { it.pipelineGenerated == true && it.stories.isNotEmpty() }
            ?.let { existing ->
                log.info("Morning briefing generation skipped because the edition already exists: date={}, stories={}", briefingDate, existing.stories.size)
                return GenerationResult(briefingDate, briefingDate.minusDays(1), 0, 0, existing.stories.size)
            }
        check(newsProviders.isNotEmpty()) { "뉴스 공급원 API가 설정되지 않았습니다" }
        val summarizer = aiSummarizer ?: error("OpenAI API 키가 설정되지 않았습니다")
        val coverageDate = briefingDate.minusDays(1)
        var collectedCount = 0
        val clusters = deduplicateClusters(queries.flatMap { (category, categoryQueries) ->
            val articles = categoryQueries.flatMap { query -> newsProviders.flatMap { provider -> runCatching { provider.search(query, 100) }.onFailure { log.warn("News provider failed: {}", it.message) }.getOrDefault(emptyList()) } }
                .filter { it.publishedAt.atZoneSameInstant(zone).toLocalDate() == coverageDate }
                .distinctBy { it.originalUrl }
            collectedCount += articles.size
            clusterer.cluster(category, articles, limit = maxCandidatesPerCategory)
        }.sortedByDescending(ArticleCluster::rank))

        val failures = mutableListOf<String>()
        val editorialStories = clusters.mapNotNull { cluster ->
            runCatching { buildStory(cluster, summarizer) }
                .onFailure { exception ->
                    val reason = "${cluster.category}: ${exception.message ?: exception.javaClass.simpleName}"
                    failures += reason
                    log.warn("Briefing candidate rejected: {}", reason)
                }
                .getOrNull()
        }
        val stories = editorialStories
            .groupBy { it.story.category }
            .values
            .flatMap { categoryStories ->
                categoryStories.sortedWith(compareByDescending<EditorialStory> { it.importanceScore }.thenByDescending { it.clusterRank })
                    .take(maxStoriesPerCategory.coerceAtLeast(1))
            }
            .sortedWith(compareByDescending<EditorialStory> { it.importanceScore }.thenByDescending { it.clusterRank })
            .take(maxStories.coerceAtLeast(1))
            .map(EditorialStory::story)
        check(stories.isNotEmpty()) {
            "교차 검증 기준을 통과한 뉴스가 없습니다 (수집 $collectedCount, 사건 ${clusters.size}, 실패 ${failures.take(3).joinToString(" | ")})"
        }

        val edition = editionRepository.findByBriefingDate(briefingDate)
            ?: BriefingEdition(
                briefingDate = briefingDate,
                lead = "",
            )
        edition.lead = "${coverageDate.monthValue}월 ${coverageDate.dayOfMonth}일 보도 중 서로 다른 출처에서 공통으로 확인된 핵심만 정리했습니다."
        edition.readMinutes = max(3, ceil(stories.size * 1.25).toInt())
        edition.lastVerifiedAt = OffsetDateTime.now(zone)
        edition.pipelineGenerated = true
        edition.editorialState = if (requireHumanApproval) EditorialState.REVIEW else EditorialState.AUTO_APPROVED
        edition.approvedAt = if (requireHumanApproval) null else OffsetDateTime.now(zone)
        edition.approvedBy = if (requireHumanApproval) null else "QUALITY_GATE"
        edition.stories.clear()
        stories.forEachIndexed { index, story ->
            story.displayOrder = index + 1
            story.editorialState = if (requireHumanApproval) EditorialState.REVIEW else EditorialState.AUTO_APPROVED
            edition.addStory(story)
        }
        editionRepository.save(edition)

        return GenerationResult(briefingDate, coverageDate, collectedCount, clusters.size, stories.size)
    }

    private fun buildStory(cluster: ArticleCluster, summarizer: AiSummarizer): EditorialStory? {
        val articles = cluster.articles.distinctBy { newsSourceFamily(it.originalUrl) }.take(6)
        val summary = summarizer.summarize(articles)
        if (!summary.recommendedForMorningBriefing || summary.importanceScore < 70) {
            log.info("Morning briefing candidate excluded: category={}, score={}, reason={}", cluster.category, summary.importanceScore, summary.importanceReason)
            return null
        }
        val factsChecked = summary.keyFacts.isNotEmpty() && summary.keyFacts.all { fact ->
            val citedArticles = fact.sourceIds.mapNotNull { sourceId ->
                sourceId.removePrefix("S").toIntOrNull()?.minus(1)?.let(articles::getOrNull)
            }
            fact.statement.isNotBlank() && citedArticles.map { newsSourceFamily(it.originalUrl) }.distinct().size >= 2
        }
        val primarySource = articles.any { isPrimaryNewsSource(it.originalUrl) }
        val independentSourceCount = articles.map { newsSourceFamily(it.originalUrl) }.distinct().size
        val decision = qualityGate.evaluate(
            independentSources = independentSourceCount,
            hasPrimarySource = primarySource,
            factsChecked = factsChecked,
            sourcesConflict = summary.sourcesConflict,
            verifiedClaims = summary.keyFacts.size,
            allClaimsMultiSource = factsChecked,
            staleEvidence = articles.any { it.publishedAt.atZoneSameInstant(zone).toLocalDate() != articles.first().publishedAt.atZoneSameInstant(zone).toLocalDate() },
            promotionalLanguage = listOf("단독 특가", "파격 혜택", "구매하기", "이벤트 참여").any { summary.summary.contains(it, ignoreCase = true) },
        )
        check(decision.publishable) {
            "품질 게이트 탈락 sources=$independentSourceCount, factsChecked=$factsChecked, conflict=${summary.sourcesConflict}, reasons=${decision.reasons.joinToString()}"
        }

        val story = NewsStory(
            category = cluster.category,
            title = summary.title.trim().take(300),
            summary = summary.summary.trim().take(1200),
            oneLineSummary = summary.oneLineSummary.trim().take(400),
            whyItMatters = summary.whyItMatters.trim().take(700),
            whatToWatch = summary.whatToWatch.trim().take(500).ifBlank { null },
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
                    primarySource = isPrimaryNewsSource(article.originalUrl),
                ),
            )
        }
        summary.keyFacts.forEachIndexed { index, fact ->
            val sourceIndexes = fact.sourceIds.mapNotNull { sourceId ->
                sourceId.removePrefix("S").toIntOrNull()?.minus(1)?.takeIf { it in articles.indices }
            }.distinct().sorted()
            story.addClaim(NewsClaim(fact.statement.trim().take(700), sourceIndexes.joinToString(","), index + 1))
        }
        return EditorialStory(story, summary.importanceScore, cluster.rank)
    }

    private fun deduplicateClusters(clusters: List<ArticleCluster>): List<ArticleCluster> = clusters.fold(mutableListOf<ArticleCluster>()) { unique, candidate ->
        val candidateUrls = candidate.articles.map(CollectedArticle::originalUrl).toSet()
        val duplicate = unique.any { existing ->
            val existingUrls = existing.articles.map(CollectedArticle::originalUrl).toSet()
            candidateUrls.intersect(existingUrls).size >= 2 ||
                clusterer.similarity(candidate.articles.first().title, existing.articles.first().title) >= 0.62
        }
        if (!duplicate) unique += candidate
        unique
    }

}

internal fun isPrimaryNewsSource(url: String): Boolean {
    val host = runCatching { URI(url).host?.lowercase() }.getOrNull() ?: return false
    return host.endsWith(".go.kr") || host == "korea.kr" || host.endsWith(".korea.kr") ||
        host == "opendart.fss.or.kr" || host.endsWith(".bok.or.kr") || host.endsWith(".kosis.kr")
}

internal fun newsSourceFamily(url: String): String = runCatching {
    val host = URI(url).host?.lowercase()?.removePrefix("www.") ?: return@runCatching url
    val labels = host.split('.')
    val koreanSecondLevelSuffix = labels.takeLast(2).joinToString(".") in setOf("co.kr", "or.kr", "go.kr", "ac.kr", "ne.kr")
    labels.takeLast(if (koreanSecondLevelSuffix) 3 else 2).joinToString(".")
}.getOrDefault(url)

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
