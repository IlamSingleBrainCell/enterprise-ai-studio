/**
 * Enhanced Main Application Controller
 * Handles tab navigation, AI chat interface, and application state management
 */

import AIChatInterface from './ai-chat-interface.js';

class App {
    constructor() {
        this.currentTab = 'dashboard';
        this.aiChatInterface = null;
        this.initialized = false;
        
        // Application state
        this.modules = {
            aiChat: null,
            dashboard: null,
            monitoring: null
        };
        
        // Legacy support
        this.tabs = null;
        this.intervalIds = [];
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Setup tab navigation (legacy + new)
            this.setupTabNavigation();
            this.initializeTabManagerLegacy();
            
            // Initialize modules on demand
            this.initializeModules();
            
            // Set initial tab
            this.switchTab('dashboard');
            
            this.initialized = true;
            this.updateStatus('Application initialized successfully');
            this.showNotification('Macquarie CGM Post Trade Platform loaded successfully!', 'success');
            
        } catch (error) {
            this.handleError('Failed to initialize application', error);
        }
    }

    /**
     * Setup enhanced tab navigation
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn, .nav-tab');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                let tabId = button.getAttribute('data-tab');
                
                // Legacy tab mapping
                if (!tabId) {
                    const tabText = button.textContent.toLowerCase();
                    if (tabText.includes('dashboard')) tabId = 'dashboard';
                    else if (tabText.includes('agents')) tabId = 'ai-workflow';
                    else if (tabText.includes('pipeline')) tabId = 'monitoring';
                    else if (tabText.includes('quality')) tabId = 'quality';
                    else if (tabText.includes('projects')) tabId = 'projects';
                    else if (tabText.includes('compliance')) tabId = 'compliance';
                }
                
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                const tabs = ['dashboard', 'monitoring', 'ai-workflow', 'settings'];
                if (tabs[tabIndex]) {
                    this.switchTab(tabs[tabIndex]);
                }
            }
        });
    }

    /**
     * Legacy tab manager for backward compatibility
     */
    initializeTabManagerLegacy() {
        this.tabs = document.querySelectorAll('.nav-tab');
        
        // Make legacy functions globally available
        window.showTab = (tabName) => this.switchTab(tabName);
        window.initializeAIAgents = () => this.initializeAIWorkflow();
        window.showNotification = (message, type) => this.showNotification(message, type);
    }

    /**
     * Enhanced tab switching with module initialization
     */
    async switchTab(tabId) {
        try {
            // Legacy tab mapping
            const tabMappings = {
                'agents': 'ai-workflow',
                'pipeline': 'monitoring',
                'quality': 'quality',
                'projects': 'projects',
                'compliance': 'compliance'
            };
            
            const actualTabId = tabMappings[tabId] || tabId;

            // Update tab buttons (both legacy and new)
            document.querySelectorAll('.tab-btn, .nav-tab').forEach(btn => {
                btn.classList.remove('active');
                const btnTabId = btn.getAttribute('data-tab') || this.getTabIdFromText(btn.textContent);
                if (btnTabId === actualTabId || (btnTabId === tabId && actualTabId === 'ai-workflow')) {
                    btn.classList.add('active');
                }
            });

            // Update tab contents (legacy support)
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });

            // Show active tab content
            const activeTabContent = document.getElementById(`${actualTabId}-tab`) || document.getElementById(`${tabId}-tab`);
            if (activeTabContent) {
                activeTabContent.style.display = 'block';
                activeTabContent.classList.add('active');
            } else {
                // Fallback to dashboard
                const dashboardTab = document.getElementById('dashboard-tab');
                if (dashboardTab) {
                    dashboardTab.style.display = 'block';
                    dashboardTab.classList.add('active');
                }
            }

            this.currentTab = actualTabId;

            // Initialize tab-specific functionality
            await this.initializeTab(actualTabId);
            
            this.updateStatus(`Switched to ${actualTabId} tab`);
            
        } catch (error) {
            this.handleError(`Failed to switch to ${tabId} tab`, error);
        }
    }

    /**
     * Get tab ID from button text (legacy support)
     */
    getTabIdFromText(text) {
        const tabText = text.toLowerCase();
        if (tabText.includes('dashboard')) return 'dashboard';
        if (tabText.includes('agents')) return 'ai-workflow';
        if (tabText.includes('pipeline')) return 'monitoring';
        if (tabText.includes('quality')) return 'quality';
        if (tabText.includes('projects')) return 'projects';
        if (tabText.includes('compliance')) return 'compliance';
        return 'dashboard';
    }

    /**
     * Initialize tab-specific functionality
     */
    async initializeTab(tabId) {
        switch (tabId) {
            case 'ai-workflow':
                await this.initializeAIWorkflow();
                break;
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'monitoring':
                this.initializeMonitoring();
                break;
            case 'quality':
            case 'projects':
            case 'compliance':
                this.initializeGenericTab(tabId);
                break;
        }
    }

    /**
     * Initialize AI Workflow tab with enhanced chat interface
     */
    async initializeAIWorkflow() {
        if (!this.modules.aiChat) {
            try {
                // Create AI Chat Interface
                this.modules.aiChat = new AIChatInterface();
                
                // Initialize the chat interface
                const initialized = await this.modules.aiChat.initialize();
                
                if (initialized) {
                    this.updateStatus('AI Chat Interface ready');
                    this.attachAIWorkflowEventListeners();
                    this.setupLegacyAISupport();
                    
                    // Mark as initialized for legacy support
                    window.aiAgentInitialized = true;
                    this.showNotification('AI Agents initialized successfully!', 'success');
                } else {
                    throw new Error('Failed to initialize AI Chat Interface');
                }
                
            } catch (error) {
                this.handleError('Failed to initialize AI Workflow', error);
                this.showAIWorkflowFallback();
                this.setupLegacyAIFallback();
            }
        } else {
            // Already initialized, just update UI
            this.updateStatus('AI Chat Interface active');
        }
    }

    /**
     * Setup legacy AI workflow support
     */
    setupLegacyAISupport() {
        // Support for legacy workflow button
        const startButton = document.getElementById('start-workflow-btn');
        const taskInput = document.getElementById('task-input');
        
        if (startButton && !startButton.hasAttribute('data-enhanced-listener')) {
            startButton.setAttribute('data-enhanced-listener', 'true');
            startButton.addEventListener('click', () => this.handleLegacyWorkflowStart());
            
            if (taskInput) {
                taskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        this.handleLegacyWorkflowStart();
                    }
                });
            }
        }
    }

    /**
     * Handle legacy workflow start
     */
    async handleLegacyWorkflowStart() {
        const taskInput = document.getElementById('task-input');
        if (!taskInput || !taskInput.value.trim()) {
            this.updateStatus('Please enter a task description', 'warning');
            return;
        }

        const taskDescription = taskInput.value.trim();
        
        if (this.modules.aiChat) {
            // Use the enhanced AI chat interface
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = `Please analyze and implement: ${taskDescription}`;
                await this.modules.aiChat.sendMessage();
            }
        } else {
            // Fallback to legacy simulation
            await this.simulateAIWorkflowLegacy(taskDescription);
        }
    }

    /**
     * Setup legacy AI fallback
     */
    setupLegacyAIFallback() {
        const startButton = document.getElementById('start-workflow-btn');
        const taskInput = document.getElementById('task-input');
        
        if (startButton && !startButton.hasAttribute('data-fallback-listener')) {
            startButton.setAttribute('data-fallback-listener', 'true');
            startButton.addEventListener('click', () => this.handleFallbackWorkflow());
            
            if (taskInput) {
                taskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        this.handleFallbackWorkflow();
                    }
                });
            }
        }
    }

    /**
     * Handle fallback workflow
     */
    async handleFallbackWorkflow() {
        const taskInput = document.getElementById('task-input');
        const startButton = document.getElementById('start-workflow-btn');
        
        if (!taskInput || !taskInput.value.trim()) {
            this.updateStatus('Please enter a task description', 'warning');
            return;
        }
        
        const taskDescription = taskInput.value.trim();
        startButton.disabled = true;
        startButton.textContent = 'Processing...';
        
        try {
            this.updateStatus('Starting AI workflow...', 'info');
            await this.simulateAIWorkflowLegacy(taskDescription);
            this.updateStatus('Workflow completed successfully!', 'success');
        } catch (error) {
            this.updateStatus('Workflow failed: ' + error.message, 'error');
        } finally {
            startButton.disabled = false;
            startButton.textContent = 'Start Workflow';
        }
    }

    /**
     * Simulate legacy AI workflow
     */
    async simulateAIWorkflowLegacy(description) {
        const agents = [
            { name: 'Requirements', id: 'req', duration: 2000 },
            { name: 'Design', id: 'design', duration: 3000 },
            { name: 'Build', id: 'build', duration: 2500 },
            { name: 'RCM', id: 'rcm', duration: 1500 }
        ];
        
        for (const agent of agents) {
            this.updateAgentStatus(agent.id, 'processing', `Processing: ${description}`);
            this.updateStatus(`${agent.name} agent is processing...`, 'info');
            
            await this.delay(agent.duration);
            
            this.updateAgentStatus(agent.id, 'completed', 'Processing completed successfully');
            this.updateStatus(`${agent.name} agent completed`, 'success');
            this.showAgentResults(agent.id, `${agent.name} analysis completed for: ${description}`);
        }
        
        this.showWorkflowResults(description);
    }

    /**
     * Attach event listeners for AI Workflow
     */
    attachAIWorkflowEventListeners() {
        // Workflow trigger buttons
        const workflowButtons = document.querySelectorAll('.workflow-trigger');
        workflowButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const workflowType = button.getAttribute('data-workflow');
                this.triggerAIWorkflow(workflowType);
            });
        });

        // Quick actions
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.preventDefault();
                const actionType = action.getAttribute('data-action');
                this.handleQuickAction(actionType);
            });
        });
    }

    /**
     * Trigger AI workflow
     */
    async triggerAIWorkflow(workflowType) {
        if (!this.modules.aiChat) {
            this.handleError('AI Chat Interface not initialized');
            return;
        }

        try {
            const workflowPrompts = {
                'requirements': 'I need help analyzing business requirements for a new financial system. Can you guide me through the process?',
                'design': 'I need to design a system architecture for a financial application. What should I consider?',
                'build': 'I need help with implementation planning and code generation. Can you assist?',
                'compliance': 'I need to analyze regulatory compliance requirements. Can you help me understand what needs to be checked?'
            };

            const prompt = workflowPrompts[workflowType];
            if (prompt) {
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    chatInput.value = prompt;
                    await this.modules.aiChat.sendMessage();
                }
            }

        } catch (error) {
            this.handleError(`Failed to trigger ${workflowType} workflow`, error);
        }
    }

    /**
     * Handle quick actions
     */
    handleQuickAction(actionType) {
        switch (actionType) {
            case 'new-session':
                if (this.modules.aiChat) {
                    this.modules.aiChat.createNewSession();
                }
                break;
            case 'export-chat':
                this.exportChatHistory();
                break;
            case 'clear-history':
                this.clearChatHistory();
                break;
            default:
                this.updateStatus(`Quick action: ${actionType}`);
        }
    }

    /**
     * Show AI Workflow fallback UI
     */
    showAIWorkflowFallback() {
        const aiWorkflowTab = document.getElementById('ai-workflow-tab') || document.getElementById('agents-tab');
        if (aiWorkflowTab) {
            const fallbackHTML = `
                <div class="fallback-ui" style="padding: 20px; text-align: center;">
                    <div class="alert alert-warning" style="background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <i class="fas fa-exclamation-triangle" style="color: #ffc107; font-size: 24px; margin-bottom: 10px;"></i>
                        <h3 style="color: #ffc107; margin-bottom: 10px;">AI Chat Interface Unavailable</h3>
                        <p style="color: #cccccc; margin-bottom: 15px;">The enhanced AI chat interface could not be initialized. Using fallback mode.</p>
                        <button class="btn btn-primary" onclick="location.reload()" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-refresh"></i> Reload Page
                        </button>
                    </div>
                </div>
            `;
            
            // If there's existing content, prepend the fallback notice
            if (aiWorkflowTab.innerHTML.trim()) {
                aiWorkflowTab.innerHTML = fallbackHTML + aiWorkflowTab.innerHTML;
            } else {
                aiWorkflowTab.innerHTML = fallbackHTML;
            }
        }
    }

    /**
     * Initialize Dashboard tab
     */
    initializeDashboard() {
        this.updateDashboardData();
        this.startDashboardRefresh();
    }

    /**
     * Initialize Monitoring tab
     */
    initializeMonitoring() {
        this.updateMonitoringData();
        this.startMonitoringRefresh();
    }

    /**
     * Initialize generic tab
     */
    initializeGenericTab(tabId) {
        this.updateStatus(`${tabId} tab loaded`);
    }

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Modules will be initialized on-demand when tabs are accessed
        this.updateStatus('Modules ready for initialization');
    }

    /**
     * Update dashboard data (legacy support)
     */
    updateDashboardData() {
        const metrics = document.querySelectorAll('.metric-value');
        metrics.forEach(metric => {
            const currentValue = parseInt(metric.textContent.replace(/[^\d]/g, ''));
            const change = Math.floor(Math.random() * 10) - 5;
            const newValue = Math.max(0, currentValue + change);
            metric.textContent = newValue.toLocaleString();
        });
        this.updateCharts();
    }

    /**
     * Update monitoring data (legacy support)
     */
    updateMonitoringData() {
        const statusIndicators = document.querySelectorAll('.status-indicator');
        statusIndicators.forEach(indicator => {
            const statuses = ['online', 'warning', 'offline'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            indicator.className = `status-indicator ${randomStatus}`;
        });
    }

    /**
     * Update charts (placeholder)
     */
    updateCharts() {
        // Placeholder for chart updates
    }

    /**
     * Start dashboard refresh interval
     */
    startDashboardRefresh() {
        if (this.dashboardInterval) {
            clearInterval(this.dashboardInterval);
        }
        
        this.dashboardInterval = setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.updateDashboardData();
            }
        }, 30000);
        
        this.intervalIds.push(this.dashboardInterval);
    }

    /**
     * Start monitoring refresh interval
     */
    startMonitoringRefresh() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.monitoringInterval = setInterval(() => {
            if (this.currentTab === 'monitoring') {
                this.updateMonitoringData();
            }
        }, 10000);
        
        this.intervalIds.push(this.monitoringInterval);
    }

    /**
     * Legacy support methods
     */
    updateAgentStatus(agentId, status, message) {
        const statusElement = document.getElementById(`${agentId}-status`);
        const detailedStatusElement = document.getElementById(`${agentId}-detailed-status`);
        const currentTaskElement = document.getElementById(`${agentId}-current-task`);
        const lastUpdateElement = document.getElementById(`${agentId}-last-update`);
        
        const statusColors = {
            'processing': '#2196F3',
            'completed': '#4CAF50',
            'failed': '#F44336',
            'idle': '#FF9800'
        };
        
        const statusTexts = {
            'processing': 'Processing',
            'completed': 'Completed',
            'failed': 'Failed',
            'idle': 'Ready'
        };
        
        if (statusElement) {
            statusElement.textContent = statusTexts[status] || status;
            statusElement.style.color = statusColors[status] || '#FF9800';
        }
        
        if (detailedStatusElement) {
            detailedStatusElement.textContent = statusTexts[status] || status;
            detailedStatusElement.style.color = statusColors[status] || '#FF9800';
        }
        
        if (currentTaskElement) {
            currentTaskElement.textContent = message;
        }
        
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }
    }

    showAgentResults(agentId, result) {
        const resultsElement = document.getElementById(`${agentId}-results`);
        if (resultsElement) {
            const resultText = resultsElement.querySelector('div:last-child');
            if (resultText) {
                resultText.textContent = result;
            }
            resultsElement.style.display = 'block';
        }
    }

    showWorkflowResults(description) {
        const resultsSection = document.getElementById('workflow-results');
        const summaryDiv = document.getElementById('workflow-summary');
        
        if (resultsSection && summaryDiv) {
            summaryDiv.innerHTML = `
                <h4 style="color: #4CAF50; margin-bottom: 15px;">Task Completed: ${description}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">📋 Requirements Analysis</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">Successfully analyzed business requirements and identified key components needed for implementation.</p>
                    </div>
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">🎨 System Design</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">Generated comprehensive system architecture with microservices design and API specifications.</p>
                    </div>
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">🔧 Build Plan</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">Created detailed implementation plan with technology stack recommendations and development phases.</p>
                    </div>
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">🛡️ Compliance Review</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">Completed regulatory compliance analysis ensuring MiFID II, EMIR, SOX, and GDPR requirements are met.</p>
                    </div>
                </div>
            `;
            resultsSection.style.display = 'block';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Export chat history
     */
    async exportChatHistory() {
        if (!this.modules.aiChat) return;

        try {
            const status = this.modules.aiChat.getStatus();
            if (status.currentSession) {
                this.updateStatus('Chat history export feature coming soon');
            } else {
                this.updateStatus('No active chat session to export');
            }
        } catch (error) {
            this.handleError('Failed to export chat history', error);
        }
    }

    /**
     * Clear chat history
     */
    async clearChatHistory() {
        if (!this.modules.aiChat) return;

        const confirmed = confirm('Are you sure you want to clear the chat history? This action cannot be undone.');
        if (confirmed) {
            try {
                await this.modules.aiChat.createNewSession();
                this.updateStatus('Chat history cleared');
            } catch (error) {
                this.handleError('Failed to clear chat history', error);
            }
        }
    }

    /**
     * Update status display
     */
    updateStatus(message, type = 'info') {
        // Update modern status element
        const statusElement = document.querySelector('.app-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        // Update legacy status element
        const legacyStatusElement = document.getElementById('workflow-status');
        if (legacyStatusElement) {
            legacyStatusElement.innerHTML = `<div class="workflow-status ${type}">${message}</div>`;
        }
        
        // Auto-clear status after 5 seconds
        setTimeout(() => {
            if (statusElement && statusElement.textContent === message) {
                statusElement.textContent = 'Ready';
            }
        }, 5000);
    }

    /**
     * Handle application errors
     */
    handleError(message, error = null) {
        if (error) {
            console.error(message, error);
        }
        
        this.updateStatus(`Error: ${message}`, 'error');
        this.showNotification(message, 'error');
    }

    /**
     * Show notification (enhanced version with legacy support)
     */
    showNotification(message, type = 'success') {
        // Try modern notification first
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type} show`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 4000);
            return;
        }

        // Fallback to creating notification
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${type}`;
        notificationEl.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notificationEl);

        notificationEl.querySelector('.notification-close').addEventListener('click', () => {
            notificationEl.remove();
        });

        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.remove();
            }
        }, 5000);
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            currentTab: this.currentTab,
            modules: {
                aiChat: this.modules.aiChat?.getStatus() || null,
                dashboard: !!this.modules.dashboard,
                monitoring: !!this.modules.monitoring
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear all intervals
        this.intervalIds.forEach(id => clearInterval(id));
        
        if (this.dashboardInterval) {
            clearInterval(this.dashboardInterval);
        }
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Destroy modules
        if (this.modules.aiChat) {
            this.modules.aiChat.destroy();
        }

        this.initialized = false;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
    
    // Auto-refresh intervals for legacy support
    setInterval(() => {
        if (window.app?.currentTab === 'dashboard') {
            window.app.updateDashboardData();
        } else if (window.app?.currentTab === 'monitoring') {
            window.app.updateMonitoringData();
        }
    }, 5000);
});

// Export for potential external use
export default App;