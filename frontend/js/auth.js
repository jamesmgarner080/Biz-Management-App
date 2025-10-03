// Authentication handling
const API_URL = window.location.origin + '/api';

// Toast notification system
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Login form handling
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Clear previous error
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
        
        // Disable submit button
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to main app
                window.location.href = '/';
            } else {
                errorMessage.textContent = data.error || 'Login failed';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Connection error. Please try again.';
            errorMessage.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    });
}

// Redirect to login if not authenticated (for protected pages)
if (window.location.pathname !== '/login.html' && !isAuthenticated()) {
    window.location.href = '/login.html';
}

// Redirect to main app if already authenticated (on login page)
if (window.location.pathname === '/login.html' && isAuthenticated()) {
    window.location.href = '/';
}

// API request helper with authentication
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
        
        // Handle unauthorized
        if (response.status === 401 || response.status === 403) {
            logout();
            return null;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}