package kr.briefly

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@EnableScheduling
@SpringBootApplication
class BrieflyApplication

fun main(args: Array<String>) {
    runApplication<BrieflyApplication>(*args)
}
