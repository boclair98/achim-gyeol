package kr.briefly.service

import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.concurrent.Executors

enum class GenerationJobState { IDLE, RUNNING, COMPLETED, FAILED }

data class GenerationJobSnapshot(
    val state: GenerationJobState,
    val briefingDate: LocalDate? = null,
    val startedAt: OffsetDateTime? = null,
    val finishedAt: OffsetDateTime? = null,
    val result: GenerationResult? = null,
    val error: String? = null,
)

@Service
class MorningGenerationJob(private val generator: NewsBriefingGenerator) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val executor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "morning-briefing-generation").apply { isDaemon = false }
    }

    @Volatile
    private var current = GenerationJobSnapshot(GenerationJobState.IDLE)

    @Synchronized
    fun start(briefingDate: LocalDate): GenerationJobSnapshot {
        if (current.state == GenerationJobState.RUNNING) return current
        val started = GenerationJobSnapshot(
            state = GenerationJobState.RUNNING,
            briefingDate = briefingDate,
            startedAt = OffsetDateTime.now(),
        )
        current = started
        executor.submit {
            current = try {
                val result = generator.generate(briefingDate)
                logger.info("Asynchronous morning briefing generated: {}", result)
                started.copy(state = GenerationJobState.COMPLETED, finishedAt = OffsetDateTime.now(), result = result)
            } catch (exception: Exception) {
                logger.error("Asynchronous morning briefing generation failed", exception)
                started.copy(
                    state = GenerationJobState.FAILED,
                    finishedAt = OffsetDateTime.now(),
                    error = exception.message?.take(500) ?: exception.javaClass.simpleName,
                )
            }
        }
        return started
    }

    fun status(): GenerationJobSnapshot = current

    @PreDestroy
    fun shutdown() {
        executor.shutdownNow()
    }
}
