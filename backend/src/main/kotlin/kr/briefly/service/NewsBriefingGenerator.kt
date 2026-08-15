package kr.briefly.service

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.Category
import kr.briefly.domain.NewsSource
import kr.briefly.domain.NewsStory
import kr.briefly.domain.NewsClaim
import kr.briefly.domain.EditorialState
import kr.briefly.integration.AiSummarizer
import kr.briefly.integration.AiEditorialReviewer
import kr.briefly.integration.CollectedArticle
import kr.briefly.integration.EditorialCandidate
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
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.math.ceil
import kotlin.math.max

data class GenerationResult(
    val briefingDate: LocalDate,
    val coverageDate: LocalDate,
    val collectedArticles: Int,
    val candidateClusters: Int,
    val publishedStories: Int,
    val rejectedCandidates: Int,
    val categoryCounts: Map<String, Int>,
    val minimumDeliveryStories: Int,
    val minimumDeliveryCategories: Int,
    val deliveryReady: Boolean,
    val deliveryBlockReasons: List<String>,
    val coverageTargetMet: Boolean,
    val coverageWarnings: List<String>,
    val editorialPassApplied: Boolean = false,
    val editorialModel: String? = null,
    val editorialDurationMillis: Long = 0,
    val editorialFallbackReason: String? = null,
)

data class ArticleCluster(val category: Category, val articles: List<CollectedArticle>, val rank: Int)
data class EditorialStory(val story: NewsStory, val importanceScore: Int, val clusterRank: Int)
private data class CandidateEvaluation(
    val cluster: ArticleCluster,
    val candidate: EditorialStory?,
    val failure: String? = null,
)

private data class EditorialPassOutcome(
    val stories: List<NewsStory>,
    val applied: Boolean,
    val model: String? = null,
    val durationMillis: Long = 0,
    val fallbackReason: String? = null,
)

internal fun resolveEditorialSelection(
    candidatesByRef: Map<String, EditorialStory>,
    orderedRefs: List<String>,
): List<EditorialStory> {
    val selected = orderedRefs.distinct().mapNotNull(candidatesByRef::get)
    check(selected.isNotEmpty()) { "최종 편집기가 선택한 기사가 없습니다" }
    return selected
}

internal fun collectArticlesForDate(
    coverageDate: LocalDate,
    zone: ZoneId,
    maxPages: Int,
    fetchPage: (start: Int) -> List<CollectedArticle>,
): List<CollectedArticle> {
    val collected = mutableListOf<CollectedArticle>()
    for (pageIndex in 0 until maxPages.coerceIn(1, 10)) {
        val page = fetchPage(pageIndex * 100 + 1)
        if (page.isEmpty()) break
        collected += page
        val pageDates = page.map { it.publishedAt.atZoneSameInstant(zone).toLocalDate() }
        if (page.size < 100 || pageDates.any { it.isBefore(coverageDate) }) break
    }
    return collected.filter { it.publishedAt.atZoneSameInstant(zone).toLocalDate() == coverageDate }
}

internal fun selectBalancedAiCandidates(
    clusters: List<ArticleCluster>,
    maxPerCategory: Int,
    maxTotal: Int,
): List<ArticleCluster> {
    val grouped = clusters.groupBy(ArticleCluster::category)
        .mapValues { (_, values) -> values.sortedByDescending(ArticleCluster::rank) }
    val selected = mutableListOf<ArticleCluster>()
    for (round in 0 until maxPerCategory.coerceAtLeast(1)) {
        Category.entries.forEach { category ->
            grouped[category]?.getOrNull(round)?.let(selected::add)
        }
    }
    return selected.take(maxTotal.coerceAtLeast(1))
}

internal fun selectBalancedCoverageArticles(
    queryResults: List<List<CollectedArticle>>,
    maxTotal: Int,
): List<CollectedArticle> {
    val limit = maxTotal.coerceAtLeast(1)
    val iterators = queryResults.map { articles -> articles.iterator() }
    val selected = mutableListOf<CollectedArticle>()
    val seenUrls = mutableSetOf<String>()

    while (selected.size < limit) {
        var addedThisRound = false
        iterators.forEach { iterator ->
            while (selected.size < limit && iterator.hasNext()) {
                val article = iterator.next()
                if (seenUrls.add(article.originalUrl)) {
                    selected += article
                    addedThisRound = true
                    break
                }
            }
        }
        if (!addedThisRound) break
    }
    return selected
}

@Component
class ArticleClusterer {
    private data class TextFingerprint(
        val tokens: Set<String>,
        val characterBigrams: Set<String>,
    )

    private data class IndexedArticle(
        val article: CollectedArticle,
        val title: TextFingerprint,
        val context: TextFingerprint,
    )

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
            .map(::indexArticle)
        val groups = mutableListOf<MutableList<IndexedArticle>>()

        unique.forEach { article ->
            val target = groups
                .map { group -> group to group.maxOf { existing -> eventSimilarity(article, existing) } }
                .filter { (_, score) -> score >= 0.36 }
                .maxByOrNull { (_, score) -> score }
                ?.first
            if (target == null) groups.add(mutableListOf(article)) else target.add(article)
        }

        return groups.mapNotNull { group ->
            val groupedArticles = group.map(IndexedArticle::article)
            val independent = groupedArticles.distinctBy { newsSourceFamily(it.originalUrl) }
            if (independent.size < 2) return@mapNotNull null
            val selected = independent.take(6)
            val combinedText = groupedArticles.joinToString(" ") { "${it.title} ${it.description}" }
            val impactSignals = publicImpactTerms.count { combinedText.contains(it, ignoreCase = true) }
            val primarySources = selected.count { isPrimaryNewsSource(it.originalUrl) }
            val curatedPriority = selected.maxOfOrNull(CollectedArticle::editorialPriority) ?: 0
            val broadCoverage = independent.size >= 4
            if (!broadCoverage && primarySources == 0 && impactSignals == 0 && curatedPriority < 60) return@mapNotNull null
            val rank = selected.size * 100 + primarySources * 80 + impactSignals.coerceAtMost(5) * 30 +
                curatedPriority.coerceIn(0, 100) + groupedArticles.size.coerceAtMost(10) * 5
            ArticleCluster(category, selected, rank)
        }.sortedByDescending(ArticleCluster::rank).take(limit.coerceAtLeast(1))
    }

    internal fun similarity(left: String, right: String): Double = similarity(fingerprint(left), fingerprint(right))

    private fun similarity(left: TextFingerprint, right: TextFingerprint): Double {
        if (left.tokens.isEmpty() || right.tokens.isEmpty()) return 0.0
        val common = commonElements(left.tokens, right.tokens).toDouble()
        val containment = common / minOf(left.tokens.size, right.tokens.size)
        val dice = (2.0 * common) / (left.tokens.size + right.tokens.size)
        val bigramCommon = commonElements(left.characterBigrams, right.characterBigrams).toDouble()
        val characterDice = if (left.characterBigrams.isEmpty() || right.characterBigrams.isEmpty()) {
            0.0
        } else {
            (2.0 * bigramCommon) / (left.characterBigrams.size + right.characterBigrams.size)
        }
        return max(
            containment * 0.65 + dice * 0.35,
            characterDice,
        )
    }

    private fun eventSimilarity(left: IndexedArticle, right: IndexedArticle): Double {
        val titleScore = similarity(left.title, right.title)
        if (titleScore >= 0.42) return titleScore
        val sharedTitleTokens = commonElements(left.title.tokens, right.title.tokens)
        if (sharedTitleTokens < 2) return 0.0
        val contextScore = similarity(left.context, right.context)
        return max(titleScore, contextScore * 0.9)
    }

    private fun indexArticle(article: CollectedArticle) = IndexedArticle(
        article = article,
        title = fingerprint(article.title),
        context = fingerprint("${article.title} ${article.description.take(180)}"),
    )

    private fun fingerprint(value: String): TextFingerprint {
        val valueTokens = tokens(value)
        return TextFingerprint(
            tokens = valueTokens,
            characterBigrams = bigrams(valueTokens.sorted().joinToString(" ")),
        )
    }

    private fun <T> commonElements(left: Set<T>, right: Set<T>): Int =
        if (left.size <= right.size) left.count(right::contains) else right.count(left::contains)

    private fun tokens(title: String): Set<String> = title.lowercase()
        .replace(Regex("\\[[^]]+]"), " ")
        .replace(Regex("[^가-힣a-z0-9]+"), " ")
        .split(Regex("\\s+"))
        .map(String::trim)
        .filter { it.length >= 2 && it !in stopWords }
        .toSet()

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
    private val editorialReviewer: AiEditorialReviewer?,
    private val clusterer: ArticleClusterer,
    private val qualityGate: QualityGate,
    private val coveragePolicy: BriefingCoveragePolicy,
    private val editionRepository: BriefingEditionRepository,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val zone = ZoneId.of("Asia/Seoul")
    private val coverageHoldMarker = "COVERAGE_GATE"
    private val queries = linkedMapOf(
        Category.POLICY to listOf("정부 정책", "국회 법안", "복지 노동", "주거 교육 정책", "대통령 국무회의"),
        Category.ECONOMY to listOf("금리 물가 환율", "증시 금융 시장", "부동산 가계대출", "기업 실적 수출", "고용 소비"),
        Category.SOCIETY to listOf("사건 사고 재난", "법원 판결 수사", "의료 보건", "교육 노동", "교통 안전"),
        Category.INTERNATIONAL to listOf("국제 외교 안보", "미국 중국", "일본 유럽", "전쟁 휴전 제재", "정상회담 선거"),
        Category.TECH to listOf("AI 인공지능", "반도체 배터리", "개인정보 보안 해킹", "과학 우주 바이오", "플랫폼 모빌리티"),
        Category.LIFE to listOf("날씨 재난 생활", "식품 리콜 소비자", "건강 질병", "주거 교통 요금", "환경 기후 여행"),
        Category.CULTURE to listOf("영화 드라마", "음악 공연", "출판 전시", "방송 콘텐츠", "문화재 수상"),
        Category.SPORTS to listOf("프로야구 경기 결과", "축구 경기 결과", "농구 배구 경기 결과", "국가대표 경기", "올림픽 월드컵"),
        Category.ESPORTS to listOf("LCK e스포츠", "리그오브레전드 대회", "발로란트 e스포츠", "오버워치 e스포츠", "e스포츠 경기 결과"),
    )
    @Value("\${app.pipeline.max-candidates-per-category:6}") private var maxCandidatesPerCategory: Int = 6
    @Value("\${app.pipeline.max-articles-per-category:120}") private var maxArticlesPerCategory: Int = 120
    @Value("\${app.pipeline.search-max-pages:3}") private var searchMaxPages: Int = 3
    @Value("\${app.pipeline.max-ai-candidates:18}") private var maxAiCandidates: Int = 18
    @Value("\${app.pipeline.ai-concurrency:1}") private var aiConcurrency: Int = 1
    @Value("\${app.pipeline.max-stories-per-category:3}") private var maxStoriesPerCategory: Int = 3
    @Value("\${app.pipeline.max-stories:15}") private var maxStories: Int = 15
    @Value("\${app.pipeline.minimum-importance-score:60}") private var minimumImportanceScore: Int = 60
    @Value("\${app.pipeline.require-human-approval:false}") private var requireHumanApproval: Boolean = false
    @Synchronized
    @Transactional
    fun generate(
        briefingDate: LocalDate = LocalDate.now(ZoneId.of("Asia/Seoul")),
        force: Boolean = false,
    ): GenerationResult {
        if (!force) {
            editionRepository.findByBriefingDate(briefingDate)
                ?.takeIf(::shouldReuseExistingEdition)
                ?.let { existing ->
                val coverage = coveragePolicy.evaluate(existing.stories)
                log.info("Morning briefing generation skipped because the edition already exists: date={}, stories={}", briefingDate, existing.stories.size)
                return generationResult(
                    briefingDate = briefingDate,
                    coverageDate = briefingDate.minusDays(1),
                    collectedArticles = 0,
                    candidateClusters = 0,
                    stories = existing.stories,
                    rejectedCandidates = 0,
                    coverage = coverage,
                )
            }
        }
        check(newsProviders.isNotEmpty()) { "뉴스 공급원 API가 설정되지 않았습니다" }
        val summarizer = aiSummarizer ?: error("OpenAI API 키가 설정되지 않았습니다")
        val coverageDate = briefingDate.minusDays(1)
        var collectedCount = 0
        val clusters = deduplicateClusters(queries.flatMap { (category, categoryQueries) ->
            val articles = selectBalancedCoverageArticles(
                queryResults = categoryQueries.map { query ->
                    newsProviders.flatMap { provider -> collectCoverageArticles(provider, query, coverageDate) }
                },
                maxTotal = maxArticlesPerCategory,
            )
            collectedCount += articles.size
            clusterer.cluster(category, articles, limit = maxCandidatesPerCategory)
        }.sortedByDescending(ArticleCluster::rank))

        val aiCandidates = selectBalancedAiCandidates(
            clusters = clusters,
            maxPerCategory = maxCandidatesPerCategory,
            maxTotal = maxAiCandidates,
        )
        val evaluations = evaluateCandidates(aiCandidates, summarizer)
        log.info(
            "Morning briefing AI review completed: selectedCandidates={}, totalClusters={}, concurrency={}",
            aiCandidates.size,
            clusters.size,
            aiConcurrency.coerceIn(1, 6),
        )
        val failures = mutableListOf<String>()
        val editorialStories = mutableListOf<EditorialStory>()
        val acceptedByCategory = mutableMapOf<Category, Int>()
        evaluations.forEach { evaluation ->
            val cluster = evaluation.cluster
            if ((acceptedByCategory[cluster.category] ?: 0) >= maxStoriesPerCategory.coerceAtLeast(1)) return@forEach
            evaluation.failure?.let(failures::add)
            val candidate = evaluation.candidate ?: return@forEach
            if (editorialStories.any { existing -> sameEditorialEvent(existing, candidate) }) {
                log.info("Duplicate morning briefing candidate excluded after AI summary: category={}, title={}", candidate.story.category, candidate.story.title)
                return@forEach
            }
            editorialStories += candidate
            acceptedByCategory[cluster.category] = (acceptedByCategory[cluster.category] ?: 0) + 1
        }
        val editorialPass = applyEditorialPass(editorialStories)
        val stories = editorialPass.stories
        val coverage = coveragePolicy.evaluate(stories)
        val editionState = when {
            requireHumanApproval -> EditorialState.REVIEW
            else -> EditorialState.AUTO_APPROVED
        }

        val edition = editionRepository.findByBriefingDate(briefingDate)
            ?: BriefingEdition(
                briefingDate = briefingDate,
                lead = "",
            )
        edition.lead = if (stories.isEmpty()) {
            "${coverageDate.monthValue}월 ${coverageDate.dayOfMonth}일 뉴스 수집은 완료했지만 자동 검증을 통과한 카드가 아직 없습니다. 원문 수집과 검증을 계속 진행하고 있습니다."
        } else {
            "${coverageDate.monthValue}월 ${coverageDate.dayOfMonth}일 보도 중 ${stories.map(NewsStory::category).distinct().size}개 분야 핵심 ${stories.size}건을 서로 다른 출처로 교차 확인했습니다."
        }
        edition.readMinutes = max(3, ceil(stories.size * 1.25).toInt())
        edition.lastVerifiedAt = OffsetDateTime.now(zone)
        edition.pipelineGenerated = true
        edition.editorialState = editionState
        edition.approvedAt = if (editionState == EditorialState.AUTO_APPROVED) OffsetDateTime.now(zone) else null
        edition.approvedBy = if (editionState == EditorialState.AUTO_APPROVED) "QUALITY_GATE" else null
        edition.editorialPassApplied = editorialPass.applied
        edition.editorialModel = editorialPass.model
        edition.editorialDurationMillis = editorialPass.durationMillis
        edition.editorialFallbackReason = editorialPass.fallbackReason
        edition.stories.clear()
        stories.forEachIndexed { index, story ->
            story.displayOrder = index + 1
            story.editorialState = editionState
            edition.addStory(story)
        }
        editionRepository.save(edition)

        if (!coverage.ready) {
            log.warn(
                "Morning briefing will still be delivered with coverage warnings: date={}, stories={}, categories={}, reasons={}",
                briefingDate, coverage.storyCount, coverage.categoryCount, coverage.reasons.joinToString(),
            )
        }

        return generationResult(
            briefingDate = briefingDate,
            coverageDate = coverageDate,
            collectedArticles = collectedCount,
            candidateClusters = clusters.size,
            stories = stories,
            rejectedCandidates = (aiCandidates.size - editorialStories.size).coerceAtLeast(0),
            coverage = coverage,
            editorialPass = editorialPass,
        )
    }

    @Transactional
    fun persistUnavailableEdition(briefingDate: LocalDate, failure: String?) {
        val existing = editionRepository.findByBriefingDate(briefingDate)
        if (existing?.pipelineGenerated == true && existing.stories.isNotEmpty()) return
        val coverageDate = briefingDate.minusDays(1)
        val edition = existing ?: BriefingEdition(briefingDate = briefingDate, lead = "")
        edition.lead = "${coverageDate.monthValue}월 ${coverageDate.dayOfMonth}일 뉴스 수집·검증이 지연되고 있습니다. 확인된 내용이 준비되는 대로 브리핑에 반영하겠습니다."
        edition.readMinutes = 1
        edition.lastVerifiedAt = OffsetDateTime.now(zone)
        edition.pipelineGenerated = true
        edition.editorialState = EditorialState.AUTO_APPROVED
        edition.approvedAt = OffsetDateTime.now(zone)
        edition.approvedBy = "GENERATION_FALLBACK"
        edition.stories.clear()
        editionRepository.save(edition)
        log.error("Stored an unavailable-edition notice so daily delivery does not go silent: date={}, failure={}", briefingDate, failure?.take(300))
    }

    private fun evaluateCandidates(
        clusters: List<ArticleCluster>,
        summarizer: AiSummarizer,
    ): List<CandidateEvaluation> {
        if (clusters.isEmpty()) return emptyList()
        val executor = Executors.newFixedThreadPool(aiConcurrency.coerceIn(1, 6)) { runnable ->
            Thread(runnable, "morning-ai-summary").apply { isDaemon = true }
        }
        return try {
            val tasks = clusters.map { cluster ->
                Callable {
                    runCatching { buildStory(cluster, summarizer) }
                        .fold(
                            onSuccess = { CandidateEvaluation(cluster, it) },
                            onFailure = { exception ->
                                val reason = "${cluster.category}: ${exception.message ?: exception.javaClass.simpleName}"
                                log.warn("Briefing candidate rejected: {}", reason)
                                CandidateEvaluation(cluster, null, reason)
                            },
                        )
                }
            }
            executor.invokeAll(tasks).map { it.get() }
        } finally {
            executor.shutdownNow()
        }
    }

    private fun buildStory(cluster: ArticleCluster, summarizer: AiSummarizer): EditorialStory? {
        val articles = cluster.articles.distinctBy { newsSourceFamily(it.originalUrl) }.take(6)
        val summary = summarizer.summarize(articles)
        if (!summary.recommendedForMorningBriefing || summary.importanceScore < minimumImportanceScore.coerceIn(0, 100)) {
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

    private fun shouldReuseExistingEdition(edition: BriefingEdition): Boolean {
        if (edition.pipelineGenerated != true || edition.stories.isEmpty()) return false
        val state = edition.editorialState ?: EditorialState.AUTO_APPROVED
        if (state in setOf(EditorialState.AUTO_APPROVED, EditorialState.REVIEW, EditorialState.APPROVED, EditorialState.PUBLISHED)) return true
        if (state == EditorialState.HELD && edition.approvedBy != coverageHoldMarker) return true
        return false
    }

    private fun collectCoverageArticles(provider: NewsProvider, query: String, coverageDate: LocalDate): List<CollectedArticle> {
        return collectArticlesForDate(coverageDate, zone, searchMaxPages) { start ->
            runCatching { provider.searchForDate(query, coverageDate, zone, display = 100, start = start) }
                .onFailure { log.warn("News provider failed: query={}, start={}, message={}", query, start, it.message) }
                .getOrDefault(emptyList())
        }
    }

    private fun selectBalancedEditorialStories(candidates: List<EditorialStory>): List<EditorialStory> {
        val comparator = compareByDescending<EditorialStory> { it.importanceScore }
            .thenByDescending { it.clusterRank }
        val sortedByCategory = candidates.groupBy { it.story.category }
            .mapValues { (_, stories) -> stories.sortedWith(comparator) }
        val categoryLeads = Category.entries.mapNotNull { category -> sortedByCategory[category]?.firstOrNull() }
        val leadStories = categoryLeads.map { it.story }.toSet()
        val remaining = candidates.filterNot { it.story in leadStories }.sortedWith(comparator)
        val limit = maxStories.coerceAtLeast(1)
        val selected = if (categoryLeads.size >= limit) {
            categoryLeads.sortedWith(comparator).take(limit)
        } else {
            categoryLeads + remaining.take(limit - categoryLeads.size)
        }
        return selected.sortedWith(comparator)
    }

    private fun applyEditorialPass(candidates: List<EditorialStory>): EditorialPassOutcome {
        val baseline = selectBalancedEditorialStories(candidates)
        val reviewer = editorialReviewer
            ?: return EditorialPassOutcome(baseline.map(EditorialStory::story), applied = false)
        if (baseline.isEmpty()) return EditorialPassOutcome(emptyList(), applied = false, model = reviewer.modelName)

        val comparator = compareByDescending<EditorialStory> { it.importanceScore }
            .thenByDescending { it.clusterRank }
        val pool = (baseline + candidates.filterNot(baseline::contains).sortedWith(comparator)).distinct()
        val byRef = pool.mapIndexed { index, candidate -> "N${index + 1}" to candidate }.toMap()
        val reviewCandidates = byRef.map { (ref, candidate) ->
            EditorialCandidate(
                ref = ref,
                category = candidate.story.category.name,
                title = candidate.story.title,
                oneLineSummary = candidate.story.oneLineSummary.orEmpty(),
                whyItMatters = candidate.story.whyItMatters,
                importanceScore = candidate.importanceScore,
                qualityScore = candidate.story.qualityScore,
                sourceCount = candidate.story.sources.map { newsSourceFamily(it.url) }.distinct().size,
                claims = candidate.story.claims.map(NewsClaim::statement),
            )
        }
        val startedAt = System.nanoTime()
        return runCatching {
            val review = reviewer.review(reviewCandidates, maxStories.coerceAtLeast(1))
            val reviewed = resolveEditorialSelection(byRef, review.orderedRefs)
                .take(maxStories.coerceAtLeast(1))
            val baselineCoverage = coveragePolicy.evaluate(baseline.map(EditorialStory::story))
            val reviewedCoverage = coveragePolicy.evaluate(reviewed.map(EditorialStory::story))
            check(
                if (baselineCoverage.ready) reviewedCoverage.ready
                else reviewedCoverage.storyCount >= baselineCoverage.storyCount &&
                    reviewedCoverage.categoryCount >= baselineCoverage.categoryCount,
            ) {
                "최종 편집 결과가 기존 안전 선정의 기사·분야 범위를 충족하지 못했습니다 " +
                    "(stories=${reviewedCoverage.storyCount}, categories=${reviewedCoverage.categoryCount})"
            }
            val elapsed = (System.nanoTime() - startedAt) / 1_000_000
            log.info(
                "Morning briefing final editorial pass applied: model={}, durationMs={}, selected={}, excluded={}, rationale={}",
                reviewer.modelName,
                elapsed,
                reviewed.joinToString { it.story.title.take(60) },
                review.excludedRefs.joinToString(),
                review.rationale.take(300),
            )
            EditorialPassOutcome(reviewed.map(EditorialStory::story), true, reviewer.modelName, elapsed)
        }.getOrElse { exception ->
            val elapsed = (System.nanoTime() - startedAt) / 1_000_000
            val reason = (exception.message ?: exception.javaClass.simpleName).take(500)
            log.warn(
                "Morning briefing final editorial pass failed safely; deterministic selection will be used: model={}, durationMs={}, reason={}",
                reviewer.modelName,
                elapsed,
                reason,
            )
            EditorialPassOutcome(baseline.map(EditorialStory::story), false, reviewer.modelName, elapsed, reason)
        }
    }

    private fun sameEditorialEvent(left: EditorialStory, right: EditorialStory): Boolean {
        val leftUrls = left.story.sources.map(NewsSource::url).toSet()
        val rightUrls = right.story.sources.map(NewsSource::url).toSet()
        if (leftUrls.intersect(rightUrls).isNotEmpty()) return true
        val sameCategory = left.story.category == right.story.category
        val titleThreshold = if (sameCategory) 0.38 else 0.52
        if (clusterer.similarity(left.story.title, right.story.title) >= titleThreshold) return true
        val leftConclusion = left.story.oneLineSummary.orEmpty()
        val rightConclusion = right.story.oneLineSummary.orEmpty()
        return leftConclusion.isNotBlank() && rightConclusion.isNotBlank() &&
            clusterer.similarity(leftConclusion, rightConclusion) >= if (sameCategory) 0.44 else 0.58
    }

    private fun generationResult(
        briefingDate: LocalDate,
        coverageDate: LocalDate,
        collectedArticles: Int,
        candidateClusters: Int,
        stories: Collection<NewsStory>,
        rejectedCandidates: Int,
        coverage: BriefingCoverageDecision,
        editorialPass: EditorialPassOutcome = EditorialPassOutcome(stories.toList(), applied = false),
    ) = GenerationResult(
        briefingDate = briefingDate,
        coverageDate = coverageDate,
        collectedArticles = collectedArticles,
        candidateClusters = candidateClusters,
        publishedStories = stories.size,
        rejectedCandidates = rejectedCandidates,
        categoryCounts = stories.groupingBy { it.category.name }.eachCount().toSortedMap(),
        minimumDeliveryStories = coverage.minimumStories,
        minimumDeliveryCategories = coverage.minimumCategories,
        deliveryReady = true,
        deliveryBlockReasons = emptyList(),
        coverageTargetMet = coverage.ready,
        coverageWarnings = coverage.reasons,
        editorialPassApplied = editorialPass.applied,
        editorialModel = editorialPass.model,
        editorialDurationMillis = editorialPass.durationMillis,
        editorialFallbackReason = editorialPass.fallbackReason,
    )

    private fun deduplicateClusters(clusters: List<ArticleCluster>): List<ArticleCluster> = clusters.fold(mutableListOf<ArticleCluster>()) { unique, candidate ->
        val candidateUrls = candidate.articles.map(CollectedArticle::originalUrl).toSet()
        val duplicate = unique.any { existing ->
            val existingUrls = existing.articles.map(CollectedArticle::originalUrl).toSet()
            candidateUrls.intersect(existingUrls).isNotEmpty() ||
                clusterer.similarity(candidate.articles.first().title, existing.articles.first().title) >= 0.50
        }
        if (!duplicate) unique += candidate
        unique
    }

}

internal fun isPrimaryNewsSource(url: String): Boolean {
    val host = runCatching { URI(url).host?.lowercase() }.getOrNull() ?: return false
    return host.endsWith(".go.kr") || host == "korea.kr" || host.endsWith(".korea.kr") ||
        host == "opendart.fss.or.kr" || host.endsWith(".bok.or.kr") || host.endsWith(".kosis.kr") ||
        host.endsWith(".fsc.go.kr") || host.endsWith(".fss.or.kr") || host.endsWith(".krx.co.kr") ||
        host.endsWith(".kdca.go.kr")
}

internal fun newsSourceFamily(url: String): String = runCatching {
    val host = URI(url).host?.lowercase()?.removePrefix("www.") ?: return@runCatching url
    val labels = host.split('.')
    val koreanSecondLevelSuffix = labels.takeLast(2).joinToString(".") in setOf("co.kr", "or.kr", "go.kr", "ac.kr", "ne.kr")
    labels.takeLast(if (koreanSecondLevelSuffix) 3 else 2).joinToString(".")
}.getOrDefault(url)

@Component
@ConditionalOnProperty(name = ["app.pipeline.enabled"], havingValue = "true")
class NewsGenerationScheduler(private val generationJob: MorningGenerationJob) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(cron = "\${app.pipeline.cron:0 0 1 * * *}", zone = "Asia/Seoul")
    fun generateEveryMorning() {
        val briefingDate = LocalDate.now(ZoneId.of("Asia/Seoul"))
        runCatching { generationJob.start(briefingDate) }
            .onSuccess { log.info("Scheduled morning briefing generation submitted: {}", it) }
            .onFailure { log.error("Scheduled morning briefing generation could not be submitted", it) }
    }
}

@Component
@ConditionalOnProperty(name = ["app.pipeline.generate-on-startup"], havingValue = "true")
class StartupNewsGeneration(private val generator: NewsBriefingGenerator) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        generator.generate()
    }
}
