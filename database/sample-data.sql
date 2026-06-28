-- Mock Sample Data for Smart Study Planner
USE `smart_study_planner`;

-- Clear existing data
DELETE FROM `study_plan_slots`;
DELETE FROM `study_tasks`;
DELETE FROM `exams`;
DELETE FROM `subjects`;
DELETE FROM `user_preferences`;
DELETE FROM `users`;

-- 1. Insert Test User
-- Username: john_doe, Email: john@study.com, Password: password123 (hashed with BCrypt)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `created_at`)
VALUES (1, 'john_doe', 'john@study.com', '$2a$10$kAczF69IX8HJ5fQWURQmEe/S8HM4GwPifrhbcOeMJ5cHH8/RKFV0a', 'John', 'Doe', NOW());


-- 2. Insert User Preferences
INSERT INTO `user_preferences` (`id`, `user_id`, `daily_study_hours`, `preferred_start_time`)
VALUES (1, 1, 4.5, '09:00:00');

-- 3. Insert Subjects
-- Difficulty levels: EASY, MEDIUM, HARD
-- Hex colors are modern Tailwind tints
INSERT INTO `subjects` (`id`, `user_id`, `name`, `difficulty`, `color`, `created_at`) VALUES
(1, 1, 'Mathematics', 'HARD', '#ef4444', NOW()),
(2, 1, 'Computer Science', 'HARD', '#3b82f6', NOW()),
(3, 1, 'Physics', 'MEDIUM', '#eab308', NOW()),
(4, 1, 'History', 'EASY', '#10b981', NOW());

-- 4. Insert Exams
-- Set dates dynamically relative to current date (for demo utility)
INSERT INTO `exams` (`id`, `subject_id`, `title`, `exam_date`, `created_at`) VALUES
(1, 1, 'Calculus III Final Exam', DATE_ADD(CURDATE(), INTERVAL 7 DAY), NOW()),
(2, 3, 'Physics Mechanics Midterm', DATE_ADD(CURDATE(), INTERVAL 14 DAY), NOW()),
(3, 2, 'Algorithm Design Project Due', DATE_ADD(CURDATE(), INTERVAL 5 DAY), NOW());

-- 5. Insert Study Tasks (Topics to cover)
INSERT INTO `study_tasks` (`id`, `subject_id`, `title`, `estimated_hours`, `completed`, `due_date`, `created_at`) VALUES
-- Mathematics Tasks
(1, 1, 'Review Double Integrals & Stokes Theorem', 2.5, 0, DATE_ADD(CURDATE(), INTERVAL 4 DAY), NOW()),
(2, 1, 'Practice Calculus Past Exam Papers', 4.0, 1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), NOW()),
(3, 1, 'Solve Matrix Linear Algebra Sets', 1.5, 0, DATE_ADD(CURDATE(), INTERVAL 5 DAY), NOW()),
-- CS Tasks
(4, 2, 'Design SQL Query Optimizer Lab', 3.0, 0, DATE_ADD(CURDATE(), INTERVAL 3 DAY), NOW()),
(5, 2, 'Code Spring Boot Controller Endpoints', 2.0, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), NOW()),
(6, 2, 'Study Dynamic Programming Algorithms', 4.0, 0, DATE_ADD(CURDATE(), INTERVAL 5 DAY), NOW()),
-- Physics Tasks
(7, 3, 'Read Chapters 4-5 on Electromagnetism', 3.0, 0, DATE_ADD(CURDATE(), INTERVAL 10 DAY), NOW()),
(8, 3, 'Draft Lab Report on Optics & Diffraction', 2.0, 0, DATE_ADD(CURDATE(), INTERVAL 12 DAY), NOW()),
-- History Tasks
(9, 4, 'Summarize French Revolution Notes', 2.0, 1, DATE_ADD(CURDATE(), INTERVAL 8 DAY), NOW()),
(10, 4, 'Read World War I Chronology Chapter', 1.5, 0, DATE_ADD(CURDATE(), INTERVAL 15 DAY), NOW());

-- 6. Insert Mock Study Plan Slots (Pre-generated schedule for today)
INSERT INTO `study_plan_slots` (`id`, `user_id`, `subject_id`, `task_id`, `plan_date`, `start_time`, `end_time`, `duration_minutes`, `completed`, `created_at`) VALUES
(1, 1, 1, 1, CURDATE(), '09:00:00', '09:50:00', 50, 1, NOW()),
(2, 1, 1, 1, CURDATE(), '10:00:00', '10:50:00', 50, 0, NOW()),
(3, 1, 2, 4, CURDATE(), '11:00:00', '11:50:00', 50, 0, NOW()),
(4, 1, 2, 4, CURDATE(), '12:00:00', '12:50:00', 50, 0, NOW()),
(5, 1, 3, 7, CURDATE(), '14:00:00', '14:50:00', 50, 0, NOW());
