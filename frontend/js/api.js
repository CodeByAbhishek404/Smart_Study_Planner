/* Smart Study Planner - REST API Client Utility */
const API_BASE_URL = 'http://localhost:8080/api';

const ApiClient = {
    // Retrieve stored JWT token
    getToken() {
        return localStorage.getItem('jwt_token');
    },

    // Build headers object
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Handle generic response parse and error status
    async handleResponse(response) {
        if (!response.ok) {
            let errorMessage = 'Network error. Please try again.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // If response is not json
            }
            
            // Auto redirect to login on 401 Unauthorized
            if (response.status === 401) {
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_info');
                const path = window.location.pathname.toLowerCase();
                const isAuthPage = path.endsWith('login.html') || path.endsWith('register.html') || path.endsWith('index.html') ||
                                   path.endsWith('/login') || path.endsWith('/register') || path.endsWith('/index') ||
                                   path === '/' || path.endsWith('/');
                if (!isAuthPage) {
                    window.location.href = 'login.html';
                }
            }
            throw new Error(errorMessage);
        }
        
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    },

    // GET Request
    async get(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    // POST Request
    async post(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    // PUT Request
    async put(endpoint, data = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    // DELETE Request
    async delete(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
};
