package kr.briefly.service

import kr.briefly.domain.Category
import kr.briefly.domain.NewsStory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

data class BriefingCoverageDecision(
    val ready: Boolean,
    val targetMet: Boolean,
    val storyCount: Int,
    val categoryCount: Int,
    val minimumStories: Int,
    val minimumCategories: Int,
    val reasons: List<String>,
)

@Component
class BriefingCoveragePolicy @Autowired constructor(
    @Value("\${app.pipeline.minimum-delivery-stories:10}") minimumStories: Int,
    @Value("\${app.pipeline.minimum-delivery-categories:5}") minimumCategories: Int,
    @Value("\${app.pipeline.required-categories:SPORTS,ESPORTS}") requiredCategories: String,
) {
    constructor(minimumStories: Int, minimumCategories: Int) : this(minimumStories, minimumCategories, "")

    val minimumStories: Int = minimumStories.coerceAtLeast(1)
    val minimumCategories: Int = minimumCategories.coerceAtLeast(1)
    val requiredCategories: Set<Category> = requiredCategories
        .split(',', ';', ' ', '\n', '\r', '\t')
        .mapNotNull { value -> value.trim().takeIf(String::isNotBlank)?.uppercase()?.let { runCatching { Category.valueOf(it) }.getOrNull() } }
        .toSet()

    fun evaluate(stories: Collection<NewsStory>): BriefingCoverageDecision {
        val storyCount = stories.size
        val categories = stories.map(NewsStory::category).toSet()
        val categoryCount = categories.size
        val hardReasons = buildList {
            if (storyCount == 0) add("생성된 뉴스 카드가 없습니다")
            requiredCategories
                .filterNot(categories::contains)
                .sortedBy(Category::name)
                .forEach { add("필수 분야 누락: ${label(it)}") }
        }
        val targetReasons = buildList {
            if (storyCount < minimumStories) add("뉴스 수 부족: $storyCount/$minimumStories")
            if (categoryCount < minimumCategories) add("분야 다양성 부족: $categoryCount/$minimumCategories")
        }
        val reasons = (hardReasons + targetReasons).distinct()
        return BriefingCoverageDecision(
            // Sports/e-sports and at least one verified card are hard delivery
            // requirements. The 10-story and breadth targets remain soft so a
            // smaller but important edition can still be delivered.
            ready = hardReasons.isEmpty(),
            targetMet = reasons.isEmpty(),
            storyCount = storyCount,
            categoryCount = categoryCount,
            minimumStories = minimumStories,
            minimumCategories = minimumCategories,
            reasons = reasons,
        )
    }

    private fun label(category: Category): String = when (category) {
        Category.SPORTS -> "스포츠"
        Category.ESPORTS -> "e스포츠"
        else -> category.name
    }
}
