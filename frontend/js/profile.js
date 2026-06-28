/* Smart Study Planner - Profile & Preferences Settings Controller */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch current profile data
    loadUserProfile();

    // Initialize banner particle animation
    initBannerParticles();

    // 2. Form submit listeners
    const profileForm = document.getElementById('profile-details-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }

    const preferencesForm = document.getElementById('profile-preferences-form');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handleUpdateProfile);
    }

    const passwordForm = document.getElementById('profile-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleUpdatePassword);
    }
});

// Switch profile settings panel tabs
function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.style.display = 'block';
    }
    
    const eventTarget = window.event ? window.event.currentTarget : null;
    if (eventTarget) {
        eventTarget.classList.add('active');
    } else {
        const activeBtn = Array.from(document.querySelectorAll('.settings-nav-btn')).find(btn => {
            const onclickVal = btn.getAttribute('onclick') || '';
            return onclickVal.includes(tabName);
        });
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
}

// Update slider value text inline
function updateHoursSliderDisplay(value) {
    const valDisplay = document.getElementById('hours-val-display');
    if (valDisplay) {
        valDisplay.textContent = `${parseFloat(value).toFixed(1)} h`;
    }
}

// Fetch user profile and preferences details
async function loadUserProfile() {
    try {
        const profile = await ApiClient.get('/auth/profile');
        
        // Fill Left Info Card
        const fullname = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username;
        const avatarChar = (profile.firstName || profile.username).substring(0, 2).toUpperCase();

        document.getElementById('summary-fullname').textContent = fullname;
        document.getElementById('summary-username').textContent = `@${profile.username}`;
        document.getElementById('summary-email').textContent = profile.email;
        
        const avatar = document.getElementById('profile-avatar-char');
        if (avatar) avatar.textContent = avatarChar;

        // Fill Inputs Form
        document.getElementById('firstName').value = profile.firstName || '';
        document.getElementById('lastName').value = profile.lastName || '';
        document.getElementById('email').value = profile.email || '';
        
        const hoursSlider = document.getElementById('dailyStudyHours');
        if (hoursSlider) {
            hoursSlider.value = profile.dailyStudyHours;
            updateHoursSliderDisplay(profile.dailyStudyHours);
        }

        const startTimeInput = document.getElementById('preferredStartTime');
        if (startTimeInput) {
            // Trim standard HH:mm:ss to HH:mm for the HTML time picker
            startTimeInput.value = profile.preferredStartTime.substring(0, 5);
        }

    } catch (err) {
        showProfileAlert(err.message, 'danger');
    }
}

// Save profile details changes
async function handleUpdateProfile(e) {
    e.preventDefault();

    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const dailyStudyHours = parseFloat(document.getElementById('dailyStudyHours').value);
    const preferredStartTime = document.getElementById('preferredStartTime').value; // HH:mm format

    // Validate
    FormValidator.clearError(firstNameInput);
    FormValidator.clearError(lastNameInput);
    FormValidator.clearError(emailInput);

    let valid = true;
    if (FormValidator.isEmpty(firstNameInput.value)) {
        FormValidator.showError(firstNameInput, 'First name is required');
        valid = false;
    }
    if (FormValidator.isEmpty(emailInput.value)) {
        FormValidator.showError(emailInput, 'Email is required');
        valid = false;
    } else if (!FormValidator.isValidEmail(emailInput.value)) {
        FormValidator.showError(emailInput, 'Invalid email format');
        valid = false;
    }

    if (!valid) return;

    try {
        const updated = await ApiClient.put('/auth/profile', {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            email: emailInput.value,
            dailyStudyHours,
            preferredStartTime: `${preferredStartTime}:00` // Append seconds for LocalTime
        });

        // Update cached localStorage copy
        localStorage.setItem('user_info', JSON.stringify({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            dailyStudyHours: updated.dailyStudyHours,
            preferredStartTime: updated.preferredStartTime
        }));

        // Refresh DOM elements
        loadUserProfile();

        // Refresh sidebar branding values manually
        const sbName = document.getElementById('sidebar-username');
        const sbInitials = document.getElementById('user-avatar-initials');
        if (sbName) sbName.textContent = updated.username;
        if (sbInitials) sbInitials.textContent = (updated.firstName || updated.username).substring(0, 2).toUpperCase();

        showProfileAlert('Preferences saved successfully!', 'success');

    } catch (err) {
        showProfileAlert('Failed to update preferences: ' + err.message, 'danger');
    }
}

// Update password submission handler
async function handleUpdatePassword(e) {
    e.preventDefault();

    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');

    FormValidator.clearError(oldPasswordInput);
    FormValidator.clearError(newPasswordInput);

    let valid = true;
    if (FormValidator.isEmpty(oldPasswordInput.value)) {
        FormValidator.showError(oldPasswordInput, 'Current password is required');
        valid = false;
    }
    if (FormValidator.isEmpty(newPasswordInput.value)) {
        FormValidator.showError(newPasswordInput, 'New password is required');
        valid = false;
    } else if (!FormValidator.isValidPassword(newPasswordInput.value)) {
        FormValidator.showError(newPasswordInput, 'New password must be at least 6 characters');
        valid = false;
    }

    if (!valid) return;

    try {
        await ApiClient.put('/auth/password', {
            oldPassword: oldPasswordInput.value,
            newPassword: newPasswordInput.value
        });

        oldPasswordInput.value = '';
        newPasswordInput.value = '';
        showProfileAlert('Password updated successfully!', 'success');
    } catch (err) {
        showProfileAlert('Failed to change password: ' + err.message, 'danger');
    }
}

// Utility to show profile forms banners
function showProfileAlert(message, type) {
    const alertBox = document.getElementById('profile-alert');
    const alertText = document.getElementById('profile-alert-text');
    
    if (alertBox && alertText) {
        const icon = alertBox.querySelector('i');
        if (icon) {
            icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        }
        alertText.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'flex';
        
        // auto-hide alert after 4 seconds
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 4000);
    }
}

// Banner particle animation controller
function initBannerParticles() {
    const canvas = document.getElementById('profile-banner-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    let particles = [];
    const maxParticles = 20;

    function resize() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
    resize();
    
    // Resize observer to update dimensions automatically
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    class BannerParticle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.size = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
        }
        draw(color) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    for (let i = 0; i < maxParticles; i++) {
        particles.push(new BannerParticle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isLightTheme = document.body.classList.contains('light-theme');
        const color = isLightTheme ? 'rgba(99, 102, 241, 0.35)' : 'rgba(139, 92, 246, 0.45)';
        const lineColor = isLightTheme ? 'rgba(99, 102, 241, ' : 'rgba(139, 92, 246, ';

        particles.forEach(p => {
            p.update();
            p.draw(color);
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 90) {
                    const alpha = (1 - dist / 90) * 0.12;
                    ctx.strokeStyle = `${lineColor}${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}
