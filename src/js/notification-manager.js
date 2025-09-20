/**
 * Notification System Module
 * Handles displaying notifications and alerts to users
 */

class NotificationManager {
    constructor() {
        this.notificationElement = null;
        this.init();
    }

    init() {
        this.createNotificationElement();
    }

    createNotificationElement() {
        // Check if notification element already exists
        this.notificationElement = document.getElementById('notification');
        
        if (!this.notificationElement) {
            // Create notification element if it doesn't exist
            this.notificationElement = document.createElement('div');
            this.notificationElement.id = 'notification';
            this.notificationElement.className = 'notification';
            document.body.appendChild(this.notificationElement);
        }
    }

    show(message, type = 'success', duration = 4000) {
        if (!this.notificationElement) {
            this.createNotificationElement();
        }

        this.notificationElement.textContent = message;
        this.notificationElement.className = `notification ${type} show`;
        
        // Auto-hide after specified duration
        setTimeout(() => {
            this.hide();
        }, duration);
    }

    hide() {
        if (this.notificationElement) {
            this.notificationElement.classList.remove('show');
        }
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
}

// Make showNotification function globally available for backwards compatibility
window.showNotification = function(message, type) {
    if (window.notificationManager) {
        window.notificationManager.show(message, type);
    }
};

export default NotificationManager;