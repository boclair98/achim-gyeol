package kr.briefly.web

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import kr.briefly.domain.ReaderEventType
import kr.briefly.service.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.*
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

@Component
class AdminAuthorizer(
    @Value("\${app.pipeline.admin-token:}") private val adminToken: String,
    @Value("\${app.pipeline.previous-admin-token:}") private val previousAdminToken: String = "",
) {

    fun authorize(supplied: String?) {
        if (adminToken.isBlank()) error("관리자 기능이 비활성화되어 있습니다")
        val suppliedBytes = supplied.orEmpty().toByteArray(StandardCharsets.UTF_8)
        val currentMatches = MessageDigest.isEqual(adminToken.toByteArray(StandardCharsets.UTF_8), suppliedBytes)
        val previousMatches = previousAdminToken.isNotBlank() && MessageDigest.isEqual(previousAdminToken.toByteArray(StandardCharsets.UTF_8), suppliedBytes)
        if (!currentMatches && !previousMatches) {
            throw org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "관리자 토큰이 올바르지 않습니다")
        }
    }
}

data class AdminActorRequest(@field:NotBlank val actor: String, val reason: String = "")
data class StoryEditRequest(val actor: String, val update: EditorialStoryUpdate)
data class CorrectionRequest(val actor: String, val afterText: String, val reason: String)
data class EditorialIncidentRequest(@field:NotBlank val actor: String, @field:NotBlank val reason: String)
data class ReaderPreferenceRequest(val categories: Set<String>, val digestSize: String, val consent: Boolean)
data class ReaderEventRequest(val type: ReaderEventType, val editionId: Long, val storyId: Long? = null)

@RestController
@RequestMapping("/api/admin/editorial")
class EditorialController(private val service: EditorialOperationsService, private val authorizer: AdminAuthorizer) {
    @GetMapping("/queue") fun queue(@RequestHeader("X-Briefing-Admin-Token", required = false) token: String?) = authorizer.authorize(token).let { service.queue() }
    @PatchMapping("/stories/{id}") fun updateStory(@PathVariable id: Long, @RequestHeader("X-Briefing-Admin-Token", required = false) token: String?, @RequestBody request: StoryEditRequest) = authorizer.authorize(token).let { service.updateStory(id, request.update, request.actor) }
    @PostMapping("/editions/{id}/approve") fun approve(@PathVariable id: Long, @RequestHeader("X-Briefing-Admin-Token", required = false) token: String?, @RequestBody request: AdminActorRequest) = authorizer.authorize(token).let { service.approveEdition(id, request.actor) }
    @PostMapping("/editions/{id}/hold") fun hold(@PathVariable id: Long, @RequestHeader("X-Briefing-Admin-Token", required = false) token: String?, @RequestBody request: AdminActorRequest) = authorizer.authorize(token).let { service.holdEdition(id, request.actor, request.reason) }
    @PostMapping("/editions/{id}/incident") fun incident(@PathVariable id: Long, @RequestHeader("X-Briefing-Admin-Token", required = false) token: String?, @Valid @RequestBody request: EditorialIncidentRequest) = authorizer.authorize(token).let { service.declareIncident(id, request.actor, request.reason) }
    @PostMapping("/stories/{id}/corrections") fun correct(@PathVariable id: Long, @RequestHeader("X-Briefing-Admin-Token", required = false) token: String?, @RequestBody request: CorrectionRequest) = authorizer.authorize(token).let { service.correct(id, CorrectionInput(request.afterText, request.reason), request.actor) }
    @GetMapping("/metrics") fun metrics(@RequestHeader("X-Briefing-Admin-Token", required = false) token: String?) = authorizer.authorize(token).let { service.metrics() }
    @GetMapping("/audits") fun audits(@RequestHeader("X-Briefing-Admin-Token", required = false) token: String?) = authorizer.authorize(token).let { service.audits() }
    @GetMapping("/corrections") fun corrections(@RequestHeader("X-Briefing-Admin-Token", required = false) token: String?) = authorizer.authorize(token).let { service.corrections() }
    @GetMapping("/deliveries") fun deliveries(@RequestHeader("X-Briefing-Admin-Token", required = false) token: String?) = authorizer.authorize(token).let { service.deliveries() }
}

@RestController
@RequestMapping("/api/reader")
class ReaderExperienceController(private val service: ReaderExperienceService, private val requesterIdentity: RequesterIdentity) {
    @GetMapping("/preferences") fun preferences(@RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("X-Achim-Device", required = false) device: String?) = service.preferences(requesterIdentity.resolve(user, device))
    @PutMapping("/preferences") fun save(@RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("X-Achim-Device", required = false) device: String?, @Valid @RequestBody request: ReaderPreferenceRequest) = service.savePreferences(requesterIdentity.resolve(user, device), request.categories, request.digestSize, request.consent)
    @PostMapping("/events") fun event(@RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("X-Achim-Device", required = false) device: String?, @RequestBody request: ReaderEventRequest) = service.recordEvent(requesterIdentity.resolve(user, device), request.type, request.editionId, request.storyId).let { mapOf("recorded" to true) }
    @GetMapping("/data") fun exportData(@RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("X-Achim-Device", required = false) device: String?) = service.exportData(requesterIdentity.resolve(user, device))
    @DeleteMapping("/data") fun deleteData(@RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("X-Achim-Device", required = false) device: String?) = service.deleteData(requesterIdentity.resolve(user, device))
}
