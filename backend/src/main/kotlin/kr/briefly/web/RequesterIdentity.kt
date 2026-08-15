package kr.briefly.web

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

@Component
class RequesterIdentity(
    @Value("\${app.security.trust-coders-user-header:false}") private val trustCodersUserHeader: Boolean,
) {
    private val anonymousDevicePattern = Regex("^[0-9a-fA-F-]{36}$")

    fun resolve(codersUser: String?, deviceId: String?): String = when {
        trustCodersUserHeader && !codersUser.isNullOrBlank() -> "user:${codersUser.trim().take(75)}"
        !deviceId.isNullOrBlank() && anonymousDevicePattern.matches(deviceId.trim()) -> "device:${deviceId.trim()}"
        else -> throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "이 기기를 식별하지 못했습니다. 페이지를 새로고침해 주세요.")
    }

    fun resolveOrNull(codersUser: String?, deviceId: String?): String? =
        if (codersUser.isNullOrBlank() && deviceId.isNullOrBlank()) null else resolve(codersUser, deviceId)
}
