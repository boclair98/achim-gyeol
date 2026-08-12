package kr.briefly.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.OffsetDateTime

enum class Category { POLICY, ECONOMY, SOCIETY, TECH }
enum class VerificationStatus { VERIFIED, DEVELOPING, CONFLICTING, SINGLE_SOURCE }
enum class FeedbackType { INCORRECT, BIASED, UNCLEAR, HELPFUL }

@Entity
@Table(name = "briefing_editions")
class BriefingEdition(
    @Column(nullable = false, unique = true) var briefingDate: LocalDate,
    @Column(nullable = false, length = 600) var lead: String,
    @Column(nullable = false) var readMinutes: Int = 5,
    @Column(nullable = false) var publishedAt: OffsetDateTime = OffsetDateTime.now(),
    @Column(nullable = false) var lastVerifiedAt: OffsetDateTime = OffsetDateTime.now(),
    @Column var pipelineGenerated: Boolean? = false,
    @OneToMany(mappedBy = "edition", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    var stories: MutableList<NewsStory> = mutableListOf(),
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
) {
    fun addStory(story: NewsStory) { stories += story; story.edition = this }
}

@Entity
@Table(name = "news_stories")
class NewsStory(
    @Enumerated(EnumType.STRING) @Column(nullable = false) var category: Category,
    @Column(nullable = false, length = 300) var title: String,
    @Column(nullable = false, length = 1200) var summary: String,
    @Column(length = 400) var oneLineSummary: String? = null,
    @Column(nullable = false, length = 700) var whyItMatters: String,
    @Enumerated(EnumType.STRING) @Column(nullable = false) var verificationStatus: VerificationStatus,
    @Column(nullable = false) var qualityScore: Int,
    @Column(nullable = false) var displayOrder: Int,
    @Column(length = 600) var uncertainty: String? = null,
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "edition_id", nullable = false)
    lateinit var edition: BriefingEdition
    @OneToMany(mappedBy = "story", cascade = [CascadeType.ALL], orphanRemoval = true)
    var sources: MutableList<NewsSource> = mutableListOf()
    @OneToMany(mappedBy = "story", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    var claims: MutableList<NewsClaim> = mutableListOf()
    fun addSource(source: NewsSource) { sources += source; source.story = this }
    fun addClaim(claim: NewsClaim) { claims += claim; claim.story = this }
}

@Entity
@Table(name = "news_claims")
class NewsClaim(
    @Column(nullable = false, length = 700) var statement: String,
    @Column(nullable = false, length = 120) var sourceIndexes: String,
    @Column(nullable = false) var displayOrder: Int,
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "story_id", nullable = false)
    lateinit var story: NewsStory
}

@Entity
@Table(name = "news_sources")
class NewsSource(
    @Column(nullable = false) var publisher: String,
    @Column(nullable = false, length = 1000) var url: String,
    @Column(nullable = false) var publishedAt: OffsetDateTime,
    @Column(nullable = false) var primarySource: Boolean = false,
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "story_id", nullable = false)
    lateinit var story: NewsStory
}

@Entity
@Table(name = "story_feedback")
class StoryFeedback(
    @Column(nullable = false) var storyId: Long,
    @Column(nullable = false) var userId: String,
    @Enumerated(EnumType.STRING) @Column(nullable = false) var type: FeedbackType,
    @Column(length = 600) var detail: String? = null,
    @Column(nullable = false) var createdAt: OffsetDateTime = OffsetDateTime.now(),
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
)

@Entity
@Table(name = "push_subscriptions", indexes = [Index(name = "idx_push_endpoint_hash", columnList = "endpointHash", unique = true)])
class PushSubscription(
    @Column(nullable = false, length = 80) var ownerId: String,
    @Column(nullable = false, length = 64) var endpointHash: String,
    @Column(nullable = false, length = 3000) var endpoint: String,
    @Column(nullable = false, length = 255) var p256dh: String,
    @Column(nullable = false, length = 255) var auth: String,
    @Column(nullable = false, length = 64) var timezone: String = "Asia/Seoul",
    @Column(nullable = false) var deliveryHour: Int = 7,
    @Column(nullable = false) var deliveryMinute: Int = 30,
    @Column(nullable = false, length = 32) var weekdays: String = "0,1,2,3,4",
    @Column(length = 500) var userAgent: String? = null,
    @Column(nullable = false) var active: Boolean = true,
    @Column(nullable = false) var createdAt: OffsetDateTime = OffsetDateTime.now(),
    @Column(nullable = false) var updatedAt: OffsetDateTime = OffsetDateTime.now(),
    var lastSentAt: OffsetDateTime? = null,
    @Column(length = 600) var lastError: String? = null,
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
)
