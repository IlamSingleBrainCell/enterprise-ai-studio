/**
 * AI Agent Workflow Engine
 * Orchestrates the Requirements → Design → Build → RCM pipeline
 */

class AIAgentWorkflow {
    constructor() {
        this.aiService = new GeminiAIService();
        this.agents = {
            requirements: new RequirementsAgent(),
            design: new DesignAgent(),
            build: new BuildAgent(),
            rcm: new RCMAgent()
        };
        this.currentTask = null;
        this.workflowHistory = [];
        this.status = 'idle';
        this.listeners = [];
    }

    /**
     * Initialize the workflow engine
     */
    async initialize() {
        const isInitialized = await this.aiService.initialize();
        if (isInitialized) {
            this.status = 'ready';
            this.notifyListeners({ type: 'system', message: 'AI Workflow Engine initialized successfully' });
            return true;
        }
        return false;
    }

    /**
     * Start a new workflow task
     */
    async startWorkflow(taskDescription) {
        if (this.status === 'processing') {
            throw new Error('Workflow is already processing a task');
        }

        this.currentTask = {
            id: `task_${Date.now()}`,
            description: taskDescription,
            startTime: new Date(),
            stage: 'requirements',
            results: {},
            status: 'processing'
        };

        this.status = 'processing';
        this.notifyListeners({ 
            type: 'workflow_started', 
            task: this.currentTask 
        });

        try {
            // Execute the workflow pipeline
            await this.executeWorkflowStages();
            
            this.currentTask.status = 'completed';
            this.currentTask.endTime = new Date();
            this.workflowHistory.push({ ...this.currentTask });
            
            this.notifyListeners({ 
                type: 'workflow_completed', 
                task: this.currentTask 
            });

        } catch (error) {
            this.currentTask.status = 'failed';
            this.currentTask.error = error.message;
            this.notifyListeners({ 
                type: 'workflow_failed', 
                task: this.currentTask,
                error: error.message 
            });
        } finally {
            this.status = 'ready';
            this.currentTask = null;
        }
    }

    /**
     * Execute all workflow stages in sequence
     */
    async executeWorkflowStages() {
        const stages = ['requirements', 'design', 'build', 'rcm'];
        
        for (const stage of stages) {
            this.currentTask.stage = stage;
            this.agents[stage].setStatus('processing');
            
            this.notifyListeners({ 
                type: 'stage_started', 
                stage: stage,
                task: this.currentTask 
            });

            try {
                const result = await this.executeStage(stage);
                this.currentTask.results[stage] = result;
                this.agents[stage].setStatus('completed');
                
                this.notifyListeners({ 
                    type: 'stage_completed', 
                    stage: stage,
                    result: result,
                    task: this.currentTask 
                });

                // Small delay for UI updates
                await this.delay(1000);

            } catch (error) {
                this.agents[stage].setStatus('failed');
                throw new Error(`Stage ${stage} failed: ${error.message}`);
            }
        }
    }

    /**
     * Execute a specific workflow stage
     */
    async executeStage(stage) {
        const task = this.currentTask;
        
        switch (stage) {
            case 'requirements':
                return await this.aiService.analyzeRequirements(task.description);
                
            case 'design':
                return await this.aiService.generateDesign(
                    task.description, 
                    task.results.requirements
                );
                
            case 'build':
                return await this.aiService.generateBuildPlan(task.results.design);
                
            case 'rcm':
                return await this.aiService.analyzeCompliance(
                    task.results.build, 
                    task.description
                );
                
            default:
                throw new Error(`Unknown stage: ${stage}`);
        }
    }

    /**
     * Add event listener for workflow updates
     */
    addEventListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Remove event listener
     */
    removeEventListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of workflow events
     */
    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                // Ignore listener errors
            }
        });
    }

    /**
     * Get current workflow status
     */
    getStatus() {
        return {
            status: this.status,
            currentTask: this.currentTask,
            agents: Object.fromEntries(
                Object.entries(this.agents).map(([key, agent]) => [key, agent.getStatus()])
            ),
            history: this.workflowHistory.slice(-5) // Last 5 tasks
        };
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Base Agent Class
 */
class BaseAgent {
    constructor(name, icon) {
        this.name = name;
        this.icon = icon;
        this.status = 'idle';
        this.lastUpdate = null;
        this.currentTask = null;
        this.confidence = 100;
    }

    setStatus(status) {
        this.status = status;
        this.lastUpdate = new Date();
    }

    setTask(task) {
        this.currentTask = task;
    }

    getStatus() {
        return {
            name: this.name,
            icon: this.icon,
            status: this.status,
            lastUpdate: this.lastUpdate,
            currentTask: this.currentTask,
            confidence: this.confidence
        };
    }
}

/**
 * Requirements Agent
 */
class RequirementsAgent extends BaseAgent {
    constructor() {
        super('Requirements Agent', '📋');
        this.confidence = 92;
    }
}

/**
 * Design Agent
 */
class DesignAgent extends BaseAgent {
    constructor() {
        super('Design Agent', '🎨');
        this.patterns = 47;
        this.queue = 3;
    }

    getStatus() {
        return {
            ...super.getStatus(),
            patterns: this.patterns,
            queue: this.queue
        };
    }
}

/**
 * Build Agent
 */
class BuildAgent extends BaseAgent {
    constructor() {
        super('Build Agent', '🔧');
        this.progress = 0;
        this.eta = null;
    }

    setProgress(progress) {
        this.progress = progress;
        this.eta = progress < 100 ? Math.ceil((100 - progress) / 10) + ' min' : null;
    }

    getStatus() {
        return {
            ...super.getStatus(),
            progress: this.progress,
            eta: this.eta
        };
    }
}

/**
 * RCM Agent
 */
class RCMAgent extends BaseAgent {
    constructor() {
        super('RCM Agent', '🛡️');
        this.compliance = 98.2;
        this.issues = 2;
    }

    getStatus() {
        return {
            ...super.getStatus(),
            compliance: this.compliance,
            issues: this.issues
        };
    }
}

// Export for global access
window.AIAgentWorkflow = AIAgentWorkflow;
export default AIAgentWorkflow;