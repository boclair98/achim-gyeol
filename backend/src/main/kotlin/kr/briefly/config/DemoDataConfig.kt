package kr.briefly.config

import kr.briefly.domain.*
import kr.briefly.repository.BriefingEditionRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.LocalDate
import java.time.OffsetDateTime

@Configuration
class DemoDataConfig {
    @Bean fun demoBriefing(repository: BriefingEditionRepository) = CommandLineRunner {
        if (repository.count() > 0) return@CommandLineRunner
        val edition = BriefingEdition(LocalDate.now(), "어제의 소음을 걷어내고, 서로 다른 출처에서 공통으로 확인된 사실과 오늘의 의미만 담았습니다.")
        edition.addStory(story(Category.POLICY, "청년 지원 정보를 한곳에서 확인하는 통합 창구가 열렸어요", "흩어져 있던 주거·취업·교육 지원 정보를 한 번에 찾도록 공공 서비스가 개편됐습니다.", "지원 자격을 찾아다니는 시간이 줄고 신청 기한을 놓칠 가능성도 낮아집니다.", 1, "공식 발표", "https://www.korea.kr", "공영방송", "https://news.kbs.co.kr"))
        edition.addStory(story(Category.ECONOMY, "소상공인 정산 주기를 줄이는 개선안이 공개됐어요", "온라인 거래 대금이 판매자에게 전달되는 시간을 단축하는 방안이 논의되고 있습니다.", "작은 사업자의 현금 흐름이 안정될 수 있습니다.", 2, "정책자료", "https://www.korea.kr", "경제지", "https://www.hankyung.com"))
        edition.addStory(story(Category.SOCIETY, "대중교통 환승 안내가 실시간 혼잡도까지 보여주기 시작했어요", "일부 지역에서 환승 경로와 차량별 혼잡도를 함께 제공하는 시범 서비스가 시작됐습니다.", "출근 시간에 덜 붐비는 차량과 경로를 고르기 쉬워집니다.", 3, "지자체", "https://www.seoul.go.kr", "통신사", "https://www.yna.co.kr"))
        edition.addStory(story(Category.TECH, "AI 생성물의 출처를 표시하는 공통 기준 논의가 빨라지고 있어요", "AI 생성 여부를 확인할 수 있도록 표시 방식과 플랫폼 책임 범위를 정하는 논의가 이어지고 있습니다.", "실제 촬영물과 생성물을 구분하는 최소한의 신뢰 장치가 될 수 있습니다.", 4, "공식자료", "https://www.korea.kr", "IT 매체", "https://www.etnews.com"))
        repository.save(edition)
    }

    private fun story(category: Category, title: String, summary: String, why: String, order: Int, publisher1: String, url1: String, publisher2: String, url2: String): NewsStory {
        val story = NewsStory(category, title, summary, why, VerificationStatus.VERIFIED, 80, order)
        story.addSource(NewsSource(publisher1, url1, OffsetDateTime.now().minusHours(2), true))
        story.addSource(NewsSource(publisher2, url2, OffsetDateTime.now().minusHours(1)))
        return story
    }
}
