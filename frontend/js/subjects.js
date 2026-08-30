/* Smart Study Planner - Subject & Exams Controller */

let activeSubjects = [];

function formatDuration(minutes) {
    if (!minutes) return '1h';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Load subjects and exams on page load
    loadSubjectsData();
    loadExamsData();
});

// Load and render academic courses
async function loadSubjectsData() {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    try {
        const subjects = await ApiClient.get('/subjects');
        activeSubjects = subjects; // cache list for exam additions

        if (!subjects || subjects.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="grid-column: span 2; text-align: center; padding: 40px 20px;">
                    <i class="fas fa-book-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                    <h3>No Subjects Added</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">You haven't listed any academic courses yet.</p>
                    <button onclick="openAddSubjectModal()" class="btn-primary">Add Your First Subject</button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'glass-card subject-item-card';
            card.style.setProperty('--subj-color', subject.color);
            
            // Format difficulty badge
            let difficultyBadge = '';
            if (subject.difficulty === 'EASY') difficultyBadge = '<span class="badge badge-easy">Easy</span>';
            else if (subject.difficulty === 'MEDIUM') difficultyBadge = '<span class="badge badge-medium">Medium</span>';
            else if (subject.difficulty === 'HARD') difficultyBadge = '<span class="badge badge-hard">Hard</span>';

            card.innerHTML = `
                <div class="subject-card-header">
                    <h3>${subject.name}</h3>
                    ${difficultyBadge}
                </div>
                <div class="subject-card-body">
                    <div class="subject-card-stat">
                        <i class="fas fa-palette"></i>
                        <span>Theme Color: <span style="font-weight: 700; color: ${subject.color};">${subject.color}</span></span>
                    </div>
                    <div class="subject-card-stat" style="margin-top: 8px;">
                        <i class="far fa-clock"></i>
                        <span>Session Block: <strong>${formatDuration(subject.studyDurationMinutes)}</strong></span>
                    </div>
                </div>
                <div class="subject-card-actions">
                    <button class="subject-action-btn" onclick="generateAITopics(${subject.id})" title="AI Auto-Generate Topics" style="background: linear-gradient(135deg, #a855f7, #6366f1); color: white; border: none; font-size: 1.1rem;"><i class="fas fa-magic"></i></button>
                    <button class="subject-action-btn" onclick="openEditSubjectModal(${subject.id})" title="Edit course"><i class="fas fa-edit"></i></button>
                    <button class="subject-action-btn delete" onclick="deleteSubject(${subject.id})" title="Delete course"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = `
            <div class="glass-card" style="grid-column: span 2; text-align: center; color: var(--danger);">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i>
                <p style="margin-top: 10px;">Error loading subjects: ${err.message}</p>
            </div>
        `;
    }
}

// Load and render upcoming exams
async function loadExamsData() {
    const container = document.getElementById('exams-container');
    if (!container) return;

    try {
        const exams = await ApiClient.get('/subjects/exams/upcoming');

        if (!exams || exams.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); margin: 30px 0;">No upcoming exams registered.</p>
            `;
            return;
        }

        container.innerHTML = '';
        exams.forEach(exam => {
            const dateObj = new Date(exam.examDate);
            const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = dateObj.toLocaleDateString('en-US', options);

            const item = document.createElement('div');
            item.className = 'exam-deadline-item';
            item.style.setProperty('--subj-color', exam.subject.color);
            item.innerHTML = `
                <div class="exam-info">
                    <h4>${exam.title}</h4>
                    <p style="font-weight: 600; color: ${exam.subject.color}; font-size: 0.8rem; margin: 2px 0;">${exam.subject.name}</p>
                    <p><i class="far fa-clock" style="margin-right: 4px;"></i> ${formattedDate}</p>
                </div>
                <button class="exam-delete-btn" onclick="deleteExam(${exam.id})" title="Remove deadline">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--danger); margin: 30px 0;">Error loading exams: ${err.message}</p>
        `;
    }
}

// Modal Color Selector Helper
let selectedColorHex = '#6366f1';
function selectColorOption(element, hex) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedColorHex = hex;
}

// Open modal for adding a new subject
function openAddSubjectModal() {
    selectedColorHex = '#6366f1'; // reset default
    const html = `
        <form id="modal-subject-form">
            <div class="input-group">
                <label class="input-label" for="subject-name">Subject Course Name</label>
                <input type="text" id="subject-name" class="input-field" placeholder="e.g. Mathematics II" required>
            </div>
            
            <div class="input-group">
                <label class="input-label" for="subject-difficulty">Difficulty Level</label>
                <select id="subject-difficulty" class="input-field" required>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM" selected>Medium</option>
                    <option value="HARD">Hard</option>
                </select>
            </div>

            <div class="input-group">
                <label class="input-label">Preferred Session Duration</label>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label class="input-label" for="subject-hours" style="font-size: 0.75rem; color: var(--text-secondary);">Hours</label>
                        <input type="number" id="subject-hours" class="input-field" min="0" max="12" value="1" required>
                    </div>
                    <div style="flex: 1;">
                        <label class="input-label" for="subject-minutes" style="font-size: 0.75rem; color: var(--text-secondary);">Minutes</label>
                        <input type="number" id="subject-minutes" class="input-field" min="0" max="59" value="0" required>
                    </div>
                </div>
            </div>

            <div class="input-group">
                <label class="input-label">Card Theme Color</label>
                <div class="color-picker-grid">
                    <div class="color-option selected" style="background-color: #6366f1;" onclick="selectColorOption(this, '#6366f1')"></div>
                    <div class="color-option" style="background-color: #10b981;" onclick="selectColorOption(this, '#10b981')"></div>
                    <div class="color-option" style="background-color: #f59e0b;" onclick="selectColorOption(this, '#f59e0b')"></div>
                    <div class="color-option" style="background-color: #f43f5e;" onclick="selectColorOption(this, '#f43f5e')"></div>
                    <div class="color-option" style="background-color: #06b6d4;" onclick="selectColorOption(this, '#06b6d4')"></div>
                    <div class="color-option" style="background-color: #d946ef;" onclick="selectColorOption(this, '#d946ef')"></div>
                </div>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Create Subject</button>
        </form>
    `;
    
    showAppModal('Add New Subject', html);

    document.getElementById('modal-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value;
        const difficulty = document.getElementById('subject-difficulty').value;
        
        const hours = parseInt(document.getElementById('subject-hours').value) || 0;
        const minutes = parseInt(document.getElementById('subject-minutes').value) || 0;
        const studyDurationMinutes = (hours * 60) + minutes;

        if (studyDurationMinutes < 10) {
            alert('Minimum study duration is 10 minutes.');
            return;
        }

        try {
            await ApiClient.post('/subjects', { name, difficulty, color: selectedColorHex, studyDurationMinutes });
            closeAppModal();
            loadSubjectsData();
        } catch (err) {
            alert('Failed to create subject: ' + err.message);
        }
    });
}

// Open modal for editing an existing subject
async function openEditSubjectModal(id) {
    const subject = activeSubjects.find(s => s.id === id);
    if (!subject) return;

    selectedColorHex = subject.color;
    
    const existingMinutesTotal = subject.studyDurationMinutes || 60;
    const existingHours = Math.floor(existingMinutesTotal / 60);
    const existingMinutes = existingMinutesTotal % 60;

    const html = `
        <form id="modal-edit-subject-form">
            <div class="input-group">
                <label class="input-label" for="subject-name">Subject Course Name</label>
                <input type="text" id="subject-name" class="input-field" value="${subject.name}" required>
            </div>
            
            <div class="input-group">
                <label class="input-label" for="subject-difficulty">Difficulty Level</label>
                <select id="subject-difficulty" class="input-field" required>
                    <option value="EASY" ${subject.difficulty === 'EASY' ? 'selected' : ''}>Easy</option>
                    <option value="MEDIUM" ${subject.difficulty === 'MEDIUM' ? 'selected' : ''}>Medium</option>
                    <option value="HARD" ${subject.difficulty === 'HARD' ? 'selected' : ''}>Hard</option>
                </select>
            </div>

            <div class="input-group">
                <label class="input-label">Preferred Session Duration</label>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label class="input-label" for="subject-hours" style="font-size: 0.75rem; color: var(--text-secondary);">Hours</label>
                        <input type="number" id="subject-hours" class="input-field" min="0" max="12" value="${existingHours}" required>
                    </div>
                    <div style="flex: 1;">
                        <label class="input-label" for="subject-minutes" style="font-size: 0.75rem; color: var(--text-secondary);">Minutes</label>
                        <input type="number" id="subject-minutes" class="input-field" min="0" max="59" value="${existingMinutes}" required>
                    </div>
                </div>
            </div>

            <div class="input-group">
                <label class="input-label">Card Theme Color</label>
                <div class="color-picker-grid">
                    <div class="color-option ${subject.color === '#6366f1' ? 'selected' : ''}" style="background-color: #6366f1;" onclick="selectColorOption(this, '#6366f1')"></div>
                    <div class="color-option ${subject.color === '#10b981' ? 'selected' : ''}" style="background-color: #10b981;" onclick="selectColorOption(this, '#10b981')"></div>
                    <div class="color-option ${subject.color === '#f59e0b' ? 'selected' : ''}" style="background-color: #f59e0b;" onclick="selectColorOption(this, '#f59e0b')"></div>
                    <div class="color-option ${subject.color === '#f43f5e' ? 'selected' : ''}" style="background-color: #f43f5e;" onclick="selectColorOption(this, '#f43f5e')"></div>
                    <div class="color-option ${subject.color === '#06b6d4' ? 'selected' : ''}" style="background-color: #06b6d4;" onclick="selectColorOption(this, '#06b6d4')"></div>
                    <div class="color-option ${subject.color === '#d946ef' ? 'selected' : ''}" style="background-color: #d946ef;" onclick="selectColorOption(this, '#d946ef')"></div>
                </div>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Save Changes</button>
        </form>
    `;

    showAppModal('Edit Subject', html);

    document.getElementById('modal-edit-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value;
        const difficulty = document.getElementById('subject-difficulty').value;
        
        const hours = parseInt(document.getElementById('subject-hours').value) || 0;
        const minutes = parseInt(document.getElementById('subject-minutes').value) || 0;
        const studyDurationMinutes = (hours * 60) + minutes;

        if (studyDurationMinutes < 10) {
            alert('Minimum study duration is 10 minutes.');
            return;
        }

        try {
            await ApiClient.put(`/subjects/${id}`, { name, difficulty, color: selectedColorHex, studyDurationMinutes });
            closeAppModal();
            loadSubjectsData();
            loadExamsData(); // Color references might have updated
        } catch (err) {
            alert('Failed to update subject: ' + err.message);
        }
    });
}

// Delete course handler
async function deleteSubject(id) {
    if (!confirm('Are you sure you want to delete this subject? This will delete all linked tasks, exams, and plan slots.')) return;
    
    try {
        await ApiClient.delete(`/subjects/${id}`);
        loadSubjectsData();
        loadExamsData();
    } catch (err) {
        alert('Failed to delete subject: ' + err.message);
    }
}

// Open modal to add an Exam deadline
function openAddExamModal() {
    if (activeSubjects.length === 0) {
        alert('Please create at least one subject first before registering an exam.');
        return;
    }

    let optionsHtml = '';
    activeSubjects.forEach(s => {
        optionsHtml += `<option value="${s.id}">${s.name}</option>`;
    });

    const html = `
        <form id="modal-exam-form">
            <div class="input-group">
                <label class="input-label" for="exam-subject">Select Subject</label>
                <select id="exam-subject" class="input-field" required>
                    ${optionsHtml}
                </select>
            </div>

            <div class="input-group">
                <label class="input-label" for="exam-name">Exam Title</label>
                <input type="text" id="exam-name" class="input-field" placeholder="e.g. Midterm Term exam" required>
            </div>

            <div class="input-group">
                <label class="input-label" for="exam-date">Exam Date & Time</label>
                <input type="datetime-local" id="exam-date" class="input-field" required>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Save Exam</button>
        </form>
    `;

    showAppModal('Add Exam Deadline', html);

    document.getElementById('modal-exam-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = parseInt(document.getElementById('exam-subject').value);
        const name = document.getElementById('exam-name').value;
        const examDate = document.getElementById('exam-date').value; // e.g. 2026-05-20T10:00

        try {
            await ApiClient.post('/subjects/exams', { subjectId, title: name, examDate });
            closeAppModal();
            loadExamsData();
        } catch (err) {
            alert('Failed to add exam: ' + err.message);
        }
    });
}

// Delete exam deadline handler
async function deleteExam(id) {
    if (!confirm('Are you sure you want to delete this exam deadline?')) return;

    try {
        await ApiClient.delete(`/subjects/exams/${id}`);
        loadExamsData();
    } catch (err) {
        alert('Failed to remove exam: ' + err.message);
    }
}

// Auto Generate Topics with AI
async function generateAITopics(id) {
    if (!confirm('Do you want the AI to analyze this subject and generate recommended study topics?')) return;
    
    try {
        // Show loading state
        const btn = event.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        await ApiClient.post(`/subjects/${id}/ai-generate-topics`);
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;

        alert('AI successfully generated topics! Check your Topic Backlog in Tasks & Progress.');
    } catch (err) {
        alert('AI Generation failed: ' + err.message);
        const btn = event.currentTarget;
        btn.innerHTML = '<i class="fas fa-magic"></i>';
        btn.disabled = false;
    }
}
