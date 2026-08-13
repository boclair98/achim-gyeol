package kr.briefly.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig(
    @Value("\${app.cors.allowed-origins:http://localhost:3000,https://morningnews.coders.kr}") private val origins: String,
) : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/api/**").allowedOrigins(*origins.split(',').map(String::trim).toTypedArray()).allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS").allowedHeaders("*")
    }
}
