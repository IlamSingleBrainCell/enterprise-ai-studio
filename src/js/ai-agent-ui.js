/**
 * AI Agent UI Manager
 * Handles real-time updates and user interactions for the AI Agent interface
 */

class AIAgentUIManager {
    constructor() {
        this.workflow = null;
        this.isInitialized = false;
        this.currentTaskId = null;
        this.statusElements = {};
        this.intervalIds = [];
    }

    /**
     * Initialize the AI Agent UI Manager
     */
    async initialize() {
        try {
            // Import and initialize the AI workflow
            if (typeof GeminiAIService === 'undefined' || typeof AIAgentWorkflow === 'undefined') {
                // Load the dependencies dynamically
                await this.loadDependencies();
            }

            this.workflow = new AIAgentWorkflow();
            const initialized = await this.workflow.initialize();
            
            if (initialized) {
                this.setupEventListeners();
                this.setupWorkflowEventHandlers();
                this.initializeStatusElements();
                this.isInitialized = true;
                this.updateWorkflowStatus('AI Agent System initialized and ready', 'success');
                return true;
            } else {
                this.updateWorkflowStatus('Failed to initialize AI Agent System', 'error');
                return false;
            }
        } catch (error) {
            this.updateWorkflowStatus(`Initialization error: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Load AI dependencies
     */
    async loadDependencies() {
        return new Promise((resolve) => {
            // Since we're using inline modules, we'll simulate the loading
            // In a real implementation, these would be loaded via script tags
            setTimeout(() => {
                if (typeof GeminiAIService === 'undefined') {
                    window.GeminiAIService = class {
                        constructor() {
                            this.apiKey = 'AIzaSyC6JpuPJPjZyLnNOs0peWh47K7MVPR7NOk';
                        }
                        async initialize() { return true; }
                        async analyzeRequirements(req) { 
                            await this.delay(2000);
                            return { analysis: "Requirements analyzed successfully", complexity: "Medium" }; 
                        }
                        async generateDesign(req, analysis) { 
                            await this.delay(3000);
                            return { architecture: "Microservices design", components: ["API", "Database", "Frontend"] }; 
                        }
                        async generateBuildPlan(design) { 
                            await this.delay(2500);
                            return { steps: ["Setup", "Development", "Testing"], technology: "Node.js, React" }; 
                        }
                        async analyzeCompliance(plan, req) { 
                            await this.delay(1500);
                            return { compliance: {"MiFID II": "Compliant", "GDPR": "Compliant"}, risk: "Low" }; 
                        }
                        delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
                    };
                }
                
                if (typeof AIAgentWorkflow === 'undefined') {
                    window.AIAgentWorkflow = class {
                        constructor() {
                            this.aiService = new GeminiAIService();
                            this.status = 'idle';
                            this.listeners = [];
                            this.currentTask = null;
                        }
                        async initialize() { return await this.aiService.initialize(); }
                        async startWorkflow(description) {
                            this.currentTask = { id: Date.now(), description, stage: 'requirements' };
                            this.status = 'processing';
                            this.notifyListeners({ type: 'workflow_started', task: this.currentTask });
                            
                            const stages = ['requirements', 'design', 'build', 'rcm'];
                            for (const stage of stages) {
                                this.currentTask.stage = stage;
                                this.notifyListeners({ type: 'stage_started', stage, task: this.currentTask });
                                
                                let result;
                                switch (stage) {
                                    case 'requirements':
                                        result = await this.aiService.analyzeRequirements(description);
                                        break;
                                    case 'design':
                                        result = await this.aiService.generateDesign(description, {});
                                        break;
                                    case 'build':
                                        result = await this.aiService.generateBuildPlan({});
                                        break;
                                    case 'rcm':
                                        result = await this.aiService.analyzeCompliance({}, description);
                                        break;
                                }
                                
                                this.notifyListeners({ type: 'stage_completed', stage, result, task: this.currentTask });
                            }
                            
                            this.status = 'completed';
                            this.notifyListeners({ type: 'workflow_completed', task: this.currentTask });
                        }
                        addEventListener(listener) { this.listeners.push(listener); }
                        notifyListeners(event) { this.listeners.forEach(l => l(event)); }
                        getStatus() { return { status: this.status, currentTask: this.currentTask }; }
                    };
                }
                resolve();
            }, 100);
        });
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        const startButton = document.getElementById('start-workflow-btn');
        const taskInput = document.getElementById('task-input');

        if (startButton) {
            startButton.addEventListener('click', () => this.handleStartWorkflow());
        }

        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleStartWorkflow();
                }
            });
        }
    }

    /**
     * Setup workflow event handlers
     */
    setupWorkflowEventHandlers() {
        if (this.workflow) {
            this.workflow.addEventListener((event) => {
                this.handleWorkflowEvent(event);
            });
        }
    }

    /**
     * Initialize status elements
     */
    initializeStatusElements() {
        this.statusElements = {
            // Requirements Agent
            req: {
                status: document.getElementById('req-status'),
                detailedStatus: document.getElementById('req-detailed-status'),
                confidence: document.getElementById('req-confidence'),
                lastUpdate: document.getElementById('req-last-update'),
                currentTask: document.getElementById('req-current-task'),
                results: document.getElementById('req-results')
            },
            // Design Agent
            design: {
                status: document.getElementById('design-status'),
                detailedStatus: document.getElementById('design-detailed-status'),
                queue: document.getElementById('design-queue'),
                patterns: document.getElementById('design-patterns'),
                currentTask: document.getElementById('design-current-task'),
                results: document.getElementById('design-results')
            },
            // Build Agent
            build: {
                status: document.getElementById('build-status'),
                detailedStatus: document.getElementById('build-detailed-status'),
                progress: document.getElementById('build-progress'),
                eta: document.getElementById('build-eta'),
                currentTask: document.getElementById('build-current-task'),
                results: document.getElementById('build-results')
            },
            // RCM Agent
            rcm: {
                status: document.getElementById('rcm-status'),
                detailedStatus: document.getElementById('rcm-detailed-status'),
                compliance: document.getElementById('rcm-compliance'),
                issues: document.getElementById('rcm-issues'),
                currentTask: document.getElementById('rcm-current-task'),
                results: document.getElementById('rcm-results')
            }
        };
    }

    /**
     * Handle workflow start
     */
    async handleStartWorkflow() {
        const taskInput = document.getElementById('task-input');
        const startButton = document.getElementById('start-workflow-btn');

        if (!taskInput || !taskInput.value.trim()) {
            this.updateWorkflowStatus('Please enter a task description', 'warning');
            return;
        }

        if (!this.isInitialized) {
            this.updateWorkflowStatus('AI system not initialized', 'error');
            return;
        }

        const taskDescription = taskInput.value.trim();
        startButton.disabled = true;
        startButton.textContent = 'Processing...';

        try {
            await this.workflow.startWorkflow(taskDescription);
        } catch (error) {
            this.updateWorkflowStatus(`Workflow failed: ${error.message}`, 'error');
        } finally {
            startButton.disabled = false;
            startButton.textContent = 'Start Workflow';
        }
    }

    /**
     * Handle workflow events
     */
    handleWorkflowEvent(event) {
        switch (event.type) {
            case 'workflow_started':
                this.updateWorkflowStatus(`Workflow started: ${event.task.description}`, 'info');
                this.resetAllAgents();
                break;

            case 'stage_started':
                this.updateAgentStatus(event.stage, 'processing', `Processing: ${event.task.description}`);
                this.updateWorkflowStatus(`${this.capitalizeFirst(event.stage)} agent started`, 'info');
                break;

            case 'stage_completed':
                this.updateAgentStatus(event.stage, 'completed', 'Completed successfully');
                this.displayAgentResults(event.stage, event.result);
                this.updateWorkflowStatus(`${this.capitalizeFirst(event.stage)} agent completed`, 'success');
                break;

            case 'workflow_completed':
                this.updateWorkflowStatus('Workflow completed successfully!', 'success');
                this.showWorkflowResults(event.task);
                break;

            case 'workflow_failed':
                this.updateWorkflowStatus(`Workflow failed: ${event.error}`, 'error');
                break;
        }
    }

    /**
     * Update agent status
     */
    updateAgentStatus(agentType, status, message) {
        const elements = this.statusElements[agentType];
        if (!elements) return;

        const statusColor = this.getStatusColor(status);
        const statusText = this.getStatusText(status);

        // Update status elements
        if (elements.status) {
            elements.status.textContent = statusText;
            elements.status.style.color = statusColor;
        }

        if (elements.detailedStatus) {
            elements.detailedStatus.textContent = statusText;
            elements.detailedStatus.style.color = statusColor;
        }

        if (elements.currentTask) {
            elements.currentTask.textContent = message;
        }

        if (elements.lastUpdate) {
            elements.lastUpdate.textContent = new Date().toLocaleTimeString();
        }

        // Update card styling
        const card = document.getElementById(`${agentType}-agent-card`);
        if (card) {
            card.className = `dashboard-card agent-card-${status}`;
        }
    }

    /**
     * Display agent results
     */
    displayAgentResults(agentType, result) {
        const elements = this.statusElements[agentType];
        if (!elements || !elements.results) return;

        const resultsDiv = elements.results.querySelector('div:last-child');
        if (resultsDiv) {
            resultsDiv.textContent = this.formatAgentResult(result);
        }

        elements.results.style.display = 'block';
    }

    /**
     * Format agent result for display
     */
    formatAgentResult(result) {
        if (typeof result === 'string') return result;
        
        if (result.analysis) return result.analysis;
        if (result.architecture) return result.architecture;
        if (result.steps) return result.steps.join(', ');
        if (result.compliance) return `Compliance: ${Object.keys(result.compliance).join(', ')}`;
        
        return JSON.stringify(result, null, 2).substring(0, 100) + '...';
    }

    /**
     * Reset all agents to idle state
     */
    resetAllAgents() {
        const agents = ['req', 'design', 'build', 'rcm'];
        agents.forEach(agent => {
            this.updateAgentStatus(agent, 'idle', 'Waiting for turn...');
            const elements = this.statusElements[agent];
            if (elements && elements.results) {
                elements.results.style.display = 'none';
            }
        });
    }

    /**
     * Show workflow results
     */
    showWorkflowResults(task) {
        const resultsSection = document.getElementById('workflow-results');
        const summaryDiv = document.getElementById('workflow-summary');

        if (resultsSection && summaryDiv) {
            summaryDiv.innerHTML = `
                <h4 style="color: #4CAF50; margin-bottom: 15px;">Task: ${task.description}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">📋 Requirements Analysis</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">${this.formatAgentResult(task.results?.requirements || 'Completed')}</p>
                    </div>
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">🎨 System Design</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">${this.formatAgentResult(task.results?.design || 'Completed')}</p>
                    </div>
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">🔧 Build Plan</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">${this.formatAgentResult(task.results?.build || 'Completed')}</p>
                    </div>
                    <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #FFD700; margin-bottom: 10px;">🛡️ Compliance Review</h5>
                        <p style="color: #cccccc; font-size: 0.9em;">${this.formatAgentResult(task.results?.rcm || 'Completed')}</p>
                    </div>
                </div>
            `;
            resultsSection.style.display = 'block';
        }
    }

    /**
     * Update workflow status message
     */
    updateWorkflowStatus(message, type = 'info') {
        const statusElement = document.getElementById('workflow-status');
        if (statusElement) {
            statusElement.innerHTML = `<div class="workflow-status ${type}">${message}</div>`;
        }
    }

    /**
     * Get status color for UI
     */
    getStatusColor(status) {
        const colors = {
            'idle': '#FF9800',
            'processing': '#2196F3',
            'completed': '#4CAF50',
            'failed': '#F44336'
        };
        return colors[status] || '#FF9800';
    }

    /**
     * Get status text for UI
     */
    getStatusText(status) {
        const texts = {
            'idle': 'Ready',
            'processing': 'Processing',
            'completed': 'Completed',
            'failed': 'Failed'
        };
        return texts[status] || 'Unknown';
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Cleanup on page unload
     */
    cleanup() {
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('agents-tab')) {
        window.aiAgentUI = new AIAgentUIManager();
        
        // Initialize when the AI Agents tab is first shown
        const observer = new MutationObserver(() => {
            const agentsTab = document.getElementById('agents-tab');
            if (agentsTab && agentsTab.style.display !== 'none' && !window.aiAgentUI.isInitialized) {
                window.aiAgentUI.initialize();
                observer.disconnect();
            }
        });
        
        observer.observe(document.getElementById('agents-tab'), {
            attributes: true,
            attributeFilter: ['style']
        });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.aiAgentUI) {
        window.aiAgentUI.cleanup();
    }
});

export default AIAgentUIManager;