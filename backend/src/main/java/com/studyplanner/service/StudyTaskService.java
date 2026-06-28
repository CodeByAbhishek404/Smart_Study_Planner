package com.studyplanner.service;

import com.studyplanner.dto.request.TaskRequest;
import com.studyplanner.entity.StudyTask;
import com.studyplanner.entity.Subject;
import com.studyplanner.entity.StudyPlanSlot;
import com.studyplanner.repository.StudyTaskRepository;
import com.studyplanner.repository.StudyPlanSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class StudyTaskService {
    @Autowired
    StudyTaskRepository studyTaskRepository;

    @Autowired
    StudyPlanSlotRepository studyPlanSlotRepository;

    @Autowired
    SubjectService subjectService;

    public List<StudyTask> getTasksByUserId(Long userId) {
        return studyTaskRepository.findBySubjectUserId(userId);
    }

    public List<StudyTask> getTasksBySubjectId(Long subjectId, Long userId) {
        // Validate user owns subject
        subjectService.getSubjectSecure(subjectId, userId);
        return studyTaskRepository.findBySubjectId(subjectId);
    }

    public StudyTask getTaskSecure(Long taskId, Long userId) {
        StudyTask task = studyTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Error: Study task/topic not found."));
        
        if (!task.getSubject().getUser().getId().equals(userId)) {
            throw new RuntimeException("Error: Unauthorized task access.");
        }
        
        return task;
    }

    @Transactional
    public StudyTask createTask(Long userId, TaskRequest request) {
        Subject subject = subjectService.getSubjectSecure(request.getSubjectId(), userId);
        StudyTask task = new StudyTask(
                subject,
                request.getTitle(),
                request.getEstimatedHours(),
                request.getDueDate()
        );
        return studyTaskRepository.save(task);
    }

    @Transactional
    public StudyTask updateTask(Long taskId, Long userId, TaskRequest request) {
        StudyTask task = getTaskSecure(taskId, userId);
        
        // Handle potential subject change
        if (!task.getSubject().getId().equals(request.getSubjectId())) {
            Subject subject = subjectService.getSubjectSecure(request.getSubjectId(), userId);
            task.setSubject(subject);
        }

        task.setTitle(request.getTitle());
        task.setEstimatedHours(request.getEstimatedHours());
        task.setDueDate(request.getDueDate());
        
        if (request.getCompleted() != null) {
            boolean previousCompleted = task.isCompleted();
            task.setCompleted(request.getCompleted());
            if (previousCompleted != task.isCompleted()) {
                List<StudyPlanSlot> slots = studyPlanSlotRepository.findByTaskId(taskId);
                for (StudyPlanSlot slot : slots) {
                    slot.setCompleted(task.isCompleted());
                }
                studyPlanSlotRepository.saveAll(slots);
            }
        }
        
        return studyTaskRepository.save(task);
    }

    @Transactional
    public StudyTask toggleTaskCompletion(Long taskId, Long userId) {
        StudyTask task = getTaskSecure(taskId, userId);
        task.setCompleted(!task.isCompleted());
        
        // Sync with plan slots
        List<StudyPlanSlot> slots = studyPlanSlotRepository.findByTaskId(taskId);
        for (StudyPlanSlot slot : slots) {
            slot.setCompleted(task.isCompleted());
        }
        studyPlanSlotRepository.saveAll(slots);
        
        return studyTaskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        StudyTask task = getTaskSecure(taskId, userId);
        List<StudyPlanSlot> slots = studyPlanSlotRepository.findByTaskId(taskId);
        for (StudyPlanSlot slot : slots) {
            slot.setTask(null);
        }
        studyPlanSlotRepository.saveAll(slots);
        studyTaskRepository.delete(task);
    }
}

