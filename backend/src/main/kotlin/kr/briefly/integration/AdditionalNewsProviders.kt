package kr.briefly.integration

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.util.HtmlUtils
import org.w3c.dom.Element
import org.xml.sax.InputSource
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.io.StringReader
import java.net.URI
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.ConcurrentHashMap
import javax.xml.parsers.DocumentBuilderFactory

private data class GdeltSearchProfile(val name: String, val categories: String)

@Component
@ConditionalOnExpression(
    "T(org.springframework.util.StringUtils).hasText('\${app.news.gdelt.api-key:}') && \${app.news.gdelt.enabled:true}",
)
class GdeltNewsClient(
    @Value("\${app.news.gdelt.api-key}") private val apiKey: String,
    @Value("\${app.news.gdelt.base-url:https://gdeltcloud.com}") baseUrl: String,
    @Value("\${app.news.gdelt.minimum-article-count:3}") private val minimumArticleCount: Int,
    @Value("\${app.news.gdelt.minimum-significance:0.45}") private val minimumSignificance: Double,
    @Value("\${app.news.gdelt.read-timeout-seconds:30}") readTimeoutSeconds: Long,
) : NewsProvider {
    private val mapper = jacksonObjectMapper()
    private val client = RestClient.builder()
        .baseUrl(baseUrl)
        .defaultHeader("Authorization", "Bearer $apiKey")
        .requestFactory(SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(Duration.ofSeconds(10))
            setReadTimeout(Duration.ofSeconds(readTimeoutSeconds.coerceIn(10, 90)))
        })
        .build()
    private val cache = ConcurrentHashMap<Pair<LocalDate, String>, List<CollectedArticle>>()

    override fun search(query: String, display: Int, start: Int): List<CollectedArticle> {
        val zone = ZoneId.of("Asia/Seoul")
        return searchForDate(query, LocalDate.now(zone).minusDays(1), zone, display, start)
    }

    override fun searchForDate(
        query: String,
        coverageDate: LocalDate,
        zone: ZoneId,
        display: Int,
        start: Int,
    ): List<CollectedArticle> {
        if (start > 1) return emptyList()
        val profile = profileFor(query) ?: return emptyList()
        return cache.computeIfAbsent(coverageDate to profile.name) {
            fetchImportantStories(profile, coverageDate, zone, display)
        }
    }

    private fun fetchImportantStories(
        profile: GdeltSearchProfile,
        coverageDate: LocalDate,
        zone: ZoneId,
        display: Int,
    ): List<CollectedArticle> {
        val response = client.get().uri {
            it.path("/api/v2/stories")
                .queryParam("date", coverageDate)
                .queryParam("category", profile.categories)
                .queryParam("article_count_min", minimumArticleCount.coerceAtLeast(2))
                .queryParam("confidence_profile", "balanced")
                .queryParam("collapse_duplicates", true)
                .queryParam("sort", "significance")
                .queryParam("limit", display.coerceIn(1, 100))
                .build()
        }.retrieve().body(String::class.java) ?: return emptyList()
        val root = mapper.readTree(response)
        if (!root.path("success").asBoolean(false)) return emptyList()

        return root.path("data").flatMap { story ->
            val significance = story.path("metrics").path("significance").asDouble(0.0)
            val articleCount = story.path("metrics").path("article_count").asInt(0)
            if (significance < minimumSignificance.coerceIn(0.0, 1.0) || articleCount < minimumArticleCount) {
                return@flatMap emptyList()
            }
            val storyDate = runCatching { LocalDate.parse(story.path("story_date").asText().take(10)) }
                .getOrNull() ?: return@flatMap emptyList()
            if (storyDate != coverageDate) return@flatMap emptyList()
            val storyTitle = story.path("title").asText().trim()
            if (storyTitle.isBlank()) return@flatMap emptyList()
            val geo = story.path("geo").path("country").asText().trim()
            val category = story.path("category").asText().trim()
            val linkedEvents = story.path("linked_events").mapNotNull { it.path("title").asText().trim().takeIf(String::isNotBlank) }
                .take(3)
                .joinToString("; ")
            val descriptionPrefix = buildString {
                append(storyTitle)
                if (geo.isNotBlank()) append(" | 발생 지역: ").append(geo)
                if (category.isNotBlank()) append(" | 분류: ").append(category)
                if (linkedEvents.isNotBlank()) append(" | 연결 사건: ").append(linkedEvents)
                append(" | [수집 메타데이터] 여러 매체 보도 ").append(articleCount)
                append("건, GDELT 중요도 ").append(String.format("%.2f", significance))
            }
            val publishedAt = coverageDate.atTime(12, 0).atZone(zone).toOffsetDateTime()
            story.path("top_articles")
                .mapNotNull { article ->
                    val url = article.path("url").asText().trim()
                    val domain = article.path("domain").asText().trim().ifBlank { publisherFrom(url) }
                    val articleTitle = article.path("title").asText().trim()
                    val imageUrl = sequenceOf(
                        article.path("image_url").asText(), article.path("image").asText(),
                        story.path("image_url").asText(), story.path("social_image").asText(),
                    ).map { it.trim() }.firstOrNull { it.isNotBlank() }
                    if (url.isBlank() || articleTitle.isBlank()) null else CollectedArticle(
                        title = storyTitle,
                        description = "$descriptionPrefix | 개별 보도 제목: $articleTitle",
                        originalUrl = url,
                        publishedAt = publishedAt,
                        publisher = domain,
                        editorialPriority = (significance * 100).toInt().coerceIn(0, 100),
                        imageUrl = imageUrl,
                    )
                }
                .distinctBy { publisherFrom(it.originalUrl) }
                .take(6)
                .takeIf { it.size >= 3 }
                .orEmpty()
        }.distinctBy(CollectedArticle::originalUrl)
    }

    private fun profileFor(query: String): GdeltSearchProfile? = when {
        listOf("국제", "외교", "안보", "미국", "중국", "일본", "유럽", "전쟁", "휴전", "제재", "정상회담", "선거")
            .any(query::contains) -> GdeltSearchProfile(
            "global",
            "POLITICAL,ECONOMIC,CORPORATE,TECHNOLOGY,INFRASTRUCTURE,ENVIRONMENT,HEALTH,INFORMATION," +
                "Battles,Protests,Riots,Explosions/Remote violence,Violence against civilians,Strategic developments",
        )
        listOf("금융", "금융위원회", "금융감독원", "한국은행", "은행", "대출", "가계부채", "증시", "환율", "보험", "연금")
            .any(query::contains) -> GdeltSearchProfile("finance", "ECONOMIC,CORPORATE")
        listOf("금리", "물가", "환율", "증시", "금융", "금융위원회", "금융감독원", "한국은행", "은행", "대출", "가계부채", "부동산", "기업", "실적", "수출", "고용", "소비")
            .any(query::contains) -> GdeltSearchProfile("economy", "ECONOMIC,CORPORATE")
        listOf("AI", "인공지능", "반도체", "배터리", "보안", "해킹", "과학", "우주", "바이오", "플랫폼", "모빌리티")
            .any(query::contains) -> GdeltSearchProfile("technology", "TECHNOLOGY,INFORMATION,INFRASTRUCTURE")
        listOf("사건", "사고", "재난", "법원", "수사", "의료", "보건", "교육", "노동", "교통", "안전")
            .any(query::contains) -> GdeltSearchProfile(
            "society",
            "CRIME,HEALTH,DEMOGRAPHIC,INFRASTRUCTURE,ENVIRONMENT,Violence against civilians,Protests",
        )
        listOf("날씨", "식품", "리콜", "건강", "질병", "주거", "요금", "환경", "기후", "여행")
            .any(query::contains) -> GdeltSearchProfile("life", "HEALTH,ENVIRONMENT,INFRASTRUCTURE,DEMOGRAPHIC")
        listOf("프로야구", "축구", "농구", "배구", "국가대표", "올림픽", "월드컵", "스포츠", "경기 결과", "이적", "부상")
            .any(query::contains) -> GdeltSearchProfile("sports", "SPORTS")
        listOf("LCK", "e스포츠", "리그오브레전드", "발로란트", "오버워치")
            .any(query::contains) -> GdeltSearchProfile("esports", "SPORTS,TECHNOLOGY")
        listOf("영화", "드라마", "음악", "공연", "출판", "전시", "방송", "콘텐츠", "문화재")
            .any(query::contains) -> GdeltSearchProfile("culture", "ENTERTAINMENT,CULTURE")
        listOf("정부", "정책", "국회", "법안", "복지", "대통령", "국무회의")
            .any(query::contains) -> GdeltSearchProfile("policy", "POLITICAL,ECONOMIC,DEMOGRAPHIC")
        else -> null
    }

    private fun publisherFrom(url: String): String = runCatching {
        URI(url).host?.lowercase()?.removePrefix("www.")
    }.getOrNull().orEmpty().ifBlank { "해외 원문" }
}

private data class OfficialFeed(val publisher: String, val url: String, val profiles: Set<String>)

@Component
@ConditionalOnProperty(name = ["app.news.official-rss.enabled"], havingValue = "true", matchIfMissing = true)
class OfficialRssNewsClient(
    @Value("\${app.news.official-rss.read-timeout-seconds:20}") readTimeoutSeconds: Long,
) : NewsProvider {
    private val client = RestClient.builder()
        .requestFactory(SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(Duration.ofSeconds(10))
            setReadTimeout(Duration.ofSeconds(readTimeoutSeconds.coerceIn(10, 60)))
        })
        .build()
    private val cache = ConcurrentHashMap<LocalDate, List<Pair<OfficialFeed, CollectedArticle>>>()
    private val feeds = listOf(
        OfficialFeed("한국은행", "https://www.bok.or.kr/portal/bbs/B0000552/news.rss?menuNo=200690", setOf("economy", "finance")),
        OfficialFeed("금융위원회", "https://www.fsc.go.kr/about/fsc_bbs_rss/?fid=0111", setOf("policy", "economy", "finance")),
        OfficialFeed("질병관리청", "https://www.kdca.go.kr/bbs/kdca/41/rssList.do?row=50", setOf("society", "life")),
    )

    override fun search(query: String, display: Int, start: Int): List<CollectedArticle> {
        val zone = ZoneId.of("Asia/Seoul")
        return searchForDate(query, LocalDate.now(zone).minusDays(1), zone, display, start)
    }

    override fun searchForDate(
        query: String,
        coverageDate: LocalDate,
        zone: ZoneId,
        display: Int,
        start: Int,
    ): List<CollectedArticle> {
        if (start > 1) return emptyList()
        val profile = profileFor(query) ?: return emptyList()
        return cache.computeIfAbsent(coverageDate) {
            feeds.flatMap { feed -> fetchFeed(feed, coverageDate, zone).map { feed to it } }
        }.filter { (feed) -> profile in feed.profiles }
            .map { it.second }
            .distinctBy(CollectedArticle::originalUrl)
            .take(display.coerceIn(1, 100))
    }

    private fun fetchFeed(feed: OfficialFeed, coverageDate: LocalDate, zone: ZoneId): List<CollectedArticle> = runCatching {
        val xml = client.get().uri(feed.url).retrieve().body(String::class.java).orEmpty()
        if (xml.isBlank()) return emptyList()
        val factory = DocumentBuilderFactory.newInstance().apply {
            isNamespaceAware = true
            setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
            setFeature("http://xml.org/sax/features/external-general-entities", false)
            setFeature("http://xml.org/sax/features/external-parameter-entities", false)
            setAttribute("http://javax.xml.XMLConstants/property/accessExternalDTD", "")
            setAttribute("http://javax.xml.XMLConstants/property/accessExternalSchema", "")
        }
        val document = factory.newDocumentBuilder().parse(InputSource(StringReader(xml)))
        val items = document.getElementsByTagName("item")
        (0 until items.length).mapNotNull { index ->
            val item = items.item(index) as? Element ?: return@mapNotNull null
            val title = item.childText("title").cleanHtml()
            val rawUrl = item.childText("link").trim()
            val description = item.childTexts("description").maxByOrNull(String::length).orEmpty().cleanHtml().take(1400)
            val publishedAt = parsePublishedAt(item.childText("pubDate").ifBlank { item.childText("date") }, coverageDate, zone)
                ?: return@mapNotNull null
            val url = runCatching { URI(feed.url).resolve(rawUrl).toString() }.getOrDefault(rawUrl)
            if (title.isBlank() || url.isBlank() || publishedAt.atZoneSameInstant(zone).toLocalDate() != coverageDate) null
            else CollectedArticle(
                title = title,
                description = description,
                originalUrl = url,
                publishedAt = publishedAt,
                publisher = feed.publisher,
                editorialPriority = 95,
                imageUrl = item.representativeImageUrl(feed.url),
            )
        }
    }.getOrDefault(emptyList())

    private fun profileFor(query: String): String? = when {
        listOf("금융", "금융위원회", "금융감독원", "한국은행", "은행", "대출", "가계부채", "증시", "환율", "보험", "연금")
            .any(query::contains) -> "finance"
        listOf("금리", "물가", "환율", "증시", "금융", "부동산", "가계대출", "기업", "실적", "수출", "고용", "소비")
            .any(query::contains) -> "economy"
        listOf("의료", "보건", "건강", "질병", "감염", "식품", "리콜")
            .any(query::contains) -> if (query.contains("건강") || query.contains("질병") || query.contains("식품")) "life" else "society"
        listOf("정부", "정책", "국회", "법안", "복지", "노동", "주거", "교육", "대통령", "국무회의")
            .any(query::contains) -> "policy"
        else -> null
    }

    private fun parsePublishedAt(value: String, fallbackDate: LocalDate, zone: ZoneId): OffsetDateTime? {
        val raw = value.trim()
        if (raw.isBlank()) return null
        return sequenceOf<() -> OffsetDateTime>(
            { ZonedDateTime.parse(raw, DateTimeFormatter.RFC_1123_DATE_TIME).toOffsetDateTime() },
            { OffsetDateTime.parse(raw) },
            { LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S")).atZone(zone).toOffsetDateTime() },
            { LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).atZone(zone).toOffsetDateTime() },
            { LocalDate.parse(raw.take(10)).atTime(12, 0).atZone(zone).toOffsetDateTime() },
        ).mapNotNull { parser -> runCatching(parser).getOrNull() }.firstOrNull()
            ?: fallbackDate.atTime(12, 0).atZone(zone).toOffsetDateTime().takeIf { raw.contains(fallbackDate.toString()) }
    }

    private fun Element.childText(localName: String): String = childTexts(localName).firstOrNull().orEmpty()

    private fun Element.childTexts(localName: String): List<String> = (0 until childNodes.length).mapNotNull { index ->
        childNodes.item(index).takeIf { it.localName == localName || it.nodeName.substringAfter(':') == localName }?.textContent
    }

    private fun Element.representativeImageUrl(feedUrl: String): String? {
        val mediaCandidates = listOf("content", "thumbnail").flatMap { localName ->
            val nodes = getElementsByTagNameNS("*", localName)
            (0 until nodes.length).mapNotNull { index ->
                (nodes.item(index) as? Element)?.getAttribute("url")?.trim()?.takeIf(String::isNotBlank)
            }
        }
        val enclosures = getElementsByTagName("enclosure")
        val enclosureCandidates = (0 until enclosures.length).mapNotNull { index ->
            val enclosure = enclosures.item(index) as? Element ?: return@mapNotNull null
            val type = enclosure.getAttribute("type").lowercase()
            enclosure.getAttribute("url").trim().takeIf { it.isNotBlank() && type.startsWith("image/") }
        }
        return (mediaCandidates + enclosureCandidates).firstNotNullOfOrNull { candidate ->
            runCatching { URI(feedUrl).resolve(candidate).toString() }.getOrNull()
        }
    }

    private fun String.cleanHtml(): String = HtmlUtils.htmlUnescape(replace(Regex("<[^>]+>"), " "))
        .replace(Regex("\\s+"), " ")
        .trim()
}
