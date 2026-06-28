package com.studyplanner.service;

import com.studyplanner.dto.request.ExamRequest;
import com.studyplanner.dto.request.SubjectRequest;
import com.studyplanner.entity.DifficultyLevel;
import com.studyplanner.entity.Exam;
import com.studyplanner.entity.Subject;
import com.studyplanner.entity.User;
import com.studyplanner.repository.ExamRepository;
import com.studyplanner.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubjectService {
    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    ExamRepository examRepository;

    @Autowired
    UserService userService;

    public List<Subject> getSubjectsByUserId(Long userId) {
        return subjectRepository.findByUserId(userId);
    }

    public Subject getSubjectById(Long subjectId) {
        return subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Error: Subject not found."));
    }

    public Subject getSubjectSecure(Long subjectId, Long userId) {
        Subject subject = getSubjectById(subjectId);
        if (!subject.getUser().getId().equals(userId)) {
            throw new RuntimeException("Error: Unauthorized subject access.");
        }
        return subject;
    }

    @Transactional
    public Subject createSubject(Long userId, SubjectRequest request) {
        User user = userService.getUserById(userId);
        
        DifficultyLevel difficulty;
        try {
            difficulty = DifficultyLevel.valueOf(request.getDifficulty().toUpperCase());
        } catch (IllegalArgumentException e) {
            difficulty = DifficultyLevel.MEDIUM;
        }

        Subject subject = new Subject(user, request.getName(), difficulty, request.getColor());
        subject.setStudyDurationMinutes(request.getStudyDurationMinutes() != null ? request.getStudyDurationMinutes() : 60);
        return subjectRepository.save(subject);
    }

    @Transactional
    public Subject updateSubject(Long subjectId, Long userId, SubjectRequest request) {
        Subject subject = getSubjectSecure(subjectId, userId);
        
        DifficultyLevel difficulty;
        try {
            difficulty = DifficultyLevel.valueOf(request.getDifficulty().toUpperCase());
        } catch (IllegalArgumentException e) {
            difficulty = DifficultyLevel.MEDIUM;
        }

        subject.setName(request.getName());
        subject.setDifficulty(difficulty);
        subject.setColor(request.getColor());
        subject.setStudyDurationMinutes(request.getStudyDurationMinutes() != null ? request.getStudyDurationMinutes() : 60);
        return subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(Long subjectId, Long userId) {
        Subject subject = getSubjectSecure(subjectId, userId);
        subjectRepository.delete(subject);
    }

    // Exam Management
    public List<Exam> getExamsByUserId(Long userId) {
        return examRepository.findBySubjectUserId(userId);
    }

    public List<Exam> getUpcomingExams(Long userId) {
        return examRepository.findBySubjectUserIdAndExamDateAfterOrderByExamDateAsc(userId, LocalDateTime.now());
    }

    @Transactional
    public Exam addExam(Long userId, ExamRequest request) {
        Subject subject = getSubjectSecure(request.getSubjectId(), userId);
        Exam exam = new Exam(subject, request.getTitle(), request.getExamDate());
        return examRepository.save(exam);
    }

    @Transactional
    public void deleteExam(Long examId, Long userId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Error: Exam deadline not found."));
        
        if (!exam.getSubject().getUser().getId().equals(userId)) {
            throw new RuntimeException("Error: Unauthorized exam access.");
        }
        
        examRepository.delete(exam);
    }
}
