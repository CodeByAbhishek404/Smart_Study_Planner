package com.studyplanner.service;

import com.studyplanner.entity.User;
import com.studyplanner.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CronService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PlannerService plannerService;

    // Runs every day at 8:00 AM (0 0 8 * * *)
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        System.out.println("=================================================");
        System.out.println("CRON JOB TRIGGERED: Sending Daily Email Reminders");
        
        List<User> users = userRepository.findAll();
        for (User user : users) {
            System.out.println("-------------------------------------------------");
            System.out.println("To: " + user.getEmail());
            System.out.println("Subject: Your Smart Study Plan for Today");
            System.out.println("Hi " + user.getFirstName() + ",");
            System.out.println("Don't forget to check your dashboard today to complete your study goals.");
            System.out.println("Your current streak is: " + (user.getCurrentStreak() != null ? user.getCurrentStreak() : 0) + " days! Keep it up!");
        }
        
        System.out.println("=================================================");
    }
}
