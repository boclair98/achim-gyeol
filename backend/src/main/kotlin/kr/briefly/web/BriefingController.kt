package kr.briefly.web

import jakarta.validation.Valid
import jakarta.validation.constraints.Size
import kr.briefly.domain.FeedbackType
import kr.briefly.service.BriefingResponse
import kr.briefly.service.BriefingService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

data class FeedbackRequest(val type: FeedbackType, @field:Size(max = 600) val detail: String? = null)

@RestController
@RequestMapping("/api")
class BriefingController(private val briefingService: BriefingService) {
    @GetMapping("/briefings/today") fun today(): BriefingResponse = briefingService.latest()
    @GetMapping("/briefings/{date}") fun byDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate) = briefingService.byDate(date)

    @PostMapping("/stories/{storyId}/feedback")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun feedback(@PathVariable storyId: Long, @RequestHeader("X-Coders-User", required = false) user: String?, @RequestHeader("X-Achim-Device", required = false) deviceId: String?, @Valid @RequestBody request: FeedbackRequest) {
        briefingService.feedback(storyId, RequesterIdentity.resolve(user, deviceId), request.type, request.detail)
    }
}

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(IllegalStateException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun notFound(exception: IllegalStateException) = mapOf("message" to (exception.message ?: "찾을 수 없습니다"))
}
