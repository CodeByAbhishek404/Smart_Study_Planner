/* Smart Study Planner - Client UI Helpers & Loaders */

// Inject shared components (sidebar, navbar, footer, modal) into placeholders
async function loadSharedComponents() {
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    const modalPlaceholder = document.getElementById('modal-placeholder');

    if (sidebarPlaceholder) {
        try {
            const res = await fetch('components/sidebar.html');
            sidebarPlaceholder.innerHTML = await res.text();
            
            // Set user profile initial and username in sidebar
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            const username = userInfo.username || 'Student';
            const initialsElement = document.getElementById('user-avatar-initials');
            const usernameElement = document.getElementById('sidebar-username');
            
            if (usernameElement) usernameElement.textContent = username;
            if (initialsElement) initialsElement.textContent = username.substring(0, 2).toUpperCase();

            // Set active navigation tab
            setActiveNavLink();
        } catch (err) {
            console.error('Error loading sidebar component:', err);
        }
    }

    if (navbarPlaceholder) {
        try {
            const res = await fetch('components/navbar.html');
            navbarPlaceholder.innerHTML = await res.text();
            
            // Set dynamic title based on nav-link
            const activeLink = document.querySelector('.nav-link.active');
            if (activeLink) {
                const pageTitle = activeLink.querySelector('span').textContent;
                document.getElementById('navbar-page-title').textContent = pageTitle;
            }
            
            // Format current date in navbar
            const dateSpan = document.getElementById('current-nav-date');
            if (dateSpan) {
                const options = { weekday: 'long', day: 'numeric', month: 'short' };
                dateSpan.textContent = new Date().toLocaleDateString('en-US', options);
            }
            
            // Initialize Live Notifications
            initializeNotifications();

            // Programmatically bind events for navbar elements
            const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
            if (sidebarToggleBtn) {
                sidebarToggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleSidebarMenu();
                });
            }

            const themeToggleBtn = document.getElementById('theme-toggle-btn');
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTheme();
                });
            }

            const notifBellBtn = document.getElementById('notif-bell-btn');
            if (notifBellBtn) {
                notifBellBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleNotificationsDropdown(e);
                });
            }

            const clearNotifBtn = document.getElementById('clear-notif-btn');
            if (clearNotifBtn) {
                clearNotifBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    clearNotifications(e);
                });
            }
        } catch (err) {
            console.error('Error loading navbar component:', err);
        }
    }

    if (footerPlaceholder) {
        try {
            const res = await fetch('components/footer.html');
            footerPlaceholder.innerHTML = await res.text();
        } catch (err) {
            console.error('Error loading footer component:', err);
        }
    }

    if (modalPlaceholder) {
        try {
            const res = await fetch('components/modal.html');
            modalPlaceholder.innerHTML = await res.text();
        } catch (err) {
            console.error('Error loading modal component:', err);
        }
    }
}

// Highlight the active page in the sidebar navigation
function setActiveNavLink() {
    const path = window.location.pathname.toLowerCase();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => link.classList.remove('active'));

    if (path.endsWith('dashboard.html') || path.endsWith('/dashboard')) {
        document.getElementById('nav-dashboard')?.classList.add('active');
    } else if (path.endsWith('planner.html') || path.endsWith('/planner')) {
        document.getElementById('nav-planner')?.classList.add('active');
    } else if (path.endsWith('subjects.html') || path.endsWith('/subjects')) {
        document.getElementById('nav-subjects')?.classList.add('active');
    } else if (path.endsWith('progress.html') || path.endsWith('/progress')) {
        document.getElementById('nav-progress')?.classList.add('active');
    } else if (path.endsWith('profile.html') || path.endsWith('/profile')) {
        document.getElementById('nav-profile')?.classList.add('active');
    }
}

// Mobile sidebar drawer toggling
function toggleSidebarMenu() {
    document.body.classList.toggle('sidebar-active');
}

// Global modal operations
function showAppModal(title, bodyHtml) {
    const overlay = document.getElementById('app-modal-overlay');
    const titleElement = document.getElementById('app-modal-title');
    const bodyElement = document.getElementById('app-modal-body');
    
    if (overlay && titleElement && bodyElement) {
        titleElement.textContent = title;
        bodyElement.innerHTML = bodyHtml;
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent scroll behind
    }
}

function closeAppModal() {
    const overlay = document.getElementById('app-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Live Notifications Engine
async function initializeNotifications() {
    const list = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    let notifications = [];

    // Attempt to gather live info from API
    try {
        if (localStorage.getItem('jwt_token') && typeof ApiClient !== 'undefined') {
            const [subjects, tasks] = await Promise.all([
                ApiClient.get('/subjects'),
                ApiClient.get('/tasks')
            ]);

            // 1. Check for upcoming exams (within next 7 days)
            subjects.forEach(s => {
                if (s.exams && s.exams.length > 0) {
                    s.exams.forEach(e => {
                        const daysLeft = Math.ceil((new Date(e.examDate) - new Date()) / (1000 * 60 * 60 * 24));
                        if (daysLeft >= 0 && daysLeft <= 7) {
                            notifications.push({
                                type: 'warning',
                                title: 'Upcoming Exam',
                                text: `${s.name}: ${e.title} is in ${daysLeft} days!`,
                                time: 'Exam Alert'
                            });
                        }
                    });
                }
            });

            // 2. Check for pending tasks
            const pendingTasks = tasks.filter(t => !t.completed);
            if (pendingTasks.length > 0) {
                notifications.push({
                    type: 'info',
                    title: 'Pending Tasks',
                    text: `You have ${pendingTasks.length} topics pending in your backlog.`,
                    time: 'Task Tracker'
                });
            }
        }
    } catch (err) {
        console.warn('Failed to load live notifications:', err);
    }

    // Default system fallback notifications if empty
    if (notifications.length === 0) {
        notifications.push({
            type: 'success',
            title: 'Welcome to StudyPlanner',
            text: 'Create your subjects and generate your study timetables to start!',
            time: 'System Info'
        });
        notifications.push({
            type: 'info',
            title: 'Pro Tip',
            text: 'Add exam deadlines to automatically prioritize urgent topics.',
            time: 'Efficiency Tip'
        });
    }

    // Render list
    list.innerHTML = '';
    notifications.forEach(n => {
        let iconClass = 'fa-info-circle';
        let iconColor = 'var(--info)';
        if (n.type === 'warning') { iconClass = 'fa-exclamation-triangle'; iconColor = 'var(--warning)'; }
        if (n.type === 'success') { iconClass = 'fa-check-circle'; iconColor = 'var(--success)'; }

        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.gap = '12px';
        item.style.padding = '10px';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.border = '1px solid var(--glass-border)';
        item.style.borderRadius = 'var(--radius-sm)';
        item.innerHTML = `
            <div style="color: ${iconColor}; font-size: 1.1rem; padding-top: 2px;">
                <i class="fas ${iconClass}"></i>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                <h5 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${n.title}</h5>
                <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">${n.text}</p>
                <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">${n.time}</span>
            </div>
        `;
        list.appendChild(item);
    });

    if (badge) {
        badge.style.display = notifications.length > 0 ? 'block' : 'none';
    }
}

// Toggle notifications dropdown
function toggleNotificationsDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) {
        const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
        dropdown.style.display = isHidden ? 'flex' : 'none';
    }
}

// Clear all notifications on button click
function clearNotifications(event) {
    if (event) event.stopPropagation();
    const list = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    if (list) {
        list.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 25px 0; font-size: 0.85rem;">
                <i class="far fa-bell-slash" style="font-size: 1.5rem; margin-bottom: 8px; display: block; color: var(--text-muted);"></i>
                No notifications
            </div>
        `;
    }
    if (badge) {
        badge.style.display = 'none';
    }
}

// Close notifications dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const wrapper = document.getElementById('notif-dropdown-wrapper');
    if (dropdown && wrapper && !wrapper.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});


// Formats HH:mm string to local 12h or simple readable text
function formatTimeString(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
}

// Run component loader automatically on domestic pages load
document.addEventListener('DOMContentLoaded', () => {
    // Only load layouts on dashboard and other inner pages
    if (document.getElementById('sidebar-placeholder')) {
        loadSharedComponents();
    }
});
