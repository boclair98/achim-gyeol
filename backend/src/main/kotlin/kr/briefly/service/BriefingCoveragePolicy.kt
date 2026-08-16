package kr.briefly.service

import kr.briefly.domain.NewsStory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

data class BriefingCoverageDecision(
    val ready: Boolean,
    val storyCount: Int,
    val categoryCount: Int,
    val minimumStories: Int,
    val minimumCategories: Int,
    val reasons: List<String>,
)

@Component
class BriefingCoveragePolicy(
    @Value("\${app.pipeline.minimum-delivery-stories:10}") minimumStories: Int,
    @Value("\${app.pipeline.minimum-delivery-categories:5}") minimumCategories: Int,
) {
    val minimumStories: Int = minimumStories.coerceAtLeast(1)
    val minimumCategories: Int = minimumCategories.coerceAtLeast(1)

    fun evaluate(stories: Collection<NewsStory>): BriefingCoverageDecision {
        val storyCount = stories.size
        val categoryCount = stories.map(NewsStory::category).distinct().size
        val reasons = buildList {
            if (storyCount < minimumStories) add("뉴스 수 부족: $storyCount/$minimumStories")
            if (categoryCount < minimumCategories) add("분야 다양성 부족: $categoryCount/$minimumCategories")
        }
        return BriefingCoverageDecision(
            ready = reasons.isEmpty(),
            storyCount = storyCount,
            categoryCount = categoryCount,
            minimumStories = minimumStories,
            minimumCategories = minimumCategories,
            reasons = reasons,
        )
    }
}
