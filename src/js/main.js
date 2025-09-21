/**
 * Main application entry point.
 * Handles DOM initialization, event listeners, and workflow management.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const startButton = document.getElementById('start-workflow-btn');
    const requirementsField = document.getElementById('ai-project-requirements');
    const languageSelect = document.getElementById('ai-language-select');
    const frameworkSelect = document.getElementById('ai-framework-select');
    const clearChatButton = document.getElementById('clear-ai-chat');
    const generateAndDownloadButton = document.getElementById('generate-and-download');

    // --- Agent ID Mapping ---
    const agentIdMapping = {
        requirements: 'req',
        design: 'design',
        build: 'build',
        rcm: 'rcm'
    };

    // --- Event Handlers ---

    /**
     * Toggles the state of the 'Start Workflow' button based on requirements input.
     */
    function toggleButtonState() {
        if (!requirementsField || !startButton) return;
        const hasContent = requirementsField.value.trim().length > 0;
        startButton.disabled = !hasContent;
        startButton.style.background = hasContent ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #666, #555)';
        startButton.style.color = hasContent ? 'white' : '#999';
        startButton.style.cursor = hasContent ? 'pointer' : 'not-allowed';
        startButton.style.opacity = hasContent ? '1' : '0.6';
    }

    /**
     * Initializes and runs the AI agent workflow.
     */
    async function startWorkflow() {
        const requirements = requirementsField.value.trim();
        if (!requirements) {
            alert('Please enter project requirements.');
            return;
        }

        const language = languageSelect.value;
        const framework = frameworkSelect.value;

        try {
            const config = new ProductionGeminiConfig();
            if (!config.isConfigured) {
                // The constructor already prompts for the key if not found.
                // We can add an extra check here if needed.
                return;
            }
            const geminiService = new GeminiAIService(config);
            const workflow = new AIAgentWorkflow(geminiService);

            workflow.addEventListener(handleWorkflowEvents);
            await workflow.startWorkflow(requirements);

        } catch (error) {
            console.error("Failed to start workflow:", error);
            alert("Error: " + error.message);
        }
    }

    /**
     * Handles events dispatched from the AIAgentWorkflow.
     * @param {object} event - The workflow event object.
     */
    function handleWorkflowEvents(event) {
        console.log("Workflow event:", event);
        const { type, stage, task, result, message, error } = event;
        const agentId = agentIdMapping[stage];

        if (type === 'stage_started' && agentId) {
            updateAgentStatus(agentId, 'processing', `Processing: ${task.description}`);
            updateWorkflowStatus(`${stage} agent is processing...`, 'info');
            if (window.addAIMessage) {
                const persona = stage.replace(/_/g, '-') + "-agent";
                window.addAIMessage('ai', `**Starting ${stage} stage...**`, persona);
            }
        }

        if (type === 'stage_completed' && agentId) {
            updateAgentStatus(agentId, 'completed', 'Processing completed successfully');
            showAgentResults(agentId, `${stage} analysis completed for: ${task.description}`);
            if (window.addAIMessage) {
                const persona = stage.replace(/_/g, '-') + "-agent";
                window.addAIMessage('ai', `**Stage ${stage} completed.**\n\n${JSON.stringify(result, null, 2)}`, persona);
            }
        }

        if (type === 'workflow_completed') {
            updateWorkflowStatus('Workflow completed successfully!', 'success');
            showWorkflowResults(task.description);
            if (window.addAIMessage) {
                window.addAIMessage('ai', `**Workflow for "${task.description}" has completed successfully!**`);
            }
        }

        if (type === 'workflow_failed') {
            updateWorkflowStatus(`Workflow failed: ${error}`, 'error');
            if (window.addAIMessage) {
                window.addAIMessage('ai', `**Workflow failed at stage ${task.stage}:**\n\n${error}`);
            }
        }

        if (type === 'system') {
            console.log(`System message: ${message}`);
        }
    }

    // --- Event Listener Registration ---
    if (requirementsField) {
        requirementsField.addEventListener('input', toggleButtonState);
        toggleButtonState(); // Initial check
    }

    if (startButton) {
        startButton.addEventListener('click', startWorkflow);
    }

    if (clearChatButton && window.clearAIChat) {
        clearChatButton.addEventListener('click', window.clearAIChat);
    }

    if (generateAndDownloadButton && window.generateAndDownloadFiles) {
        generateAndDownloadButton.addEventListener('click', window.generateAndDownloadFiles);
    }
});


// --- UI Update Functions ---

/**
 * Updates the status display for a specific AI agent.
 * @param {string} agentId - The ID of the agent (e.g., 'req', 'design').
 * @param {string} status - The new status ('processing', 'completed', 'failed').
 * @param {string} message - The message to display for the current task.
 */
function updateAgentStatus(agentId, status, message) {
    const statusColors = {
        'processing': '#2196F3',
        'completed': '#4CAF50',
        'failed': '#F44336'
    };

    const statusTexts = {
        'processing': 'Processing',
        'completed': 'Completed',
        'failed': 'Failed'
    };

    const statusElement = document.getElementById(`${agentId}-status`);
    const detailedStatusElement = document.getElementById(`${agentId}-detailed-status`);
    const currentTaskElement = document.getElementById(`${agentId}-current-task`);
    const lastUpdateElement = document.getElementById(`${agentId}-last-update`);

    if (statusElement) {
        statusElement.textContent = statusTexts[status];
        statusElement.style.color = statusColors[status];
    }

    if (detailedStatusElement) {
        detailedStatusElement.textContent = statusTexts[status];
        detailedStatusElement.style.color = statusColors[status];
    }

    if (currentTaskElement) {
        currentTaskElement.textContent = message;
    }

    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
    }
}

/**
 * Displays the results from a completed agent stage.
 * @param {string} agentId - The ID of the agent.
 * @param {string} result - The result text to display.
 */
function showAgentResults(agentId, result) {
    const resultsElement = document.getElementById(`${agentId}-results`);
    if (resultsElement) {
        const resultText = resultsElement.querySelector('div:last-child');
        if (resultText) {
            resultText.textContent = result;
        }
        resultsElement.style.display = 'block';
    }
}

/**
 * Displays the final summary of the completed workflow.
 * @param {string} description - The initial task description.
 */
function showWorkflowResults(description) {
    const resultsSection = document.getElementById('workflow-results');
    const summaryDiv = document.getElementById('workflow-summary');

    if (resultsSection && summaryDiv) {
        summaryDiv.innerHTML = `
            <h4 style="color: #4CAF50; margin-bottom: 15px;">Task Completed: ${description}</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                    <h5 style="color: #FFD700; margin-bottom: 10px;"> Requirements Analysis</h5>
                    <p style="color: #cccccc; font-size: 0.9em;">Successfully analyzed business requirements and identified key components.</p>
                </div>
                <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                    <h5 style="color: #FFD700; margin-bottom: 10px;"> System Design</h5>
                    <p style="color: #cccccc; font-size: 0.9em;">Generated comprehensive system architecture with microservices design.</p>
                </div>
                <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                    <h5 style="color: #FFD700; margin-bottom: 10px;"> Build Plan</h5>
                    <p style="color: #cccccc; font-size: 0.9em;">Created detailed implementation plan with technology recommendations.</p>
                </div>
                <div style="background: rgba(60, 60, 60, 0.8); padding: 15px; border-radius: 8px;">
                    <h5 style="color: #FFD700; margin-bottom: 10px;"> Compliance Review</h5>
                    <p style="color: #cccccc; font-size: 0.9em;">Completed regulatory compliance analysis for all requirements.</p>
                </div>
            </div>
        `;
        resultsSection.style.display = 'block';
    }
}

/**
 * Updates the overall workflow status message.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('info', 'success', 'error').
 */
function updateWorkflowStatus(message, type = 'info') {
    const statusElement = document.getElementById('workflow-status');
    if (statusElement) {
        statusElement.innerHTML = `<div class="workflow-status ${type}">${message}</div>`;
    }
}
