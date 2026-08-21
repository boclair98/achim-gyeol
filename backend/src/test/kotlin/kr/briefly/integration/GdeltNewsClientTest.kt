package kr.briefly.integration

import com.sun.net.httpserver.HttpServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.time.LocalDate
import java.time.ZoneId

class GdeltNewsClientTest {
    private var server: HttpServer? = null

    @AfterEach
    fun stopServer() {
        server?.stop(0)
    }

    @Test
    fun `중요도가 높고 여러 매체가 보도한 해외 사건만 수집한다`() {
        var authorization = ""
        var query = ""
        server = HttpServer.create(InetSocketAddress(0), 0).apply {
            createContext("/api/v2/stories") { exchange ->
                authorization = exchange.requestHeaders.getFirst("Authorization").orEmpty()
                query = exchange.requestURI.rawQuery.orEmpty()
                val body = """
                    {
                      "success": true,
                      "data": [
                        {
                          "title": "Central bank keeps interest rates unchanged",
                          "story_date": "2026-08-13",
                          "category": "Economic",
                          "geo": {"country": "United States"},
                          "metrics": {"significance": 0.82, "article_count": 14},
                          "linked_events": [{"title": "Rate decision announced"}],
                          "top_articles": [
                            {"url": "https://one.example/story", "title": "Rates held steady", "domain": "one.example"},
                            {"url": "https://two.example/story", "title": "Central bank holds rates", "domain": "two.example"},
                            {"url": "https://three.example/story", "title": "No change in benchmark rate", "domain": "three.example"}
                          ]
                        },
                        {
                          "title": "Two outlets only",
                          "story_date": "2026-08-13",
                          "category": "Economic",
                          "metrics": {"significance": 0.91, "article_count": 10},
                          "top_articles": [
                            {"url": "https://same-one.example/story", "title": "First report", "domain": "same-one.example"},
                            {"url": "https://same-two.example/story", "title": "Second report", "domain": "same-two.example"}
                          ]
                        },
                        {
                          "title": "Minor corporate update",
                          "story_date": "2026-08-13",
                          "category": "Corporate",
                          "metrics": {"significance": 0.12, "article_count": 4},
                          "top_articles": [
                            {"url": "https://low-one.example/story", "title": "Update", "domain": "low-one.example"},
                            {"url": "https://low-two.example/story", "title": "Update", "domain": "low-two.example"}
                          ]
                        }
                      ]
                    }
                """.trimIndent().toByteArray()
                exchange.responseHeaders.add("Content-Type", "application/json")
                exchange.sendResponseHeaders(200, body.size.toLong())
                exchange.responseBody.use { it.write(body) }
            }
            start()
        }
        val client = GdeltNewsClient(
            apiKey = "gdelt_test_key",
            baseUrl = "http://127.0.0.1:${server!!.address.port}",
            minimumArticleCount = 3,
            minimumSignificance = 0.45,
            readTimeoutSeconds = 30,
        )

        val articles = client.searchForDate(
            query = "금리 물가 환율",
            coverageDate = LocalDate.of(2026, 8, 13),
            zone = ZoneId.of("Asia/Seoul"),
            display = 100,
            start = 1,
        )

        assertThat(authorization).isEqualTo("Bearer gdelt_test_key")
        assertThat(query).contains("date=2026-08-13", "article_count_min=3", "sort=significance")
        assertThat(articles).hasSize(3)
        assertThat(articles.map(CollectedArticle::publisher)).containsExactlyInAnyOrder("one.example", "two.example", "three.example")
        assertThat(articles).allMatch { it.editorialPriority == 82 }
        assertThat(articles).allMatch { it.title == "Central bank keeps interest rates unchanged" }
    }

    @Test
    fun `문화와 스포츠 검색은 넓어진 GDELT 분야에 매핑한다`() {
        val queries = mutableListOf<String>()
        server = HttpServer.create(InetSocketAddress(0), 0).apply {
            createContext("/api/v2/stories") { exchange ->
                queries += exchange.requestURI.query.orEmpty()
                val body = """{"success":true,"data":[]}""".toByteArray()
                exchange.responseHeaders.add("Content-Type", "application/json")
                exchange.sendResponseHeaders(200, body.size.toLong())
                exchange.responseBody.use { it.write(body) }
            }
            start()
        }
        val client = GdeltNewsClient("key", "http://127.0.0.1:${server!!.address.port}", 3, 0.45, 30)

        client.searchForDate("영화 드라마", LocalDate.of(2026, 8, 13), ZoneId.of("Asia/Seoul"), 100, 1)
        client.searchForDate("프로야구 경기 결과", LocalDate.of(2026, 8, 13), ZoneId.of("Asia/Seoul"), 100, 1)

        assertThat(queries).anyMatch { it.contains("category=ENTERTAINMENT,CULTURE") }
        assertThat(queries).anyMatch { it.contains("category=SPORTS") }
    }
}
