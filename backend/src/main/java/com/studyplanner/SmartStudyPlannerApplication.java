package com.studyplanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartStudyPlannerApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartStudyPlannerApplication.class, args);
    }
}
