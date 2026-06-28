package com.studyplanner.repository;

import com.studyplanner.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findBySubjectUserId(Long userId);
    List<Exam> findBySubjectId(Long subjectId);
    List<Exam> findBySubjectUserIdAndExamDateAfterOrderByExamDateAsc(Long userId, LocalDateTime now);
}
