package com.studyplanner.dto.response;

import java.util.List;

public class WeeklyAnalyticsResponse {
    private List<SubjectProgress> subjectProgressList;
    private List<DailyCompletion> dailyCompletionList;

    public WeeklyAnalyticsResponse(List<SubjectProgress> subjectProgressList, List<DailyCompletion> dailyCompletionList) {
        this.subjectProgressList = subjectProgressList;
        this.dailyCompletionList = dailyCompletionList;
    }

    public List<SubjectProgress> getSubjectProgressList() { return subjectProgressList; }
    public void setSubjectProgressList(List<SubjectProgress> subjectProgressList) { this.subjectProgressList = subjectProgressList; }

    public List<DailyCompletion> getDailyCompletionList() { return dailyCompletionList; }
    public void setDailyCompletionList(List<DailyCompletion> dailyCompletionList) { this.dailyCompletionList = dailyCompletionList; }

    public static class SubjectProgress {
        private String subjectName;
        private String color;
        private double totalHours;
        private double completedHours;

        public SubjectProgress(String subjectName, String color, double totalHours, double completedHours) {
            this.subjectName = subjectName;
            this.color = color;
            this.totalHours = totalHours;
            this.completedHours = completedHours;
        }

        public String getSubjectName() { return subjectName; }
        public String getColor() { return color; }
        public double getTotalHours() { return totalHours; }
        public double getCompletedHours() { return completedHours; }
    }

    public static class DailyCompletion {
        private String date; // YYYY-MM-DD
        private int totalSlots;
        private int completedSlots;

        public DailyCompletion(String date, int totalSlots, int completedSlots) {
            this.date = date;
            this.totalSlots = totalSlots;
            this.completedSlots = completedSlots;
        }

        public String getDate() { return date; }
        public int getTotalSlots() { return totalSlots; }
        public int getCompletedSlots() { return completedSlots; }
    }
}
