/* Smart Study Planner - Client Authentication Guard & Forms */

// Check if user is authenticated (token exists)
function isAuthenticated() {
    return localStorage.getItem('jwt_token') !== null;
}

// Redirect locks based on authentication state
function guardAuthRoutes() {
    const path = window.location.pathname.toLowerCase();
    const isPublicPage = path.endsWith('index.html') || path.endsWith('login.html') || path.endsWith('register.html') || 
                         path.endsWith('/index') || path.endsWith('/login') || path.endsWith('/register') || 
                         path === '/' || path.endsWith('/');

    if (!isAuthenticated() && !isPublicPage) {
        // User not logged in, trying to access private page -> Redirect to login
        window.location.href = 'login.html';
    } else if (isAuthenticated() && (
        path.endsWith('login.html') || path.endsWith('register.html') || path.endsWith('index.html') ||
        path.endsWith('/login') || path.endsWith('/register') || path.endsWith('/index')
    )) {
        // User already logged in, trying to access auth pages -> Redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

// Perform Logout
function authLogout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    window.location.href = 'login.html';
}

// Bind Form listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
    guardAuthRoutes();

    // 1. Handle Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const alertBox = document.getElementById('auth-alert');
            const alertText = document.getElementById('auth-alert-text');

            // Clear previous errors
            FormValidator.clearError(usernameInput);
            FormValidator.clearError(passwordInput);
            if (alertBox) alertBox.style.display = 'none';

            let valid = true;
            if (FormValidator.isEmpty(usernameInput.value)) {
                FormValidator.showError(usernameInput, 'Username is required');
                valid = false;
            }
            if (FormValidator.isEmpty(passwordInput.value)) {
                FormValidator.showError(passwordInput, 'Password is required');
                valid = false;
            }

            if (!valid) return;

            const submitBtn = document.getElementById('login-submit-btn');
            const spinner = document.getElementById('login-spinner');
            const btnText = document.getElementById('login-btn-text');

            if (submitBtn) submitBtn.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            if (btnText) btnText.textContent = 'Connecting...';

            // Change text if it takes a while (Render free tier cold start)
            const slowServerTimeout = setTimeout(() => {
                if (btnText) btnText.textContent = 'Waking up server (takes ~50s)...';
            }, 3000);

            try {
                const response = await ApiClient.post('/auth/login', {
                    username: usernameInput.value,
                    password: passwordInput.value
                });

                clearTimeout(slowServerTimeout);

                // Persist JWT and basic profile values
                localStorage.setItem('jwt_token', response.accessToken);
                localStorage.setItem('user_info', JSON.stringify({
                    id: response.id,
                    username: response.username,
                    email: response.email,
                    firstName: response.firstName,
                    lastName: response.lastName,
                    dailyStudyHours: response.dailyStudyHours,
                    preferredStartTime: response.preferredStartTime
                }));

                window.location.href = 'dashboard.html';
            } catch (err) {
                clearTimeout(slowServerTimeout);
                if (submitBtn) submitBtn.disabled = false;
                if (spinner) spinner.style.display = 'none';
                if (btnText) btnText.textContent = 'Sign In';

                if (alertBox && alertText) {
                    const icon = alertBox.querySelector('i');
                    if (icon) icon.className = 'fas fa-exclamation-circle';
                    alertText.textContent = err.message || 'Login failed. Invalid username or password.';
                    alertBox.className = 'alert alert-danger';
                    alertBox.style.display = 'flex';
                }
            }
        });
    }

    // 1b. Password visibility toggler
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('password-eye-icon');

    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            eyeIcon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
        });
    }

    // 1c. Forgot Password Modal Toggles
    const forgotLink = document.getElementById('forgot-password-link');
    const forgotModal = document.getElementById('forgot-password-modal');
    const forgotModalCard = document.getElementById('forgot-modal-card');
    const closeForgotBtn = document.getElementById('close-forgot-modal');

    const closeForgotModal = () => {
        if (forgotModalCard) forgotModalCard.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (forgotModal) forgotModal.style.display = 'none';
            // Reset form and alerts
            const forgotForm = document.getElementById('forgot-form');
            if (forgotForm) forgotForm.reset();
            const forgotAlert = document.getElementById('forgot-alert');
            const forgotSuccess = document.getElementById('forgot-success');
            if (forgotAlert) forgotAlert.style.display = 'none';
            if (forgotSuccess) forgotSuccess.style.display = 'none';
        }, 200);
    };

    if (forgotLink && forgotModal && forgotModalCard) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.style.display = 'flex';
            setTimeout(() => {
                forgotModalCard.style.transform = 'scale(1)';
            }, 10);
        });

        if (closeForgotBtn) {
            closeForgotBtn.addEventListener('click', closeForgotModal);
        }

        // Close on clicking backdrop
        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                closeForgotModal();
            }
        });
    }

    // 1d. Toggler inside forgot password modal
    const toggleForgotPassBtn = document.getElementById('toggle-forgot-password');
    const forgotPassInput = document.getElementById('forgot-new-password');
    const forgotEyeIcon = document.getElementById('forgot-password-eye-icon');

    if (toggleForgotPassBtn && forgotPassInput && forgotEyeIcon) {
        toggleForgotPassBtn.addEventListener('click', () => {
            const isPassword = forgotPassInput.getAttribute('type') === 'password';
            forgotPassInput.setAttribute('type', isPassword ? 'text' : 'password');
            forgotEyeIcon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
        });
    }

    // 1e. Handle Forgot Password Submit
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('forgot-username');
            const emailInput = document.getElementById('forgot-email');
            const newPasswordInput = document.getElementById('forgot-new-password');
            
            const alertBox = document.getElementById('forgot-alert');
            const alertText = document.getElementById('forgot-alert-text');
            const successBox = document.getElementById('forgot-success');
            const successText = document.getElementById('forgot-success-text');
            const spinner = document.getElementById('forgot-spinner');

            if (alertBox) alertBox.style.display = 'none';
            if (successBox) successBox.style.display = 'none';

            let valid = true;
            if (FormValidator.isEmpty(usernameInput.value)) {
                FormValidator.showError(usernameInput, 'Username is required');
                valid = false;
            }
            if (FormValidator.isEmpty(emailInput.value)) {
                FormValidator.showError(emailInput, 'Email is required');
                valid = false;
            } else if (!FormValidator.isValidEmail(emailInput.value)) {
                FormValidator.showError(emailInput, 'Invalid email format');
                valid = false;
            }
            if (FormValidator.isEmpty(newPasswordInput.value)) {
                FormValidator.showError(newPasswordInput, 'New password is required');
                valid = false;
            } else if (!FormValidator.isValidPassword(newPasswordInput.value)) {
                FormValidator.showError(newPasswordInput, 'Password must be at least 6 characters');
                valid = false;
            }

            if (!valid) return;

            if (spinner) spinner.style.display = 'inline-block';

            try {
                const response = await ApiClient.post('/auth/forgot-password', {
                    username: usernameInput.value,
                    email: emailInput.value,
                    newPassword: newPasswordInput.value
                });

                if (spinner) spinner.style.display = 'none';
                if (successBox && successText) {
                    successText.textContent = response.message || 'Password reset successfully!';
                    successBox.style.display = 'flex';
                }

                // Hide modal after a brief delay
                setTimeout(() => {
                    closeForgotModal();
                }, 2000);

            } catch (err) {
                if (spinner) spinner.style.display = 'none';
                if (alertBox && alertText) {
                    alertText.textContent = err.message || 'Failed to reset password. Check your details.';
                    alertBox.style.display = 'flex';
                }
            }
        });
    }

    // 2. Handle Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            const alertBox = document.getElementById('auth-alert');
            const alertText = document.getElementById('auth-alert-text');

            // Clear errors
            FormValidator.clearError(firstNameInput);
            FormValidator.clearError(lastNameInput);
            FormValidator.clearError(usernameInput);
            FormValidator.clearError(emailInput);
            FormValidator.clearError(passwordInput);
            if (alertBox) alertBox.style.display = 'none';

            let valid = true;
            
            if (FormValidator.isEmpty(firstNameInput.value)) {
                FormValidator.showError(firstNameInput, 'First name is required');
                valid = false;
            }
            if (FormValidator.isEmpty(usernameInput.value)) {
                FormValidator.showError(usernameInput, 'Username is required');
                valid = false;
            } else if (!FormValidator.isValidUsername(usernameInput.value)) {
                FormValidator.showError(usernameInput, 'Username must be 3-20 alphanumeric characters');
                valid = false;
            }
            
            if (FormValidator.isEmpty(emailInput.value)) {
                FormValidator.showError(emailInput, 'Email is required');
                valid = false;
            } else if (!FormValidator.isValidEmail(emailInput.value)) {
                FormValidator.showError(emailInput, 'Invalid email format');
                valid = false;
            }

            if (FormValidator.isEmpty(passwordInput.value)) {
                FormValidator.showError(passwordInput, 'Password is required');
                valid = false;
            } else if (!FormValidator.isValidPassword(passwordInput.value)) {
                FormValidator.showError(passwordInput, 'Password must be at least 6 characters');
                valid = false;
            }

            if (!valid) return;
            
            const submitBtn = document.getElementById('register-submit-btn');
            const spinner = document.getElementById('register-spinner');
            const btnText = document.getElementById('register-btn-text');

            if (submitBtn) submitBtn.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            if (btnText) btnText.textContent = 'Connecting...';

            // Change text if it takes a while (Render free tier cold start)
            const slowServerTimeout = setTimeout(() => {
                if (btnText) btnText.textContent = 'Waking up server (takes ~50s)...';
            }, 3000);

            try {
                await ApiClient.post('/auth/register', {
                    username: usernameInput.value,
                    email: emailInput.value,
                    password: passwordInput.value,
                    firstName: firstNameInput.value,
                    lastName: lastNameInput.value
                });

                clearTimeout(slowServerTimeout);
                if (submitBtn) submitBtn.disabled = false;
                if (spinner) spinner.style.display = 'none';
                if (btnText) btnText.textContent = 'Sign Up';

                if (alertBox && alertText) {
                    const icon = alertBox.querySelector('i');
                    if (icon) icon.className = 'fas fa-check-circle';
                    alertText.textContent = 'Account created successfully! Redirecting to login...';
                    alertBox.className = 'alert alert-success';
                    alertBox.style.display = 'flex';
                }

                // Redirect after brief delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (err) {
                clearTimeout(slowServerTimeout);
                if (submitBtn) submitBtn.disabled = false;
                if (spinner) spinner.style.display = 'none';
                if (btnText) btnText.textContent = 'Sign Up';

                if (alertBox && alertText) {
                    const icon = alertBox.querySelector('i');
                    if (icon) icon.className = 'fas fa-exclamation-circle';
                    alertText.textContent = err.message || 'Registration failed. Try again.';
                    alertBox.className = 'alert alert-danger';
                    alertBox.style.display = 'flex';
                }
            }
        });
    }
});

