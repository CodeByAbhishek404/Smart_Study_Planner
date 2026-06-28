package com.studyplanner.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class PlanGenerationRequest {
    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    private Double dailyStudyHours; // optional, falls back to preferences if null

    private Boolean distributeEqually = false;

    // Getters and Setters
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Double getDailyStudyHours() { return dailyStudyHours; }
    public void setDailyStudyHours(Double dailyStudyHours) { this.dailyStudyHours = dailyStudyHours; }

    public Boolean getDistributeEqually() { return distributeEqually; }
    public void setDistributeEqually(Boolean distributeEqually) { this.distributeEqually = distributeEqually; }
}
