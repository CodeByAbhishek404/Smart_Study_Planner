/* Smart Study Planner - Dashboard Controller */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Student Profile Name
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const studentNameElement = document.getElementById('student-name');
    if (studentNameElement) {
        studentNameElement.textContent = userInfo.firstName || userInfo.username || 'Student';
    }

    // 2. Load Dashboard Statistics & Today's Plan
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Fetch dashboard statistics summary
        const summary = await ApiClient.get('/planner/summary');
        updateStatsCounters(summary);
        updateProductivityScore(summary.productivityScore);

        // Fetch today's study plan
        const todayPlan = await ApiClient.get('/planner/daily');
        renderTodayPlan(todayPlan);
    } catch (err) {
        console.error('Error loading dashboard statistics:', err);
    }
}

// Bind stats values to cards
function updateStatsCounters(summary) {
    const subjectsCount = document.getElementById('stat-subjects');
    const tasksCount = document.getElementById('stat-tasks');
    const examsCount = document.getElementById('stat-exams');
    const hoursCount = document.getElementById('stat-hours');

    if (subjectsCount) subjectsCount.textContent = summary.totalSubjects;
    if (tasksCount) tasksCount.textContent = `${summary.completedTasks}/${summary.totalTasks}`;
    if (examsCount) examsCount.textContent = summary.upcomingExams;
    
    if (hoursCount) {
        // Format scheduled vs completed hours (rounded to 1 decimal)
        const scheduled = summary.studyHoursScheduled.toFixed(1);
        const completed = summary.studyHoursCompleted.toFixed(1);
        hoursCount.textContent = `${completed}/${scheduled}h`;
    }
}

// Drive Productivity Circle Animation
function updateProductivityScore(score) {
    const scoreVal = document.getElementById('prod-score-val');
    const circle = document.getElementById('prod-progress-circle');

    if (scoreVal) scoreVal.textContent = score;
    if (circle) {
        const radius = 80;
        const circumference = 2 * Math.PI * radius; // ~502.4
        const offset = circumference - (circumference * score) / 100;
        circle.style.strokeDashoffset = offset;
    }
}

// Bind today's timetable slots to UI
function renderTodayPlan(slots) {
    const timeline = document.getElementById('today-timeline');
    if (!timeline) return;

    if (!slots || slots.length === 0) {
        timeline.innerHTML = `
            <div class="empty-timeline">
                <i class="far fa-calendar-alt"></i>
                <h3>No Slots Scheduled Today</h3>
                <p>Enjoy your free time, or go to the planner to schedule sessions!</p>
                <a href="planner.html" class="btn-primary" style="display: inline-block; margin-top: 10px;">Generate Plan</a>
            </div>
        `;
        return;
    }

    timeline.innerHTML = '';
    
    slots.forEach(slot => {
        const isCompleted = slot.completed;
        const startTime = slot.startTime.substring(0, 5); // get HH:mm
        const endTime = slot.endTime.substring(0, 5);
        const subjectColor = slot.subject.color;
        const subjectName = slot.subject.name;
        const taskTitle = slot.task ? slot.task.title : slot.subject.name;
        const subLabel = slot.task ? slot.subject.name : 'Study / Review';

        const row = document.createElement('div');
        row.className = 'timeline-hour-row';
        row.innerHTML = `
            <div class="time-label">${formatTimeString(slot.startTime)}</div>
            <div class="slot-container">
                <div class="glass-card slot-card ${isCompleted ? 'completed' : ''}" style="border-left-color: ${subjectColor};">
                    <div class="slot-info-main">
                        <span class="slot-title">${taskTitle}</span>
                        <div class="slot-meta">
                            <span style="font-weight: 700; color: ${subjectColor};">
                                <i class="fas fa-circle" style="font-size: 0.6rem; margin-right: 4px;"></i>${subLabel}
                            </span>
                            <span><i class="far fa-clock"></i> ${startTime} - ${endTime}</span>
                        </div>
                    </div>
                    <div class="slot-actions">
                        <button class="slot-check-btn" onclick="toggleSlotStatus(${slot.id})" title="${isCompleted ? 'Mark incomplete' : 'Mark completed'}">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        timeline.appendChild(row);
    });
}

// Toggle study block completion
async function toggleSlotStatus(slotId) {
    try {
        await ApiClient.put(`/planner/slots/${slotId}/complete`);
        // Refresh values after toggle
        loadDashboardData();
    } catch (err) {
        alert('Failed to update slot completion: ' + err.message);
    }
}
