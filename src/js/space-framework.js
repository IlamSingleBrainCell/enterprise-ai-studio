/**
 * SPACE Framework Module
 * Handles SPACE framework guidance toggle functionality
 */

class SpaceFramework {
    constructor() {
        this.init();
    }

    init() {
        this.bindToggleButton();
    }

    bindToggleButton() {
        const toggleButton = document.getElementById('space-guide-btn');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleDetails();
            });
        }
    }

    toggleDetails() {
        const detailsElement = document.getElementById('space-details');
        const toggleButton = document.getElementById('space-guide-btn');
        
        if (!detailsElement || !toggleButton) return;

        if (detailsElement.classList.contains('hidden')) {
            detailsElement.classList.remove('hidden');
            toggleButton.textContent = 'Hide implementation guidance';
        } else {
            detailsElement.classList.add('hidden');
            toggleButton.textContent = 'Show implementation guidance';
        }
    }
}

// Make toggleSpaceDetails function globally available for backwards compatibility
window.toggleSpaceDetails = function() {
    if (window.spaceFramework) {
        window.spaceFramework.toggleDetails();
    }
};

export default SpaceFramework;