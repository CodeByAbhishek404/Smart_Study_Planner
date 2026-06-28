package com.studyplanner.entity;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "user_preferences")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class UserPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "daily_study_hours", nullable = false)
    private Double dailyStudyHours = 4.0;

    @Column(name = "preferred_start_time", nullable = false)
    private LocalTime preferredStartTime = LocalTime.of(9, 0);

    public UserPreference() {}

    public UserPreference(User user, Double dailyStudyHours, LocalTime preferredStartTime) {
        this.user = user;
        this.dailyStudyHours = dailyStudyHours;
        this.preferredStartTime = preferredStartTime;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Double getDailyStudyHours() { return dailyStudyHours; }
    public void setDailyStudyHours(Double dailyStudyHours) { this.dailyStudyHours = dailyStudyHours; }

    public LocalTime getPreferredStartTime() { return preferredStartTime; }
    public void setPreferredStartTime(LocalTime preferredStartTime) { this.preferredStartTime = preferredStartTime; }
}
