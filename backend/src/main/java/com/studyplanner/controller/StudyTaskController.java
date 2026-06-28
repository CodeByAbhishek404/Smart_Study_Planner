package com.studyplanner.controller;

import com.studyplanner.dto.request.TaskRequest;
import com.studyplanner.dto.response.MessageResponse;
import com.studyplanner.entity.StudyTask;
import com.studyplanner.security.UserDetailsImpl;
import com.studyplanner.service.StudyTaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tasks")
public class StudyTaskController {
    @Autowired
    StudyTaskService taskService;

    private Long getAuthenticatedUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getId();
    }

    @GetMapping
    public ResponseEntity<List<StudyTask>> getTasks(@RequestParam(required = false) Long subjectId) {
        if (subjectId != null) {
            return ResponseEntity.ok(taskService.getTasksBySubjectId(subjectId, getAuthenticatedUserId()));
        }
        return ResponseEntity.ok(taskService.getTasksByUserId(getAuthenticatedUserId()));
    }

    @PostMapping
    public ResponseEntity<?> createTask(@Valid @RequestBody TaskRequest request) {
        try {
            return ResponseEntity.ok(taskService.createTask(getAuthenticatedUserId(), request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, getAuthenticatedUserId(), request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> toggleTaskCompletion(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(taskService.toggleTaskCompletion(id, getAuthenticatedUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        try {
            taskService.deleteTask(id, getAuthenticatedUserId());
            return ResponseEntity.ok(new MessageResponse("Task deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
