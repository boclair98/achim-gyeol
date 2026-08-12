package kr.briefly.service

import kr.briefly.domain.EditorialAuditLog
import kr.briefly.repository.BriefingEditionRepository
import kr.briefly.repository.EditorialAuditLogRepository
import kr.briefly.repository.PushSubscriptionRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId

@Component
class OperationalReadinessMonitor(
    private val editionRepository: BriefingEditionRepository,
    private val pushRepository: PushSubscriptionRepository,
    private val auditRepository: EditorialAuditLogRepository,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val zone = ZoneId.of("Asia/Seoul")

    @Scheduled(cron = "0 45 6 * * *", zone = "Asia/Seoul")
    @Transactional
    fun checkBriefingReadiness() {
        val today = LocalDate.now(zone)
        val edition = editionRepository.findByBriefingDate(today)
        val ready = edition?.pipelineGenerated == true && edition.stories.isNotEmpty()
        val action = if (ready) "READINESS_CONFIRMED" else "READINESS_ALERT"
        if (!auditRepository.existsByActionAndCreatedAtAfter(action, OffsetDateTime.now(zone).toLocalDate().atStartOfDay(zone).toOffsetDateTime())) {
            auditRepository.save(EditorialAuditLog(action, "EDITION", edition?.id, "SYSTEM", "date=$today; stories=${edition?.stories?.size ?: 0}"))
        }
        if (ready) logger.info("Morning briefing readiness confirmed: date={}, stories={}", today, edition?.stories?.size)
        else logger.error("Morning briefing is not ready at 06:45 KST: date={}", today)
    }

    @Scheduled(cron = "0 20 7 * * *", zone = "Asia/Seoul")
    @Transactional
    fun checkDeliveryReadiness() {
        val today = LocalDate.now(zone)
        val edition = editionRepository.findByBriefingDate(today)
        val active = pushRepository.countByActiveTrue()
        val ready = edition?.pipelineGenerated == true && edition.stories.isNotEmpty()
        val action = if (ready) "DELIVERY_READY" else "DELIVERY_BLOCKED"
        if (!auditRepository.existsByActionAndCreatedAtAfter(action, OffsetDateTime.now(zone).toLocalDate().atStartOfDay(zone).toOffsetDateTime())) {
            auditRepository.save(EditorialAuditLog(action, "EDITION", edition?.id, "SYSTEM", "activeSubscriptions=$active; date=$today"))
        }
        if (!ready) logger.error("Delivery blocked at 07:20 KST: today's briefing is unavailable")
    }
}
