package com.studyplanner.repository;

import com.studyplanner.entity.StudyPlanSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudyPlanSlotRepository extends JpaRepository<StudyPlanSlot, Long> {
    List<StudyPlanSlot> findByUserIdAndPlanDate(Long userId, LocalDate planDate);
    List<StudyPlanSlot> findByUserIdAndPlanDateBetweenOrderByPlanDateAscStartTimeAsc(Long userId, LocalDate start, LocalDate end);
    void deleteByUserIdAndPlanDate(Long userId, LocalDate planDate);
    void deleteByUserIdAndPlanDateBetween(Long userId, LocalDate start, LocalDate end);
    List<StudyPlanSlot> findByTaskId(Long taskId);
}

