package com.studyplanner.controller;

import com.studyplanner.dto.request.PlanGenerationRequest;
import com.studyplanner.dto.response.DashboardSummary;
import com.studyplanner.dto.response.MessageResponse;
import com.studyplanner.dto.response.WeeklyAnalyticsResponse;
import com.studyplanner.entity.StudyPlanSlot;
import com.studyplanner.security.UserDetailsImpl;
import com.studyplanner.service.PlannerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/planner")
public class PlannerController {
    @Autowired
    PlannerService plannerService;

    private Long getAuthenticatedUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getId();
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateStudyPlan(@Valid @RequestBody PlanGenerationRequest request) {
        try {
            List<StudyPlanSlot> slots = plannerService.generatePlan(getAuthenticatedUserId(), request);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/daily")
    public ResponseEntity<List<StudyPlanSlot>> getDailyPlan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(plannerService.getDailyPlan(getAuthenticatedUserId(), queryDate));
    }

    @PutMapping("/slots/{id}/complete")
    public ResponseEntity<?> toggleSlotCompletion(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(plannerService.toggleSlotCompletion(id, getAuthenticatedUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummary> getDashboardSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(plannerService.getDashboardSummary(getAuthenticatedUserId(), date));
    }

    @GetMapping("/analytics")
    public ResponseEntity<WeeklyAnalyticsResponse> getWeeklyAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(plannerService.getWeeklyAnalytics(getAuthenticatedUserId(), date));
    }

    @GetMapping(value = "/export", produces = "text/calendar")
    public ResponseEntity<String> exportSchedule() {
        String icalData = plannerService.exportToICal(getAuthenticatedUserId());
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"study_schedule.ics\"")
                .body(icalData);
    }
}
