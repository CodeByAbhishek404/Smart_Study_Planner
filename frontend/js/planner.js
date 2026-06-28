/* Smart Study Planner - Planner & Schedule Controller */

let currentSelectedDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Pre-fill generator date defaults (Start = today, End = today + 7 days)
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput && endDateInput) {
        const todayStr = formatDateToYYYYMMDD(new Date());
        startDateInput.value = todayStr;
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        endDateInput.value = formatDateToYYYYMMDD(nextWeek);
    }

    // 2. Fetch study timetable slots for the current selected date
    loadDailyTimetable();

    // 3. Handle Schedule Generation Form Submit
    const generatorForm = document.getElementById('schedule-generator-form');
    if (generatorForm) {
        generatorForm.addEventListener('submit', handleGenerateSchedule);
    }
});

// Format Date object to YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format Date object to human readable header (e.g. "Wednesday, 20 May")
function formatHumanReadableDate(date) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dateStr = formatDateToYYYYMMDD(date);
    
    if (dateStr === formatDateToYYYYMMDD(today)) return 'Today';
    if (dateStr === formatDateToYYYYMMDD(tomorrow)) return 'Tomorrow';
    if (dateStr === formatDateToYYYYMMDD(yesterday)) return 'Yesterday';

    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Adjust Selected Date in Timetable view
function adjustPlanDate(days) {
    currentSelectedDate.setDate(currentSelectedDate.getDate() + days);
    
    const dateDisplay = document.getElementById('current-plan-date-display');
    if (dateDisplay) {
        dateDisplay.textContent = formatHumanReadableDate(currentSelectedDate);
    }
    
    loadDailyTimetable();
}

// Load daily study schedule slots
async function loadDailyTimetable() {
    const timeline = document.getElementById('planner-timeline');
    if (!timeline) return;

    try {
        const dateStr = formatDateToYYYYMMDD(currentSelectedDate);
        const slots = await ApiClient.get(`/planner/daily?date=${dateStr}`);

        if (!slots || slots.length === 0) {
            timeline.innerHTML = `
                <div class="empty-timeline">
                    <i class="far fa-calendar-alt"></i>
                    <h3>No study slots scheduled for this date</h3>
                    <p>Use the generator panel above to schedule study blocks.</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = '';
        slots.forEach(slot => {
            const isCompleted = slot.completed;
            const startTime = slot.startTime.substring(0, 5);
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
                            <button class="slot-check-btn" onclick="toggleTimetableSlot(${slot.id})" title="${isCompleted ? 'Mark incomplete' : 'Mark completed'}">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            timeline.appendChild(row);
        });
    } catch (err) {
        timeline.innerHTML = `
            <div class="empty-timeline" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Schedule</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

// Toggle study slot completion
async function toggleTimetableSlot(slotId) {
    try {
        await ApiClient.put(`/planner/slots/${slotId}/complete`);
        loadDailyTimetable();
    } catch (err) {
        alert('Failed to update slot status: ' + err.message);
    }
}

// Trigger Smart Planner Algorithm API Call
async function handleGenerateSchedule(e) {
    e.preventDefault();

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const dailyStudyHoursInput = document.getElementById('dailyStudyHours').value;
    const distributeEqually = document.getElementById('distributeEqually') ? document.getElementById('distributeEqually').checked : false;
    
    const spinner = document.getElementById('gen-spinner');
    const alertBox = document.getElementById('generator-alert');

    // Reset spinner & alerts
    if (spinner) spinner.style.display = 'inline-block';
    if (alertBox) alertBox.style.display = 'none';

    const payload = { startDate, endDate, distributeEqually };
    if (dailyStudyHoursInput) {
        payload.dailyStudyHours = parseFloat(dailyStudyHoursInput);
    }

    try {
        await ApiClient.post('/planner/generate', payload);

        if (spinner) spinner.style.display = 'none';
        
        if (alertBox) {
            const icon = alertBox.querySelector('i');
            if (icon) icon.className = 'fas fa-check-circle';
            alertBox.querySelector('span').textContent = 'Study schedule generated successfully!';
            alertBox.className = 'alert alert-success';
            alertBox.style.display = 'flex';
            
            // Auto hide alert after 4 seconds
            setTimeout(() => {
                alertBox.style.display = 'none';
            }, 4000);
        }

        // Refresh timetable display
        loadDailyTimetable();

    } catch (err) {
        if (spinner) spinner.style.display = 'none';
        
        if (alertBox) {
            const icon = alertBox.querySelector('i');
            if (icon) icon.className = 'fas fa-exclamation-circle';
            alertBox.querySelector('span').textContent = err.message || 'Generation failed. Try again.';
            alertBox.className = 'alert alert-danger';
            alertBox.style.display = 'flex';
        }
    }
}
