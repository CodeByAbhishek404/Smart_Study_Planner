package com.studyplanner.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubjectRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    private String difficulty; // EASY, MEDIUM, HARD

    @NotBlank
    @Size(max = 7)
    private String color;

    private Integer studyDurationMinutes;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Integer getStudyDurationMinutes() { return studyDurationMinutes; }
    public void setStudyDurationMinutes(Integer studyDurationMinutes) { this.studyDurationMinutes = studyDurationMinutes; }
}
