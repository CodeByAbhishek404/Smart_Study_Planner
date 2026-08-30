# 🎓 Smart Study Planner & Productivity Tracker

[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue?logo=mysql)](https://www.mysql.com/)
[![HTML/CSS/JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-blueviolet)](https://developer.mozilla.org/en-US/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://smart-study-planner-bkl2z6jlr-jhaabhishek445-gmailcoms-projects.vercel.app/)
[![Render](https://img.shields.io/badge/Backend-Render-purple?logo=render)](https://smart-study-planner-8ehw.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Smart Study Planner** is a modern, responsive, full-stack student productivity web application designed to help students optimize their study routines. It features a gorgeous **glassmorphic dark-theme design**, an advanced **Priority Scheduling Heuristic Algorithm**, built-in **Gamification**, and an integrated **Pomodoro Timer**.

Whether you're juggling multiple hard exams or just trying to build a consistent study streak, this app dynamically builds your daily timetable so you don't have to.

---

## 🚀 Live Demo

**Frontend (Vercel):** [https://smart-study-planner-bkl2z6jlr-jhaabhishek445-gmailcoms-projects.vercel.app](https://smart-study-planner-bkl2z6jlr-jhaabhishek445-gmailcoms-projects.vercel.app/)
*(Feel free to register a new account to test out the features!)*

**Database (Aiven Cloud):** Fully managed remote MySQL 8 database.
**Backend (Render):** Deployed via Docker with a multi-stage Maven/Java 17 build.

---

## ⚡ Features for Recruiters & Developers

This project was built to demonstrate proficiency in Full-Stack Development, System Design, and practical problem-solving.

*   **Advanced Scheduling Algorithm:** A customized Java heuristic engine calculates priority weights based on course difficulty, upcoming exam deadlines, and backlog tasks, then allocates daily study hours fairly across subjects.
*   **Timezone-Aware API:** The frontend and backend communicate utilizing local browser timestamps, ensuring that server locations (UTC) do not disrupt user schedules (e.g. IST).
*   **Stateless Authentication:** Secure JWT (JSON Web Token) Bearer authentication implemented via Spring Security filters and BCrypt password hashing.
*   **Gamification Engine:** Includes an XP bar, Leveling system, and Daily Study Streaks that increment automatically when study slots are completed.
*   **Integrated Pomodoro Timer:** A functional 25/5 focus timer built directly into the dashboard.
*   **Analytics & Backlog Sync:** Uses `Chart.js` for interactive progress pies and bars. Checking off a dashboard slot performs a bidirectional sync with the database, updating the related subtopic in the backlog instantly.
*   **AI Topic Generation (Mock):** Click the "Magic Wand" to automatically generate smart study sub-topics for any subject.
*   **iCal Calendar Export:** Click a button to download your dynamically generated schedule as an `.ics` file for Google Calendar or Apple Calendar.
*   **Fully Responsive UI:** Built without massive CSS frameworks—relying on pure Flexbox, CSS Grid, and custom CSS variables to achieve a scalable glassmorphic UI across mobile and desktop.

---

## 📸 Interface Showcase

### 1. Dynamic Dashboard & Interactive Timetable
The main hub tracks daily progress, displays your gamification level, controls the Pomodoro timer, and presents the scheduled hourly study blocks.
![Dashboard Overview](./screenshots/dashboard-priority.png)

### 2. Subject Portfolio & Exam Scheduler
A custom course grid with hex color labels, difficulty tags, and an upcoming exam schedule creator.
![Subject Portfolio](./screenshots/subject-portfolio.png)

### 3. Tasks Backlog & Analytics Progress
Visualize subject coverage and study hour breakdowns using interactive graphs. Completing slots automatically updates task backlogs.
![Analytics & Backlog Sync](./screenshots/progress-analytics.png)

### 4. Secure Portal with Password Reset
A beautiful, unified entry card featuring B-Crypted JWT credentials, an eye-toggle button, and a fully functional password reset popup.
![Login & Reset Modal](./screenshots/login-reset.png)

---

## 🛠️ Technology Stack

**Frontend Architecture:**
- **Core**: HTML5, Vanilla ES6 JavaScript, pure CSS3 (Custom Properties).
- **Libraries**: Chart.js (Data Visualization), FontAwesome (Icons), Canvas Particles (Background).
- **Deployment**: Vercel.

**Backend Architecture:**
- **Core**: Java 17, Spring Boot 3.2.x.
- **Security**: Spring Security, JWT (JSON Web Tokens), BCrypt.
- **Persistence**: Spring Data JPA, Hibernate ORM.
- **Deployment**: Render (Containerized via Docker).

**Database & Infrastructure:**
- **Engine**: MySQL 8.0 (Hosted on Aiven Cloud).
- **Design**: Relational schema with cascading updates and proper index mappings.

---

## 🔬 Core Heuristic Scheduling Algorithm

At the heart of the Smart Study Planner is a customized priority allocation engine implemented in `PlannerService.java`. For each subject $S$, the dynamic priority $P(S)$ is computed daily:

$$P(S) = (D(S) \times 2.5) + U(S) + W(S) - H(S)$$

1. **Difficulty Weight ($D(S)$)**: Scales subject baseline priority (HARD = 10, MEDIUM = 5, EASY = 2).
2. **Urgency Weight ($U(S)$)**: Exponentially increases priority as an exam date approaches.
3. **Workload Weight ($W(S)$)**: Integrates pending backlog count.
4. **Fair-Share Penalty ($H(S)$)**: Prevents starvation of lighter subjects by scaling a penalty proportionally to the hours already scheduled in the queue.

---

## 💻 Local Installation Guide

If you'd like to run the code locally instead of viewing the live demo:

### Prerequisites
- **Java 17 JDK** and **Maven**
- **Node.js** (for `npx serve`)
- **MySQL 8** (Running on port 3306)

### 1. Database Setup
1. Create a local schema: `CREATE DATABASE smart_study_planner;`
2. Import the database structure and sample mock data:
   ```bash
   mysql -u root -p smart_study_planner < database/schema.sql
   mysql -u root -p smart_study_planner < database/sample-data.sql
   ```

### 2. Spring Boot Backend
1. Open `backend/src/main/resources/application.properties`. By default, it looks for environment variables, but falls back to `localhost` and `root`/`password`. Modify if needed.
2. Navigate to the `backend/` directory.
3. Start the server:
   ```bash
   mvn spring-boot:run
   ```

### 3. Frontend Client
1. Navigate to the project root directory.
2. Start a local HTTP server on port 3000:
   ```bash
   npx serve -l 3000 frontend
   ```
3. Open `http://localhost:3000` in your browser. 

*(You can log in locally using `john_doe` / `password123` if you loaded the sample data).*

---

## 👨‍💻 Author & Contact

**Abhishek Jha**
- **GitHub**: [@CodeByAbhishek404](https://github.com/CodeByAbhishek404)
- **Role**: Full Stack Developer

*If you are a recruiter reviewing this repository, thank you for your time! Feel free to reach out to me directly or explore the source code to see my documentation, commit history, and system design patterns.*

---
*Licensed under the MIT License.*
