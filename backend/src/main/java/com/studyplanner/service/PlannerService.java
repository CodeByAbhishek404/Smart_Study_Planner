package com.studyplanner.service;

import com.studyplanner.dto.request.PlanGenerationRequest;
import com.studyplanner.dto.response.DashboardSummary;
import com.studyplanner.dto.response.WeeklyAnalyticsResponse;
import com.studyplanner.entity.*;
import com.studyplanner.repository.ExamRepository;
import com.studyplanner.repository.StudyPlanSlotRepository;
import com.studyplanner.repository.StudyTaskRepository;
import com.studyplanner.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlannerService {
    @Autowired
    StudyPlanSlotRepository planSlotRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    StudyTaskRepository taskRepository;

    @Autowired
    ExamRepository examRepository;

    @Autowired
    UserService userService;

    @Transactional
    public List<StudyPlanSlot> generatePlan(Long userId, PlanGenerationRequest request) {
        LocalDate start = request.getStartDate();
        LocalDate end = request.getEndDate();

        if (end.isBefore(start)) {
            throw new RuntimeException("Error: End date cannot be before start date.");
        }

        User user = userService.getUserById(userId);
        UserPreference preference = userService.getPreferenceByUserId(userId);
        
        double dailyHours = request.getDailyStudyHours() != null ? request.getDailyStudyHours() : preference.getDailyStudyHours();
        LocalTime preferredStart = preference.getPreferredStartTime();

        // Determine number of 1-hour study slots to schedule per day
        int totalSlotsCount = (int) Math.max(1, Math.round(dailyHours));

        List<StudyPlanSlot> generatedSlots = new ArrayList<>();

        // Track cumulative study hours allocated to each subject during this generation run to ensure fair rotation across days
        Map<Long, Double> cumulativeHoursScheduled = new HashMap<>();

        // Iterate through each date in the range
        LocalDate currentDate = start;
        while (!currentDate.isAfter(end)) {
            // 1. Delete existing plans for this date to support updates/regeneration
            planSlotRepository.deleteByUserIdAndPlanDate(userId, currentDate);

            // 2. Fetch user's subjects
            List<Subject> subjects = subjectRepository.findByUserId(userId);
            if (subjects.isEmpty()) {
                currentDate = currentDate.plusDays(1);
                continue;
            }

            // 3. Fetch active items for calculations
            final LocalDate currentPlanDate = currentDate;
            List<Exam> exams = examRepository.findBySubjectUserIdAndExamDateAfterOrderByExamDateAsc(userId, currentPlanDate.atStartOfDay());
            List<StudyTask> pendingTasks = taskRepository.findBySubjectUserIdAndCompleted(userId, false);

            // 4. Calculate Priority Scores for each subject
            Map<Subject, Double> priorities = new HashMap<>();
            Map<Subject, List<StudyTask>> tasksBySubject = new HashMap<>();

            for (Subject subject : subjects) {
                // Difficulty factor (EASY=2.0, MEDIUM=5.0, HARD=10.0)
                double difficultyWeight = 5.0;
                if (subject.getDifficulty() == DifficultyLevel.EASY) difficultyWeight = 2.0;
                else if (subject.getDifficulty() == DifficultyLevel.HARD) difficultyWeight = 10.0;

                // Exam urgency factor
                double urgencyWeight = 0.0;
                Optional<Exam> nearestExam = exams.stream()
                         .filter(e -> e.getSubject().getId().equals(subject.getId()))
                         .findFirst();
                if (nearestExam.isPresent()) {
                    long daysToExam = ChronoUnit.DAYS.between(currentPlanDate, nearestExam.get().getExamDate().toLocalDate());
                    if (daysToExam >= 0) {
                        urgencyWeight = 15.0 / (daysToExam + 1.0); // Extreme high weight if exam is today/tomorrow
                    }
                }

                // Pending tasks weight
                List<StudyTask> subjectTasks = pendingTasks.stream()
                        .filter(t -> t.getSubject().getId().equals(subject.getId()))
                        .sorted(Comparator.comparing(StudyTask::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())))
                        .collect(Collectors.toList());
                tasksBySubject.put(subject, subjectTasks);
                double taskWeight = subjectTasks.size() * 1.5;

                // Calculate base priority weight
                double priorityWeight = difficultyWeight + urgencyWeight + taskWeight;

                // Subtract a penalty based on cumulative study hours already scheduled relative to priority weight
                // This ensures subjects get scheduled in proportion to their priorities (fair-share scheduling)
                double historyPenalty = 0.0;
                if (priorityWeight > 0.0) {
                    historyPenalty = (cumulativeHoursScheduled.getOrDefault(subject.getId(), 0.0) / priorityWeight) * 15.0;
                }

                double totalPriority = priorityWeight - historyPenalty;
                priorities.put(subject, totalPriority);
            }

            // 5. Apportion slots based on Queue Priority
            if (request.getDistributeEqually() != null && request.getDistributeEqually()) {
                // Sort subjects by priority
                List<Subject> sortedSubjects = new ArrayList<>(subjects);
                sortedSubjects.sort((s1, s2) -> Double.compare(priorities.getOrDefault(s2, 0.0), priorities.getOrDefault(s1, 0.0)));

                double duration = dailyHours / sortedSubjects.size();
                double hoursScheduled = 0.0;

                for (Subject chosenSubject : sortedSubjects) {
                    if (hoursScheduled >= dailyHours) break;

                    // Allocate slot details
                    LocalTime slotStart = preferredStart.plusMinutes((int) Math.round(hoursScheduled * 60));
                    int totalMinutes = (int) Math.round(duration * 60);
                    int studyMinutes = totalMinutes; // No break time subtracted in equal split mode
                    LocalTime slotEnd = slotStart.plusMinutes(studyMinutes);

                    // Link task if available
                    StudyTask assignedTask = null;
                    List<StudyTask> subjectTasks = tasksBySubject.get(chosenSubject);
                    if (subjectTasks != null && !subjectTasks.isEmpty()) {
                        assignedTask = subjectTasks.remove(0);
                    }

                    // Create plan slot
                    StudyPlanSlot slot = new StudyPlanSlot(
                            user,
                            chosenSubject,
                            assignedTask,
                            currentPlanDate,
                            slotStart,
                            slotEnd,
                            studyMinutes
                    );

                    generatedSlots.add(planSlotRepository.save(slot));
                    cumulativeHoursScheduled.put(chosenSubject.getId(), cumulativeHoursScheduled.getOrDefault(chosenSubject.getId(), 0.0) + duration);
                    hoursScheduled += duration;
                }
            } else {
                Map<Subject, Double> currentPriorities = new HashMap<>(priorities);
                double hoursScheduled = 0.0;

                while (hoursScheduled < dailyHours) {
                    // Find subject with highest priority
                    Subject chosenSubject = currentPriorities.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null);

                    if (chosenSubject == null) break;

                    int preferredMinutes = chosenSubject.getStudyDurationMinutes() != null ? chosenSubject.getStudyDurationMinutes() : 60;
                    double preferredHours = preferredMinutes / 60.0;
                    double duration = Math.min(preferredHours, dailyHours - hoursScheduled);

                    if (duration < 0.25) { // less than 15 minutes left
                        break;
                    }

                    // Allocate slot details
                    LocalTime slotStart = preferredStart.plusMinutes((int) Math.round(hoursScheduled * 60));
                    int totalMinutes = (int) Math.round(duration * 60);
                    int studyMinutes = totalMinutes; // Keep the full session block duration as defined in the subject portfolio
                    LocalTime slotEnd = slotStart.plusMinutes(studyMinutes);

                    // Link task if available
                    StudyTask assignedTask = null;
                    List<StudyTask> subjectTasks = tasksBySubject.get(chosenSubject);
                    if (subjectTasks != null && !subjectTasks.isEmpty()) {
                        assignedTask = subjectTasks.remove(0); // Assign the first task and remove from backlog
                    }

                    // Create plan slot
                    StudyPlanSlot slot = new StudyPlanSlot(
                            user,
                            chosenSubject,
                            assignedTask,
                            currentPlanDate,
                            slotStart,
                            slotEnd,
                            studyMinutes
                    );

                    generatedSlots.add(planSlotRepository.save(slot));
                    cumulativeHoursScheduled.put(chosenSubject.getId(), cumulativeHoursScheduled.getOrDefault(chosenSubject.getId(), 0.0) + duration);

                    // Satisfy/diminish priority for the scheduled subject to rotate scheduling allocations
                    currentPriorities.put(chosenSubject, currentPriorities.get(chosenSubject) - (5.0 * duration));

                    hoursScheduled += duration;
                }
            }

            currentDate = currentDate.plusDays(1);
        }

        return generatedSlots;
    }

    public List<StudyPlanSlot> getDailyPlan(Long userId, LocalDate date) {
        return planSlotRepository.findByUserIdAndPlanDate(userId, date);
    }

    @Transactional
    public StudyPlanSlot toggleSlotCompletion(Long slotId, Long userId) {
        StudyPlanSlot slot = planSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Error: Study slot not found."));

        if (!slot.getUser().getId().equals(userId)) {
            throw new RuntimeException("Error: Unauthorized study slot access.");
        }

        slot.setCompleted(!slot.isCompleted());
        
        // Also update the completion status of the associated study task, if linked
        if (slot.getTask() != null) {
            Long taskId = slot.getTask().getId();
            slot.getTask().setCompleted(slot.isCompleted());
            taskRepository.save(slot.getTask());

            // Sync all slots pointing to the same task (including this slot)
            List<StudyPlanSlot> associatedSlots = planSlotRepository.findByTaskId(taskId);
            for (StudyPlanSlot assocSlot : associatedSlots) {
                assocSlot.setCompleted(slot.isCompleted());
            }
            planSlotRepository.saveAll(associatedSlots);
        } else {
            planSlotRepository.save(slot);
        }

        return slot;
    }


    public DashboardSummary getDashboardSummary(Long userId) {
        int subjectsCount = subjectRepository.findByUserId(userId).size();
        
        List<StudyPlanSlot> todaySlots = planSlotRepository.findByUserIdAndPlanDate(userId, LocalDate.now());
        int totalTasks = todaySlots.size();
        int completedTasks = (int) todaySlots.stream().filter(StudyPlanSlot::isCompleted).count();
        
        int upcomingExams = examRepository.findBySubjectUserIdAndExamDateAfterOrderByExamDateAsc(userId, LocalDateTime.now()).size();
        double hoursScheduled = todaySlots.stream().mapToDouble(StudyPlanSlot::getDurationMinutes).sum() / 60.0;
        double hoursCompleted = todaySlots.stream()
                .filter(StudyPlanSlot::isCompleted)
                .mapToDouble(StudyPlanSlot::getDurationMinutes)
                .sum() / 60.0;

        int productivityScore = 0;
        if (!todaySlots.isEmpty()) {
            long completedSlots = todaySlots.stream().filter(StudyPlanSlot::isCompleted).count();
            productivityScore = (int) Math.round((double) completedSlots * 100.0 / todaySlots.size());
        }

        return new DashboardSummary(
                subjectsCount,
                totalTasks,
                completedTasks,
                upcomingExams,
                hoursScheduled,
                hoursCompleted,
                productivityScore
        );
    }

    public WeeklyAnalyticsResponse getWeeklyAnalytics(Long userId) {
        LocalDate today = LocalDate.now();
        // Calculate start of current week (Monday)
        LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        List<StudyPlanSlot> weeklySlots = planSlotRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAscStartTimeAsc(userId, startOfWeek, endOfWeek);

        // 1. Group progress by subject weekly study slots
        List<Subject> subjects = subjectRepository.findByUserId(userId);
        List<WeeklyAnalyticsResponse.SubjectProgress> subjectProgresses = new ArrayList<>();

        for (Subject subject : subjects) {
            List<StudyPlanSlot> subjectSlots = weeklySlots.stream()
                    .filter(s -> s.getSubject().getId().equals(subject.getId()))
                    .collect(Collectors.toList());

            double totalHours = subjectSlots.stream().mapToDouble(StudyPlanSlot::getDurationMinutes).sum() / 60.0;
            double completedHours = subjectSlots.stream()
                    .filter(StudyPlanSlot::isCompleted)
                    .mapToDouble(StudyPlanSlot::getDurationMinutes)
                    .sum() / 60.0;

            subjectProgresses.add(new WeeklyAnalyticsResponse.SubjectProgress(
                    subject.getName(),
                    subject.getColor(),
                    totalHours,
                    completedHours
            ));
        }

        // 2. Group completion rates by day
        List<WeeklyAnalyticsResponse.DailyCompletion> dailyCompletions = new ArrayList<>();
        LocalDate checkDate = startOfWeek;
        while (!checkDate.isAfter(endOfWeek)) {
            final LocalDate currentCheckDate = checkDate;
            List<StudyPlanSlot> daySlots = weeklySlots.stream()
                    .filter(s -> s.getPlanDate().equals(currentCheckDate))
                    .collect(Collectors.toList());

            int total = daySlots.size();
            int completed = (int) daySlots.stream().filter(StudyPlanSlot::isCompleted).count();

            dailyCompletions.add(new WeeklyAnalyticsResponse.DailyCompletion(
                    currentCheckDate.toString(),
                    total,
                    completed
            ));

            checkDate = checkDate.plusDays(1);
        }

        return new WeeklyAnalyticsResponse(subjectProgresses, dailyCompletions);
    }
}
