package com.studyplanner.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProfileRequest {
    @NotBlank
    @Email
    private String email;

    private String firstName;
    private String lastName;

    @NotNull
    private Double dailyStudyHours;

    @NotBlank
    private String preferredStartTime; // format: "HH:mm"

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Double getDailyStudyHours() { return dailyStudyHours; }
    public void setDailyStudyHours(Double dailyStudyHours) { this.dailyStudyHours = dailyStudyHours; }

    public String getPreferredStartTime() { return preferredStartTime; }
    public void setPreferredStartTime(String preferredStartTime) { this.preferredStartTime = preferredStartTime; }
}
