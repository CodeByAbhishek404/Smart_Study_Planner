/* Smart Study Planner - Tasks Checklist & Chart Progress Analytics */

let activeTasksList = [];
let availableSubjects = [];
let currentFilterTab = 'all';

let hoursChartInstance = null;
let weeklyChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch data initially
    loadTasksData();
    loadAnalyticsData();
    fetchSubjectsForDropdown();

    // 2. Redraw charts when theme changes
    window.addEventListener('theme-changed', loadAnalyticsData);
});

// Load tasks list from backend
async function loadTasksData() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    try {
        const tasks = await ApiClient.get('/tasks');
        activeTasksList = tasks;
        renderTasksBacklog();
    } catch (err) {
        container.innerHTML = `<p style="text-align: center; color: var(--danger); margin: 30px 0;">Error loading tasks: ${err.message}</p>`;
    }
}

// Fetch subjects to hold in cache for add-task selectors
async function fetchSubjectsForDropdown() {
    try {
        availableSubjects = await ApiClient.get('/subjects');
    } catch (err) {
        console.error('Failed to pre-fetch subjects list for tasks dropdown:', err);
    }
}

// Render tasks list matching current filter (all / pending / completed)
function renderTasksBacklog() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    let filtered = activeTasksList;
    if (currentFilterTab === 'pending') {
        filtered = activeTasksList.filter(t => !t.completed);
    } else if (currentFilterTab === 'completed') {
        filtered = activeTasksList.filter(t => t.completed);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin: 40px 0;">No tasks in this category.</p>
        `;
        return;
    }

    container.innerHTML = '';
    filtered.forEach(task => {
        const isCompleted = task.completed;
        const subjColor = task.subject ? task.subject.color : 'var(--primary)';
        const subjName = task.subject ? task.subject.name : 'Unknown';

        // Check if task is overdue
        let overdueClass = '';
        let dateBadgeHtml = '';
        if (task.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(task.dueDate);
            if (due < today && !isCompleted) {
                overdueClass = 'overdue';
            }
            const dateOptions = { day: 'numeric', month: 'short' };
            dateBadgeHtml = `
                <div class="task-badge date ${overdueClass}">
                    <i class="far fa-calendar-alt"></i>
                    <span>Due: ${due.toLocaleDateString('en-US', dateOptions)}${overdueClass ? ' (Overdue)' : ''}</span>
                </div>
            `;
        }

        const row = document.createElement('div');
        row.className = `task-item-row ${isCompleted ? 'completed' : ''}`;
        row.innerHTML = `
            <div class="task-main-details">
                <div class="task-checkbox" onclick="toggleTaskStatus(${task.id})" title="${isCompleted ? 'Mark incomplete' : 'Mark completed'}">
                    <i class="fas fa-check"></i>
                </div>
                <div class="task-title-group">
                    <span class="task-text">${task.title}</span>
                    <div class="task-tag-meta">
                        <span class="task-subject-badge" style="background-color: ${subjColor};">${subjName}</span>
                    </div>
                </div>
            </div>
            <div class="task-info-badges">
                <div class="task-badge">
                    <i class="far fa-clock"></i>
                    <span>Est: ${task.estimatedHours}h</span>
                </div>
                ${dateBadgeHtml}
                <div class="task-action-btns">
                    <button class="task-btn" onclick="openEditTaskModal(${task.id})" title="Edit Topic"><i class="fas fa-edit"></i></button>
                    <button class="task-btn delete" onclick="deleteTask(${task.id})" title="Delete Topic"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

// Set active tab and filter tasks list
function filterTasks(tab) {
    currentFilterTab = tab;
    document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`filter-${tab}`).classList.add('active');
    renderTasksBacklog();
}

// Toggle task completion check
async function toggleTaskStatus(taskId) {
    try {
        await ApiClient.put(`/tasks/${taskId}/complete`);
        loadTasksData();
        loadAnalyticsData(); // completion charts updates
    } catch (err) {
        alert('Failed to update task: ' + err.message);
    }
}

// Delete study task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to remove this topic?')) return;
    try {
        await ApiClient.delete(`/tasks/${id}`);
        loadTasksData();
        loadAnalyticsData();
    } catch (err) {
        alert('Failed to delete task: ' + err.message);
    }
}

// Open modal to add a new topic task
function openAddTaskModal() {
    if (availableSubjects.length === 0) {
        alert('Create a subject first before logging topics!');
        return;
    }

    let subjectOptions = '';
    availableSubjects.forEach(s => {
        subjectOptions += `<option value="${s.id}">${s.name}</option>`;
    });

    const html = `
        <form id="modal-task-form">
            <div class="input-group">
                <label class="input-label" for="task-subject">Link to Subject</label>
                <select id="task-subject" class="input-field" required>
                    ${subjectOptions}
                </select>
            </div>

            <div class="input-group">
                <label class="input-label" for="task-title">Topic Title</label>
                <input type="text" id="task-title" class="input-field" placeholder="e.g. Chapter 4 - Vectors Integration" required>
            </div>

            <div class="input-group">
                <label class="input-label" for="task-hours">Estimated Study Hours</label>
                <input type="number" id="task-hours" class="input-field" placeholder="e.g. 3.0" min="0.5" max="24" step="0.5" required>
            </div>

            <div class="input-group">
                <label class="input-label" for="task-duedate">Target Completion Date</label>
                <input type="date" id="task-duedate" class="input-field">
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Create Topic Task</button>
        </form>
    `;

    showAppModal('Add Topic Task', html);

    document.getElementById('modal-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = parseInt(document.getElementById('task-subject').value);
        const title = document.getElementById('task-title').value;
        const estimatedHours = parseFloat(document.getElementById('task-hours').value);
        
        let dueDate = document.getElementById('task-duedate').value;
        if (!dueDate) dueDate = null;

        try {
            await ApiClient.post('/tasks', { subjectId, title, estimatedHours, dueDate });
            closeAppModal();
            loadTasksData();
            loadAnalyticsData();
        } catch (err) {
            alert('Failed to add topic: ' + err.message);
        }
    });
}

// Open modal to edit a topic task
function openEditTaskModal(id) {
    const task = activeTasksList.find(t => t.id === id);
    if (!task) return;

    let subjectOptions = '';
    availableSubjects.forEach(s => {
        subjectOptions += `<option value="${s.id}" ${task.subject && task.subject.id === s.id ? 'selected' : ''}>${s.name}</option>`;
    });

    const formatDueDate = task.dueDate ? task.dueDate.substring(0, 10) : '';

    const html = `
        <form id="modal-edit-task-form">
            <div class="input-group">
                <label class="input-label" for="task-subject">Link to Subject</label>
                <select id="task-subject" class="input-field" required>
                    ${subjectOptions}
                </select>
            </div>

            <div class="input-group">
                <label class="input-label" for="task-title">Topic Title</label>
                <input type="text" id="task-title" class="input-field" value="${task.title}" required>
            </div>

            <div class="input-group">
                <label class="input-label" for="task-hours">Estimated Study Hours</label>
                <input type="number" id="task-hours" class="input-field" value="${task.estimatedHours}" min="0.5" max="24" step="0.5" required>
            </div>

            <div class="input-group">
                <label class="input-label" for="task-duedate">Target Completion Date</label>
                <input type="date" id="task-duedate" class="input-field" value="${formatDueDate}">
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Save Changes</button>
        </form>
    `;

    showAppModal('Edit Topic Details', html);

    document.getElementById('modal-edit-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = parseInt(document.getElementById('task-subject').value);
        const title = document.getElementById('task-title').value;
        const estimatedHours = parseFloat(document.getElementById('task-hours').value);
        
        let dueDate = document.getElementById('task-duedate').value;
        if (!dueDate) dueDate = null;

        try {
            await ApiClient.put(`/tasks/${id}`, { subjectId, title, estimatedHours, dueDate });
            closeAppModal();
            loadTasksData();
            loadAnalyticsData();
        } catch (err) {
            alert('Failed to update task: ' + err.message);
        }
    });
}

// Fetch Weekly Analytics and render progress charts (Pie & Bar)
async function loadAnalyticsData() {
    try {
        const analytics = await ApiClient.get('/planner/analytics');
        renderHoursPieChart(analytics.subjectProgressList || []);
        renderWeeklyCompletionsBarChart(analytics.dailyCompletionList || []);
    } catch (err) {
        console.error('Failed to load progress graphs data:', err);
    }
}

// Chart 1: Pie Chart for Hours Spent
function renderHoursPieChart(progressList) {
    const canvas = document.getElementById('hoursSpentChart');
    const overlay = document.getElementById('hours-chart-empty');
    if (!canvas) return;

    // Filter out subjects that have zero hours completed
    const activeProgress = progressList.filter(p => p.completedHours > 0);
    const totalHoursVal = activeProgress.reduce((sum, p) => sum + p.completedHours, 0);

    if (activeProgress.length === 0 || totalHoursVal === 0) {
        // Show empty overlay, hide canvas
        canvas.style.display = 'none';
        if (overlay) {
            overlay.style.display = 'flex';
            // Adjust overlay background color dynamically based on theme
            const isLight = document.body.classList.contains('light-theme');
            overlay.style.background = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.4)';
        }
        if (hoursChartInstance) {
            hoursChartInstance.destroy();
            hoursChartInstance = null;
        }
        return;
    }

    // Hide overlay, show canvas
    canvas.style.display = 'block';
    if (overlay) overlay.style.display = 'none';

    const labels = activeProgress.map(p => p.subjectName);
    const data = activeProgress.map(p => p.completedHours);
    const colors = activeProgress.map(p => p.color);

    if (hoursChartInstance) {
        hoursChartInstance.destroy();
    }

    hoursChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: document.body.classList.contains('light-theme') ? '#475569' : '#94a3b8',
                        font: { family: 'Outfit', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(9, 13, 22, 0.9)',
                    titleFont: { family: 'Outfit', weight: 'bold' },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw.toFixed(1)} h completed`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Chart 2: Stacked Bar Chart for Daily completions (Completed vs. Pending slots)
function renderWeeklyCompletionsBarChart(completions) {
    const canvas = document.getElementById('weeklyBarChart');
    const overlay = document.getElementById('weekly-chart-empty');
    if (!canvas) return;

    const totalScheduledSlots = completions.reduce((sum, c) => sum + c.totalSlots, 0);

    if (completions.length === 0 || totalScheduledSlots === 0) {
        // Show empty overlay, hide canvas
        canvas.style.display = 'none';
        if (overlay) {
            overlay.style.display = 'flex';
            const isLight = document.body.classList.contains('light-theme');
            overlay.style.background = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.4)';
        }
        if (weeklyChartInstance) {
            weeklyChartInstance.destroy();
            weeklyChartInstance = null;
        }
        return;
    }

    // Hide overlay, show canvas
    canvas.style.display = 'block';
    if (overlay) overlay.style.display = 'none';

    // Convert date string e.g. "2026-05-20" to abbreviation e.g. "Mon"
    const weekdayLabels = completions.map(c => {
        const d = new Date(c.date);
        const options = { weekday: 'short' };
        return d.toLocaleDateString('en-US', options);
    });

    const completedData = completions.map(c => c.completedSlots);
    const pendingData = completions.map(c => Math.max(0, c.totalSlots - c.completedSlots));

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    const isLight = document.body.classList.contains('light-theme');
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

    weeklyChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: weekdayLabels,
            datasets: [
                {
                    label: 'Completed Slots',
                    data: completedData,
                    backgroundColor: '#10b981', // Solid Success Green
                    borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
                    borderWidth: 0,
                    barThickness: 20
                },
                {
                    label: 'Pending Slots',
                    data: pendingData,
                    backgroundColor: isLight ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.25)', // Translucent Indigo
                    borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
                    borderWidth: 0,
                    barThickness: 20
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    stacked: true,
                    ticks: { color: textColor, stepSize: 1 },
                    grid: { color: gridColor }
                },
                x: {
                    stacked: true,
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: 'Outfit', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(9, 13, 22, 0.9)',
                    titleFont: { family: 'Outfit', weight: 'bold' },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const total = completions[index].totalSlots;
                            const completed = completions[index].completedSlots;
                            if (context.datasetIndex === 0) {
                                return ` Completed: ${completed} / ${total} slots`;
                            } else {
                                const pending = total - completed;
                                return ` Pending: ${pending} / ${total} slots`;
                            }
                        }
                    }
                }
            }
        }
    });
}

