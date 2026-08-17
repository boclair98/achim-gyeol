package kr.briefly.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.net.URI

class ArticleImageResolverTest {
    @Test
    fun `대표 이미지 메타 태그를 우선순위대로 읽고 상대 주소를 절대 주소로 바꾼다`() {
        val html = """
            <html><head>
              <meta content="/images/twitter.jpg" name="twitter:image">
              <meta property="og:image" content="https://cdn.example.com/news/main.jpg?size=large">
            </head></html>
        """.trimIndent()

        assertThat(extractRepresentativeImageUrls(html, URI("https://news.example.com/article/1")))
            .containsExactly(
                "https://cdn.example.com/news/main.jpg?size=large",
                "https://news.example.com/images/twitter.jpg",
            )
    }

    @Test
    fun `데이터 주소와 자바스크립트 주소는 이미지 후보로 받지 않는다`() {
        val html = """
            <meta property="og:image" content="data:image/png;base64,abc">
            <meta name="twitter:image" content="javascript:alert(1)">
        """.trimIndent()

        assertThat(extractRepresentativeImageUrls(html, URI("https://news.example.com/article/1"))).isEmpty()
    }

    @Test
    fun `로컬 네트워크 주소는 가져오지 않는다`() {
        assertThat(isPublicHttpUri(URI("http://127.0.0.1/internal.png"))).isFalse()
        assertThat(isPublicHttpUri(URI("http://169.254.169.254/latest/meta-data"))).isFalse()
    }
}
