/* Smart Study Planner - Form Inputs Validation Library */

const FormValidator = {
    // Check if input is empty
    isEmpty(value) {
        return !value || value.trim() === '';
    },

    // Validate email format
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validate password (min 6 characters)
    isValidPassword(password) {
        return password && password.length >= 6;
    },

    // Validate username (min 3 characters, alphanumeric)
    isValidUsername(username) {
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        return regex.test(username);
    },

    // Show form validation error inline
    showError(inputElement, message) {
        const group = inputElement.closest('.input-group');
        let errorSpan = group.querySelector('.error-message');
        
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-message';
            errorSpan.style.color = 'var(--danger)';
            errorSpan.style.fontSize = '0.8rem';
            errorSpan.style.marginTop = '4px';
            errorSpan.style.display = 'block';
            group.appendChild(errorSpan);
        }
        
        errorSpan.textContent = message;
        inputElement.style.borderColor = 'var(--danger)';
    },

    // Clear validation error inline
    clearError(inputElement) {
        const group = inputElement.closest('.input-group');
        const errorSpan = group.querySelector('.error-message');
        if (errorSpan) {
            group.removeChild(errorSpan);
        }
        inputElement.style.borderColor = 'var(--glass-border)';
    }
};
