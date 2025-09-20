/**
 * Tab Management Module
 * Handles navigation between different sections of the application
 */

import { tabTemplates } from './tab-content.js';

class TabManager {
    constructor() {
        this.activeTab = 'dashboard';
        this.contentContainer = null;
        this.init();
    }

    init() {
        this.contentContainer = document.getElementById('app-content');
        this.bindEvents();
        this.showTab(this.activeTab);
    }

    bindEvents() {
        // Add event listeners to nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = this.getTabNameFromElement(e.target);
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });
    }

    getTabNameFromElement(element) {
        // First check for data-tab attribute
        if (element.dataset && element.dataset.tab) {
            return element.dataset.tab;
        }
        
        // Fallback to extracting from text content
        const text = element.textContent.toLowerCase();
        if (text.includes('dashboard')) return 'dashboard';
        if (text.includes('agents')) return 'agents';
        if (text.includes('pipeline')) return 'pipeline';
        if (text.includes('quality')) return 'quality';
        if (text.includes('projects')) return 'projects';
        if (text.includes('compliance')) return 'compliance';
        return 'dashboard'; // default fallback
    }

    showTab(tabName) {
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(nav => {
            nav.classList.remove('active');
        });
        
        // Load tab content
        if (this.contentContainer && tabTemplates[tabName]) {
            this.contentContainer.innerHTML = tabTemplates[tabName];
        }
        
        // Add active class to corresponding nav tab
        const navTab = this.findNavTabByName(tabName);
        if (navTab) {
            navTab.classList.add('active');
        }

        this.activeTab = tabName;
        
        // Trigger post-render events for specific tabs
        this.onTabRendered(tabName);
    }

    findNavTabByName(tabName) {
        return Array.from(document.querySelectorAll('.nav-tab')).find(tab => {
            return this.getTabNameFromElement(tab) === tabName;
        });
    }

    onTabRendered(tabName) {
        // Trigger specific initialization for tabs that need it
        if (tabName === 'dashboard') {
            // DORA metrics and SPACE framework are already in the template
            // Trigger any needed re-initialization of components
            if (window.macquarieApp && window.macquarieApp.modules.doraMetrics) {
                window.macquarieApp.modules.doraMetrics.init();
            }
            if (window.macquarieApp && window.macquarieApp.modules.spaceFramework) {
                window.macquarieApp.modules.spaceFramework.init();
            }
        }
    }
}

// Make showTab function globally available for backwards compatibility
window.showTab = function(tabName) {
    if (window.tabManager) {
        window.tabManager.showTab(tabName);
    }
};

export default TabManager;