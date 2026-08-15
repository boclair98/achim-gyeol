package kr.briefly.service

import io.minio.MinioClient
import io.minio.PutObjectArgs
import kr.briefly.domain.EditorialAuditLog
import kr.briefly.repository.EditorialAuditLogRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.net.URI
import java.nio.file.Files
import java.nio.file.Path
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit

@Component
class DatabaseBackupService(
    private val auditRepository: EditorialAuditLogRepository,
    @Value("\${spring.datasource.url}") private val jdbcUrl: String,
    @Value("\${spring.datasource.username}") private val databaseUser: String,
    @Value("\${spring.datasource.password:}") private val databasePassword: String,
    @Value("\${app.backup.enabled:false}") private val enabled: Boolean,
    @Value("\${app.backup.bucket:}") private val bucket: String,
    @Value("\${app.backup.endpoint:}") private val storageEndpoint: String,
    @Value("\${app.backup.access-key:}") private val storageAccessKey: String,
    @Value("\${app.backup.secret-key:}") private val storageSecretKey: String,
    @Value("\${app.backup.encryption-key:}") private val encryptionKey: String,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val zone = ZoneId.of("Asia/Seoul")

    @Scheduled(cron = "\${app.backup.cron:0 15 4 * * *}", zone = "Asia/Seoul")
    fun createEncryptedBackup() {
        if (!enabled) return
        val missing = buildList {
            if (!jdbcUrl.startsWith("jdbc:postgresql:")) add("postgresql database")
            if (bucket.isBlank()) add("bucket")
            if (storageEndpoint.isBlank()) add("storage endpoint")
            if (storageAccessKey.isBlank() || storageSecretKey.isBlank()) add("storage credentials")
            if (encryptionKey.length < 32) add("32+ character encryption key")
        }
        if (missing.isNotEmpty()) {
            logger.error("Encrypted database backup skipped; missing configuration: {}", missing.joinToString())
            recordAudit("DATABASE_BACKUP_FAILED", "missing=${missing.joinToString()}")
            return
        }

        val directory = Files.createTempDirectory("achim-gyeol-backup-")
        try {
            val dump = directory.resolve("database.dump")
            val encrypted = directory.resolve("database.dump.enc")
            runPgDump(dump)
            encrypt(dump, encrypted)
            val now = OffsetDateTime.now(zone)
            val rotatingSlot = now.dayOfYear % 14
            upload(encrypted, "database/slot-$rotatingSlot.dump.enc")
            upload(encrypted, "database/latest.dump.enc")
            logger.info("Encrypted database backup uploaded: slot={}, bytes={}", rotatingSlot, Files.size(encrypted))
            recordAudit("DATABASE_BACKUP_SUCCEEDED", "slot=$rotatingSlot; bytes=${Files.size(encrypted)}")
        } catch (exception: Exception) {
            logger.error("Encrypted database backup failed: {}", exception.message)
            recordAudit("DATABASE_BACKUP_FAILED", exception.message.orEmpty().take(800))
        } finally {
            directory.toFile().deleteRecursively()
        }
    }

    private fun runPgDump(target: Path) {
        val uri = URI(jdbcUrl.removePrefix("jdbc:"))
        val database = uri.path.removePrefix("/")
        require(database.isNotBlank()) { "PostgreSQL database name is missing" }
        runCommand(
            listOf(
                "pg_dump", "--format=custom", "--no-owner", "--no-acl",
                "--host", requireNotNull(uri.host), "--port", (if (uri.port > 0) uri.port else 5432).toString(),
                "--username", databaseUser, "--file", target.toString(), database,
            ),
            mapOf("PGPASSWORD" to databasePassword),
        )
    }

    private fun encrypt(source: Path, target: Path) {
        runCommand(
            listOf(
                "openssl", "enc", "-aes-256-cbc", "-pbkdf2", "-salt",
                "-in", source.toString(), "-out", target.toString(), "-pass", "env:BACKUP_PASSPHRASE",
            ),
            mapOf("BACKUP_PASSPHRASE" to encryptionKey),
        )
    }

    private fun runCommand(command: List<String>, environment: Map<String, String>) {
        val process = ProcessBuilder(command).redirectErrorStream(true).apply { environment().putAll(environment) }.start()
        val output = process.inputStream.bufferedReader().readText().takeLast(1200)
        if (!process.waitFor(15, TimeUnit.MINUTES)) {
            process.destroyForcibly()
            error("Backup command timed out")
        }
        check(process.exitValue() == 0) { "Backup command failed (${process.exitValue()}): $output" }
    }

    private fun upload(source: Path, objectName: String) {
        val client = MinioClient.builder().endpoint(storageEndpoint).credentials(storageAccessKey, storageSecretKey).build()
        Files.newInputStream(source).use { stream ->
            client.putObject(
                PutObjectArgs.builder().bucket(bucket).`object`(objectName)
                    .stream(stream, Files.size(source), -1)
                    .contentType("application/octet-stream")
                    .build(),
            )
        }
    }

    private fun recordAudit(action: String, detail: String) = runCatching {
        auditRepository.save(EditorialAuditLog(action, "DATABASE", null, "SYSTEM", detail.take(1000)))
    }.onFailure { logger.warn("Could not persist backup audit entry: {}", it.message) }
}
