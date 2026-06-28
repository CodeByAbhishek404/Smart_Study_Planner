package com.studyplanner.repository;

import com.studyplanner.entity.StudyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudyTaskRepository extends JpaRepository<StudyTask, Long> {
    List<StudyTask> findBySubjectUserId(Long userId);
    List<StudyTask> findBySubjectId(Long subjectId);
    List<StudyTask> findBySubjectUserIdAndCompleted(Long userId, boolean completed);
    List<StudyTask> findBySubjectIdAndCompleted(Long subjectId, boolean completed);
}
