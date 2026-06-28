package com.studyplanner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjects")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    @NotBlank
    @Size(max = 7)
    private String color = "#6366f1"; // Default hex color (indigo-500)

    @Column(name = "study_duration_minutes")
    private Integer studyDurationMinutes = 60;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Subject() {}

    public Subject(User user, String name, DifficultyLevel difficulty, String color) {
        this.user = user;
        this.name = name;
        this.difficulty = difficulty;
        this.color = color;
        this.studyDurationMinutes = 60;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public DifficultyLevel getDifficulty() { return difficulty; }
    public void setDifficulty(DifficultyLevel difficulty) { this.difficulty = difficulty; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Integer getStudyDurationMinutes() { return studyDurationMinutes; }
    public void setStudyDurationMinutes(Integer studyDurationMinutes) { this.studyDurationMinutes = studyDurationMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
