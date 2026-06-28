package com.studyplanner.controller;

import com.studyplanner.dto.request.ExamRequest;
import com.studyplanner.dto.request.SubjectRequest;
import com.studyplanner.dto.response.MessageResponse;
import com.studyplanner.entity.Exam;
import com.studyplanner.entity.Subject;
import com.studyplanner.security.UserDetailsImpl;
import com.studyplanner.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    @Autowired
    SubjectService subjectService;

    private Long getAuthenticatedUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getId();
    }

    @GetMapping
    public ResponseEntity<List<Subject>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getSubjectsByUserId(getAuthenticatedUserId()));
    }

    @PostMapping
    public ResponseEntity<Subject> createSubject(@Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.createSubject(getAuthenticatedUserId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectRequest request) {
        try {
            return ResponseEntity.ok(subjectService.updateSubject(id, getAuthenticatedUserId(), request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        try {
            subjectService.deleteSubject(id, getAuthenticatedUserId());
            return ResponseEntity.ok(new MessageResponse("Subject deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    // Exam Endpoints
    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(subjectService.getExamsByUserId(getAuthenticatedUserId()));
    }

    @GetMapping("/exams/upcoming")
    public ResponseEntity<List<Exam>> getUpcomingExams() {
        return ResponseEntity.ok(subjectService.getUpcomingExams(getAuthenticatedUserId()));
    }

    @PostMapping("/exams")
    public ResponseEntity<?> addExam(@Valid @RequestBody ExamRequest request) {
        try {
            return ResponseEntity.ok(subjectService.addExam(getAuthenticatedUserId(), request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<?> deleteExam(@PathVariable Long id) {
        try {
            subjectService.deleteExam(id, getAuthenticatedUserId());
            return ResponseEntity.ok(new MessageResponse("Exam deadline removed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
