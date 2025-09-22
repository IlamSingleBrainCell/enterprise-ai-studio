/**
 * Authentication Module for Enterprise AI Studio
 * Handles login, registration, and user session management
 */

class AuthManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
        this.user = null;
        this.isAuthenticated = false;
        
        this.init();
    }

    init() {
        // Check if user is already authenticated
        if (this.token) {
            this.validateToken();
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI based on auth state
        this.updateAuthUI();
    }

    setupEventListeners() {
        // Listen for auth modal triggers
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-auth="login"]')) {
                e.preventDefault();
                this.showLoginModal();
            }
            if (e.target.matches('[data-auth="register"]')) {
                e.preventDefault();
                this.showRegisterModal();
            }
            if (e.target.matches('[data-auth="logout"]')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    async validateToken() {
        try {
            const response = await fetch(`${this.apiBase}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.isAuthenticated = true;
            } else {
                this.clearAuth();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.clearAuth();
        }
    }

    showLoginModal() {
        const modal = this.createAuthModal('login');
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    showRegisterModal() {
        const modal = this.createAuthModal('register');
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    createAuthModal(type) {
        const isLogin = type === 'login';
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-container">
                <button class="auth-close" onclick="closeAuthModal()">&times;</button>
                
                <div class="auth-header">
                    <h2 class="auth-title">${isLogin ? '🔐 Welcome Back' : '🚀 Join Enterprise AI Studio'}</h2>
                    <p class="auth-subtitle">${isLogin ? 'Sign in to access your AI agents' : 'Create your account and start building'}</p>
                </div>

                <div class="auth-success-message" id="auth-success"></div>

                <form class="auth-form" id="auth-form">
                    ${!isLogin ? `
                        <div class="auth-form-group">
                            <label class="auth-label" for="firstName">First Name</label>
                            <input 
                                type="text" 
                                id="firstName" 
                                name="firstName" 
                                class="auth-input" 
                                placeholder="Enter your first name"
                                required
                            >
                            <div class="auth-error-message" id="firstName-error"></div>
                        </div>

                        <div class="auth-form-group">
                            <label class="auth-label" for="lastName">Last Name</label>
                            <input 
                                type="text" 
                                id="lastName" 
                                name="lastName" 
                                class="auth-input" 
                                placeholder="Enter your last name"
                                required
                            >
                            <div class="auth-error-message" id="lastName-error"></div>
                        </div>

                        <div class="auth-form-group">
                            <label class="auth-label" for="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                class="auth-input" 
                                placeholder="Choose a unique username"
                                required
                                minlength="3"
                            >
                            <div class="auth-error-message" id="username-error"></div>
                        </div>
                    ` : ''}

                    <div class="auth-form-group">
                        <label class="auth-label" for="email">Email Address</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            class="auth-input" 
                            placeholder="Enter your email address"
                            required
                        >
                        <div class="auth-error-message" id="email-error"></div>
                    </div>

                    <div class="auth-form-group">
                        <label class="auth-label" for="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            class="auth-input" 
                            placeholder="${isLogin ? 'Enter your password' : 'Create a strong password'}"
                            required
                            ${!isLogin ? 'minlength="6"' : ''}
                        >
                        <div class="auth-error-message" id="password-error"></div>
                        ${!isLogin ? `
                            <div class="password-strength" id="password-strength">
                                <div class="password-strength-bar">
                                    <div class="password-strength-fill"></div>
                                </div>
                                <div class="password-strength-text">Password strength: <span id="strength-text">Weak</span></div>
                            </div>
                        ` : ''}
                    </div>

                    ${!isLogin ? `
                        <div class="auth-form-group">
                            <label class="auth-label" for="confirmPassword">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                class="auth-input" 
                                placeholder="Confirm your password"
                                required
                            >
                            <div class="auth-error-message" id="confirmPassword-error"></div>
                        </div>
                    ` : ''}

                    <button type="submit" class="auth-submit" id="auth-submit">
                        ${isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div class="auth-divider">
                    <span>or</span>
                </div>

                <div class="auth-switch">
                    <span class="auth-switch-text">
                        ${isLogin ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                    <a href="#" class="auth-switch-link" onclick="switchAuthMode('${isLogin ? 'register' : 'login'}')">
                        ${isLogin ? 'Sign Up' : 'Sign In'}
                    </a>
                </div>

                ${!isLogin ? `
                    <div class="auth-features">
                        <div class="auth-features-title">What you'll get:</div>
                        <ul class="auth-features-list">
                            <li>AI Agent Orchestration</li>
                            <li>Team Workspaces</li>
                            <li>Educational Courses</li>
                            <li>Analytics Dashboard</li>
                            <li>Project Management</li>
                            <li>API Access</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        // Set up form handling
        setTimeout(() => {
            this.setupFormHandling(modal, type);
        }, 100);

        return modal;
    }

    setupFormHandling(modal, type) {
        const form = modal.querySelector('#auth-form');
        const submitBtn = modal.querySelector('#auth-submit');
        
        // Password strength checking for registration
        if (type === 'register') {
            const passwordInput = modal.querySelector('#password');
            const strengthContainer = modal.querySelector('#password-strength');
            const strengthFill = modal.querySelector('.password-strength-fill');
            const strengthText = modal.querySelector('#strength-text');

            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = this.calculatePasswordStrength(password);
                
                if (password.length > 0) {
                    strengthContainer.classList.add('show');
                    strengthContainer.className = `password-strength show password-strength-${strength.level}`;
                    strengthText.textContent = strength.text;
                } else {
                    strengthContainer.classList.remove('show');
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (submitBtn.disabled) return;
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validate form
            if (!this.validateForm(data, type)) {
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('auth-loading');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '';
            
            try {
                const result = type === 'login' 
                    ? await this.login(data.email, data.password)
                    : await this.register(data);
                
                if (result.success) {
                    this.showSuccessMessage(result.message);
                    setTimeout(() => {
                        this.closeAuthModal();
                        this.updateAuthUI();
                    }, 1500);
                } else {
                    this.showFormErrors(result.errors || [{ msg: result.message }]);
                }
            } catch (error) {
                this.showFormErrors([{ msg: 'Network error. Please try again.' }]);
            } finally {
                submitBtn.disabled = false;
                submitBtn.classList.remove('auth-loading');
                submitBtn.textContent = originalText;
            }
        });
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score < 2) return { level: 'weak', text: 'Weak' };
        if (score < 4) return { level: 'medium', text: 'Medium' };
        return { level: 'strong', text: 'Strong' };
    }

    validateForm(data, type) {
        let isValid = true;
        
        // Clear previous errors
        document.querySelectorAll('.auth-error-message').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
        document.querySelectorAll('.auth-input').forEach(el => {
            el.classList.remove('invalid', 'valid');
        });

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (data.password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (type === 'register') {
            // Username validation
            if (data.username.length < 3) {
                this.showFieldError('username', 'Username must be at least 3 characters');
                isValid = false;
            }

            // Name validation
            if (!data.firstName.trim()) {
                this.showFieldError('firstName', 'First name is required');
                isValid = false;
            }
            if (!data.lastName.trim()) {
                this.showFieldError('lastName', 'Last name is required');
                isValid = false;
            }

            // Confirm password
            if (data.password !== data.confirmPassword) {
                this.showFieldError('confirmPassword', 'Passwords do not match');
                isValid = false;
            }
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorEl = document.getElementById(`${fieldName}-error`);
        
        if (field) field.classList.add('invalid');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    showFormErrors(errors) {
        errors.forEach(error => {
            if (error.param) {
                this.showFieldError(error.param, error.msg);
            } else {
                // Show general error
                this.showSuccessMessage(error.msg, 'error');
            }
        });
    }

    showSuccessMessage(message, type = 'success') {
        const successEl = document.getElementById('auth-success');
        if (successEl) {
            successEl.textContent = message;
            successEl.className = `auth-success-message show ${type === 'error' ? 'error' : ''}`;
            successEl.style.background = type === 'error' 
                ? 'rgba(244, 67, 54, 0.2)' 
                : 'rgba(76, 175, 80, 0.2)';
            successEl.style.borderColor = type === 'error' ? '#f44336' : '#4CAF50';
            successEl.style.color = type === 'error' ? '#f44336' : '#4CAF50';
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuth(data.token, data.user);
                return { success: true, message: 'Welcome back! Redirecting to dashboard...' };
            } else {
                return { success: false, message: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuth(data.token, data.user);
                return { success: true, message: 'Account created successfully! Welcome to Enterprise AI Studio!' };
            } else {
                return { 
                    success: false, 
                    message: data.error || 'Registration failed',
                    errors: data.errors 
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.apiBase}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.clearAuth();
        this.updateAuthUI();
        this.showMessage('Logged out successfully', 'success');
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('nav-login');
        const userMenu = document.getElementById('user-menu');
        
        if (this.isAuthenticated && this.user) {
            // Hide login button
            if (loginBtn) loginBtn.style.display = 'none';
            
            // Show user menu
            if (userMenu) {
                userMenu.style.display = 'inline-block';
                userMenu.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="color: #4CAF50; font-weight: 600;">
                            ${this.user.firstName} ${this.user.lastName}
                        </div>
                        <button data-auth="logout" style="background: #f44336; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9em;">
                            Logout
                        </button>
                    </div>
                `;
            }
            
            // Update any welcome messages
            this.showMessage(`Welcome back, ${this.user.firstName}!`, 'success');
            
        } else {
            // Show login button
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
                loginBtn.innerHTML = `
                    <button data-auth="login" style="background: #4CAF50; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                        Login
                    </button>
                    <button data-auth="register" style="background: transparent; border: 2px solid #4CAF50; color: #4CAF50; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Sign Up
                    </button>
                `;
            }
            
            // Hide user menu
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    closeAuthModal() {
        const modal = document.querySelector('.auth-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    showMessage(message, type = 'info') {
        // Use existing notification system if available
        if (typeof window.showMessage === 'function') {
            window.showMessage(message, type);
        } else if (typeof window.addAIMessage === 'function') {
            window.addAIMessage('assistant', message, null);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Global functions for modal interactions
window.closeAuthModal = function() {
    window.authManager.closeAuthModal();
};

window.switchAuthMode = function(mode) {
    window.closeAuthModal();
    setTimeout(() => {
        if (mode === 'login') {
            window.authManager.showLoginModal();
        } else {
            window.authManager.showRegisterModal();
        }
    }, 100);
};

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

export default AuthManager;