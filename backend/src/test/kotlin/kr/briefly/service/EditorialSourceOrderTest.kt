package kr.briefly.service

import kr.briefly.domain.BriefingEdition
import kr.briefly.domain.Category
import kr.briefly.domain.NewsClaim
import kr.briefly.domain.NewsSource
import kr.briefly.domain.NewsStory
import kr.briefly.domain.VerificationStatus
import org.assertj.core.api.Assertions.assertThat
import org.hibernate.cfg.Configuration
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.OffsetDateTime

class EditorialSourceOrderTest {
    @Test
    fun `저장 후 다시 읽어도 사실의 출처 인덱스가 같은 원문을 가리킨다`() {
        val db = Configuration()
            .setProperty("hibernate.connection.driver_class", "org.h2.Driver")
            .setProperty("hibernate.connection.url", "jdbc:h2:mem:editorial_source_order;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
            .setProperty("hibernate.connection.username", "sa")
            .setProperty("hibernate.hbm2ddl.auto", "create-drop")
            .addAnnotatedClass(BriefingEdition::class.java)
            .addAnnotatedClass(NewsStory::class.java)
            .addAnnotatedClass(NewsSource::class.java)
            .addAnnotatedClass(NewsClaim::class.java)
            .buildSessionFactory()
        db.use { factory ->
            val id = factory.openSession().use { session ->
                val transaction = session.beginTransaction()
                val edition = BriefingEdition(LocalDate.of(2026, 11, 6), "테스트 브리핑")
                val story = NewsStory(
                    category = Category.SOCIETY,
                    title = "테스트 기사",
                    summary = "검증용 요약",
                    whyItMatters = "",
                    verificationStatus = VerificationStatus.VERIFIED,
                    qualityScore = 80,
                    displayOrder = 1,
                )
                val published = OffsetDateTime.parse("2026-11-05T16:00:00+09:00")
                story.addSource(NewsSource("나중 보도", "https://z.example/news", published.plusHours(2)))
                story.addSource(NewsSource("먼저 보도", "https://a.example/news", published))
                story.addSource(NewsSource("다른 보도", "https://c.example/news", published.plusHours(1)))
                story.addClaim(NewsClaim("검증용 사실", "0,2", 1))
                edition.addStory(story)
                session.persist(edition)
                transaction.commit()
                requireNotNull(story.id)
            }
            factory.openSession().use { session ->
                val story = session.find(NewsStory::class.java, id)
                val urls = story.claims.single().sourceIndexes.split(',').map { story.sources[it.toInt()].url }
                assertThat(urls).containsExactly("https://z.example/news", "https://c.example/news")
            }
        }
    }
}
