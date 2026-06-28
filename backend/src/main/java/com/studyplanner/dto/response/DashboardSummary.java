package com.studyplanner.dto.response;

public class DashboardSummary {
    private int totalSubjects;
    private int totalTasks;
    private int completedTasks;
    private int upcomingExams;
    private double studyHoursScheduled;
    private double studyHoursCompleted;
    private int productivityScore; // Percentage of slots completed

    public DashboardSummary() {}

    public DashboardSummary(int totalSubjects, int totalTasks, int completedTasks, int upcomingExams, 
                            double studyHoursScheduled, double studyHoursCompleted, int productivityScore) {
        this.totalSubjects = totalSubjects;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.upcomingExams = upcomingExams;
        this.studyHoursScheduled = studyHoursScheduled;
        this.studyHoursCompleted = studyHoursCompleted;
        this.productivityScore = productivityScore;
    }

    // Getters and Setters
    public int getTotalSubjects() { return totalSubjects; }
    public void setTotalSubjects(int totalSubjects) { this.totalSubjects = totalSubjects; }

    public int getTotalTasks() { return totalTasks; }
    public void setTotalTasks(int totalTasks) { this.totalTasks = totalTasks; }

    public int getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }

    public int getUpcomingExams() { return upcomingExams; }
    public void setUpcomingExams(int upcomingExams) { this.upcomingExams = upcomingExams; }

    public double getStudyHoursScheduled() { return studyHoursScheduled; }
    public void setStudyHoursScheduled(double studyHoursScheduled) { this.studyHoursScheduled = studyHoursScheduled; }

    public double getStudyHoursCompleted() { return studyHoursCompleted; }
    public void setStudyHoursCompleted(double studyHoursCompleted) { this.studyHoursCompleted = studyHoursCompleted; }

    public int getProductivityScore() { return productivityScore; }
    public void setProductivityScore(int productivityScore) { this.productivityScore = productivityScore; }
}
