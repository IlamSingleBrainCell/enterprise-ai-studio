/**
 * Advanced AI Chat Interface - GitHub Copilot Style
 * Enhanced chat interface for AI agent orchestration and SDLC workflow
 */

class AdvancedAIChatInterface {
    constructor(containerId, geminiAPI) {
        this.container = document.getElementById(containerId);
        this.geminiAPI = geminiAPI;
        this.isWorkflowActive = false;
        this.currentWorkflow = null;
        this.chatMessages = [];
        this.activeAgents = new Map();
        
        this.init();
    }

    init() {
        this.createChatInterface();
        this.setupEventListeners();
    }

    createChatInterface() {
        this.container.innerHTML = `
            <div class="ai-chat-wrapper">
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="chat-title">
                        <div class="ai-avatar">🤖</div>
                        <div class="chat-title-text">
                            <h3>AI Agent Orchestrator</h3>
                            <span class="chat-status" id="chat-status">Ready for SDLC workflow</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button class="chat-action-btn" id="clear-chat" title="Clear Chat">🗑️</button>
                        <button class="chat-action-btn" id="download-files" title="Download Generated Files" disabled>📥</button>
                        <button class="chat-action-btn" id="deploy-project" title="Deploy to Connectors" disabled>🚀</button>
                    </div>
                </div>

                <!-- Workflow Configuration Panel -->
                <div class="workflow-config-panel" id="workflow-config">
                    <h4>🛠️ Project Configuration</h4>
                    <div class="config-grid">
                        <div class="config-group">
                            <label>Project Requirements</label>
                            <textarea id="project-requirements" placeholder="e.g., Create a simple to-do list application..."></textarea>
                        </div>
                        <div class="config-row">
                            <div class="config-group">
                                <label>Language & Framework</label>
                                <div class="tech-selector">
                                    <select id="language-select">
                                        <option value="typescript">TypeScript</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="go">Go</option>
                                        <option value="csharp">C#</option>
                                        <option value="php">PHP</option>
                                        <option value="rust">Rust</option>
                                    </select>
                                    <select id="framework-select">
                                        <option value="react">React</option>
                                        <option value="vue">Vue.js</option>
                                        <option value="angular">Angular</option>
                                        <option value="nextjs">Next.js</option>
                                        <option value="express">Express.js</option>
                                        <option value="fastapi">FastAPI</option>
                                        <option value="spring">Spring Boot</option>
                                        <option value="django">Django</option>
                                    </select>
                                </div>
                            </div>
                            <div class="config-group">
                                <label>Autonomy Mode</label>
                                <div class="autonomy-selector">
                                    <div class="autonomy-option" data-mode="manual">
                                        <div class="autonomy-icon">✋</div>
                                        <span>Manual</span>
                                    </div>
                                    <div class="autonomy-option active" data-mode="semi-autonomous">
                                        <div class="autonomy-icon">🔥</div>
                                        <span>Semi-Autonomous</span>
                                    </div>
                                    <div class="autonomy-option" data-mode="fully-autonomous">
                                        <div class="autonomy-icon">🤖</div>
                                        <span>Fully Autonomous</span>
                                    </div>
                                    <div class="autonomy-option" data-mode="expert">
                                        <div class="autonomy-icon">🧠</div>
                                        <span>Expert</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="start-workflow-btn" id="start-sdlc-workflow">
                        🚀 Start SDLC Workflow
                    </button>
                </div>

                <!-- Agent Status Panel -->
                <div class="agent-status-panel" id="agent-status-panel" style="display: none;">
                    <h4>🤖 Agent Orchestration</h4>
                    <div class="agent-timeline" id="agent-timeline">
                        <!-- Dynamic agent status will be inserted here -->
                    </div>
                </div>

                <!-- Chat Messages Area -->
                <div class="chat-messages" id="chat-messages">
                    <div class="welcome-message">
                        <div class="ai-avatar">🤖</div>
                        <div class="message-content">
                            <h4>Welcome to AI Agent Orchestrator!</h4>
                            <p>I'm your AI-powered SDLC assistant. I can help you:</p>
                            <ul>
                                <li>🔍 <strong>Analyze requirements</strong> and create detailed specifications</li>
                                <li>📝 <strong>Generate user stories</strong> and business workflows</li>
                                <li>💻 <strong>Create complete code</strong> in multiple languages and frameworks</li>
                                <li>🧪 <strong>Design test cases</strong> and security reviews</li>
                                <li>🚀 <strong>Generate deployment</strong> configurations and CI/CD pipelines</li>
                            </ul>
                            <p>Configure your project above and click "Start SDLC Workflow" to begin!</p>
                        </div>
                    </div>
                </div>

                <!-- Chat Input Area -->
                <div class="chat-input-area">
                    <div class="input-wrapper">
                        <textarea id="chat-input" placeholder="Ask me anything about your project..." disabled></textarea>
                        <button class="send-btn" id="send-message" disabled>
                            <span class="send-icon">➤</span>
                        </button>
                    </div>
                    <div class="input-suggestions" id="input-suggestions">
                        <button class="suggestion-chip" disabled>💡 Suggest improvements</button>
                        <button class="suggestion-chip" disabled>🔧 Modify implementation</button>
                        <button class="suggestion-chip" disabled>📋 Add more features</button>
                        <button class="suggestion-chip" disabled>🚀 Deploy options</button>
                    </div>
                </div>

                <!-- File Preview Modal -->
                <div class="file-preview-modal" id="file-preview-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📁 Generated Files Preview</h3>
                            <button class="modal-close" id="close-file-preview">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="file-tree" id="file-tree">
                                <!-- Dynamic file tree will be inserted here -->
                            </div>
                            <div class="file-content" id="file-content">
                                <div class="no-file-selected">Select a file to preview its contents</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="modal-btn secondary" id="close-preview">Close</button>
                            <button class="modal-btn primary" id="download-zip">📦 Download ZIP</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addChatStyles();
    }

    addChatStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .ai-chat-wrapper {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: rgba(20, 20, 20, 0.95);
                border-radius: 15px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }

            .chat-header {
                background: rgba(30, 30, 30, 0.95);
                padding: 15px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chat-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .ai-avatar {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2em;
            }

            .chat-title-text h3 {
                margin: 0;
                color: #ffffff;
                font-size: 1.1em;
                font-weight: 600;
            }

            .chat-status {
                font-size: 0.8em;
                color: #4CAF50;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .chat-status::before {
                content: '●';
                color: #4CAF50;
                animation: pulse 2s infinite;
            }

            .chat-actions {
                display: flex;
                gap: 8px;
            }

            .chat-action-btn {
                background: rgba(60, 60, 60, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1.1em;
            }

            .chat-action-btn:hover:not(:disabled) {
                background: rgba(102, 126, 234, 0.3);
                border-color: #667eea;
            }

            .chat-action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .workflow-config-panel {
                background: rgba(25, 25, 25, 0.95);
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .workflow-config-panel h4 {
                color: #ffffff;
                margin: 0 0 15px 0;
                font-size: 1em;
                font-weight: 600;
            }

            .config-grid {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 15px;
            }

            .config-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }

            .config-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .config-group label {
                color: #cccccc;
                font-size: 0.9em;
                font-weight: 500;
            }

            .config-group textarea {
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                padding: 12px;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
            }

            .config-group select {
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                padding: 10px;
                font-family: inherit;
            }

            .tech-selector {
                display: flex;
                gap: 10px;
            }

            .tech-selector select {
                flex: 1;
            }

            .autonomy-selector {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .autonomy-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                padding: 12px 8px;
                background: rgba(40, 40, 40, 0.8);
                border: 2px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            }

            .autonomy-option:hover {
                border-color: rgba(255, 255, 255, 0.3);
            }

            .autonomy-option.active {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.2);
            }

            .autonomy-icon {
                font-size: 1.2em;
            }

            .autonomy-option span {
                color: #cccccc;
                font-size: 0.8em;
                font-weight: 500;
            }

            .start-workflow-btn {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
            }

            .start-workflow-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
            }

            .agent-status-panel {
                background: rgba(25, 25, 25, 0.95);
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 200px;
                overflow-y: auto;
            }

            .agent-status-panel h4 {
                color: #ffffff;
                margin: 0 0 15px 0;
                font-size: 1em;
                font-weight: 600;
            }

            .agent-timeline {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .agent-step {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px;
                background: rgba(40, 40, 40, 0.6);
                border-radius: 8px;
                border-left: 4px solid #666;
                transition: all 0.3s ease;
            }

            .agent-step.active {
                border-left-color: #2196F3;
                background: rgba(33, 150, 243, 0.1);
            }

            .agent-step.completed {
                border-left-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }

            .agent-step.error {
                border-left-color: #F44336;
                background: rgba(244, 67, 54, 0.1);
            }

            .agent-icon {
                font-size: 1.2em;
                width: 24px;
                text-align: center;
            }

            .agent-info {
                flex: 1;
            }

            .agent-name {
                color: #ffffff;
                font-weight: 600;
                font-size: 0.9em;
            }

            .agent-role {
                color: #cccccc;
                font-size: 0.8em;
            }

            .agent-status {
                color: #2196F3;
                font-size: 0.8em;
                font-weight: 500;
            }

            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .welcome-message {
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }

            .welcome-message .ai-avatar {
                flex-shrink: 0;
            }

            .message-content {
                background: rgba(40, 40, 40, 0.8);
                padding: 15px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .message-content h4 {
                color: #ffffff;
                margin: 0 0 10px 0;
                font-size: 1.1em;
            }

            .message-content p {
                color: #cccccc;
                margin: 0 0 10px 0;
                line-height: 1.5;
            }

            .message-content ul {
                color: #cccccc;
                margin: 0;
                padding-left: 20px;
            }

            .message-content li {
                margin-bottom: 5px;
                line-height: 1.4;
            }

            .chat-message {
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }

            .chat-message.user {
                flex-direction: row-reverse;
            }

            .chat-message.user .message-content {
                background: rgba(102, 126, 234, 0.2);
                border-color: rgba(102, 126, 234, 0.3);
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1em;
                flex-shrink: 0;
            }

            .chat-input-area {
                background: rgba(30, 30, 30, 0.95);
                padding: 15px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .input-wrapper {
                display: flex;
                gap: 10px;
                align-items: flex-end;
                margin-bottom: 10px;
            }

            .input-wrapper textarea {
                flex: 1;
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                color: white;
                padding: 12px 15px;
                font-family: inherit;
                resize: none;
                min-height: 20px;
                max-height: 120px;
            }

            .send-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .send-btn:hover:not(:disabled) {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .input-suggestions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .suggestion-chip {
                background: rgba(60, 60, 60, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #cccccc;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.8em;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .suggestion-chip:hover:not(:disabled) {
                background: rgba(102, 126, 234, 0.2);
                border-color: #667eea;
                color: white;
            }

            .suggestion-chip:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @media (max-width: 768px) {
                .config-row {
                    grid-template-columns: 1fr;
                }
                
                .autonomy-selector {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupEventListeners() {
        // Autonomy mode selection
        document.querySelectorAll('.autonomy-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.autonomy-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Start SDLC workflow
        document.getElementById('start-sdlc-workflow').addEventListener('click', () => {
            this.startSDLCWorkflow();
        });

        // Chat input
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Action buttons
        document.getElementById('clear-chat').addEventListener('click', () => {
            this.clearChat();
        });

        document.getElementById('download-files').addEventListener('click', () => {
            this.showFilePreview();
        });

        document.getElementById('deploy-project').addEventListener('click', () => {
            this.deployProject();
        });
    }

    async startSDLCWorkflow() {
        const requirements = document.getElementById('project-requirements').value.trim();
        if (!requirements) {
            alert('Please enter project requirements to start the workflow.');
            return;
        }

        const language = document.getElementById('language-select').value;
        const framework = document.getElementById('framework-select').value;
        const autonomyMode = document.querySelector('.autonomy-option.active').dataset.mode;

        this.isWorkflowActive = true;
        this.showAgentStatus();
        this.enableChatInput();
        this.updateChatStatus('Running SDLC workflow...');

        try {
            // Add user message
            this.addMessage('user', requirements, 'User');

            // Add AI starting message
            this.addMessage('ai', `🚀 Starting SDLC workflow with the following configuration:
            
**Project Requirements:** ${requirements}
**Language:** ${language}
**Framework:** ${framework}
**Autonomy Mode:** ${autonomyMode}

I'll orchestrate multiple AI agents to handle different aspects of the software development lifecycle. Each agent specializes in a specific area:

🤖 **Agent Orchestration Started**
- Product Manager Agent → Requirements Analysis
- Business Analyst Agent → User Story Generation  
- Software Developer Agent → Design & Code Generation
- QA Engineer Agent → Security Review & Testing
- DevOps Engineer Agent → Deployment Configuration

Please wait while the agents work through your project...`, 'AI Orchestrator');

            // Start the workflow
            const workflow = await this.geminiAPI.startSDLCWorkflow(requirements, {
                language,
                framework,
                autonomyMode
            });

            this.currentWorkflow = workflow;
            this.updateAgentTimeline(workflow.agents);

        } catch (error) {
            this.addMessage('ai', `❌ Error starting workflow: ${error.message}`, 'AI Orchestrator');
            this.updateChatStatus('Error occurred');
            this.isWorkflowActive = false;
        }
    }

    showAgentStatus() {
        document.getElementById('agent-status-panel').style.display = 'block';
        document.getElementById('workflow-config').style.display = 'none';
    }

    enableChatInput() {
        document.getElementById('chat-input').disabled = false;
        document.getElementById('send-message').disabled = false;
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.disabled = false;
        });
    }

    updateChatStatus(status) {
        document.getElementById('chat-status').textContent = status;
    }

    updateAgentTimeline(agents) {
        const timeline = document.getElementById('agent-timeline');
        timeline.innerHTML = '';

        const agentSequence = [
            { id: 'product-manager', name: 'Product Manager Agent', role: 'Requirements Analysis', icon: '📋' },
            { id: 'business-analyst', name: 'Business Analyst Agent', role: 'User Story Generation', icon: '📊' },
            { id: 'software-developer', name: 'Software Developer Agent', role: 'Code Generation', icon: '💻' },
            { id: 'qa-engineer', name: 'QA Engineer Agent', role: 'Testing & Security', icon: '🧪' },
            { id: 'devops-engineer', name: 'DevOps Engineer Agent', role: 'Deployment Ready', icon: '🚀' }
        ];

        agentSequence.forEach((agent, index) => {
            const agentElement = document.createElement('div');
            agentElement.className = 'agent-step';
            agentElement.id = `agent-${agent.id}`;

            // Find matching result from workflow
            const result = agents.find(a => a.agentId === agent.id.split('-')[0]);
            let status = 'pending';
            if (result) {
                status = result.status === 'completed' ? 'completed' : 
                        result.status === 'error' ? 'error' : 'active';
            }

            agentElement.classList.add(status);

            agentElement.innerHTML = `
                <div class="agent-icon">${agent.icon}</div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-role">${agent.role}</div>
                    <div class="agent-status">${this.getStatusText(status)}</div>
                </div>
            `;

            timeline.appendChild(agentElement);

            // Animate agent activation
            if (status === 'active' || status === 'completed') {
                setTimeout(() => {
                    if (result && result.output) {
                        this.addMessage('ai', result.output, agent.name);
                    }
                }, index * 2000);
            }
        });

        // Enable download/deploy buttons when workflow completes
        if (agents.length > 0 && agents.every(agent => agent.status === 'completed')) {
            document.getElementById('download-files').disabled = false;
            document.getElementById('deploy-project').disabled = false;
            this.updateChatStatus('Workflow completed successfully!');
            
            this.addMessage('ai', `✅ **SDLC Workflow Completed Successfully!**

All agents have completed their tasks. Your project is now ready with:

📋 **Complete Requirements Analysis**
📊 **Detailed User Stories & Workflows** 
💻 **Full Code Implementation**
🧪 **Comprehensive Test Suite**
🛡️ **Security Review & Recommendations**
🚀 **Deployment Configurations**

**What's Next?**
- Click the 📥 button to preview and download generated files
- Click the 🚀 button to deploy directly to your enterprise connectors
- Continue chatting to make modifications or add features

Total files generated: **${this.geminiAPI.getGeneratedFiles().length}**`, 'AI Orchestrator');
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'pending': return 'Waiting...';
            case 'active': return 'Processing...';
            case 'completed': return 'Completed ✓';
            case 'error': return 'Error ✗';
            default: return 'Unknown';
        }
    }

    addMessage(type, content, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;

        const avatarClass = type === 'user' ? 'user-avatar' : 'ai-avatar';
        const avatarContent = type === 'user' ? '👤' : '🤖';

        messageElement.innerHTML = `
            <div class="${avatarClass}">${avatarContent}</div>
            <div class="message-content">
                <div class="message-header">
                    <strong>${sender}</strong>
                    <span class="message-time" style="float: right; font-size: 0.7em; color: #999;">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="message-text">${this.formatMessageContent(content)}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.chatMessages.push({
            type,
            content,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    formatMessageContent(content) {
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        input.value = '';
        this.addMessage('user', message, 'You');

        try {
            // Here you would integrate with the Gemini API for follow-up questions
            this.addMessage('ai', 'I understand your question. Let me process that for you...', 'AI Assistant');

        } catch (error) {
            this.addMessage('ai', `I apologize, but I encountered an error: ${error.message}`, 'AI Assistant');
        }
    }

    clearChat() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="ai-avatar">🤖</div>
                <div class="message-content">
                    <h4>Welcome to AI Agent Orchestrator!</h4>
                    <p>I'm your AI-powered SDLC assistant. Configure your project above and click "Start SDLC Workflow" to begin!</p>
                </div>
            </div>
        `;
        
        this.chatMessages = [];
        document.getElementById('agent-status-panel').style.display = 'none';
        document.getElementById('workflow-config').style.display = 'block';
        this.isWorkflowActive = false;
        this.currentWorkflow = null;
        
        // Reset UI
        document.getElementById('chat-input').disabled = true;
        document.getElementById('send-message').disabled = true;
        document.getElementById('download-files').disabled = true;
        document.getElementById('deploy-project').disabled = true;
        
        this.updateChatStatus('Ready for SDLC workflow');
    }

    async showFilePreview() {
        const files = this.geminiAPI.getGeneratedFiles();
        if (files.length === 0) {
            alert('No files have been generated yet.');
            return;
        }

        // Here you would show the file preview modal
        alert(`Generated ${files.length} files. Download functionality will be implemented.`);
    }

    async deployProject() {
        // This would integrate with the enterprise connectors
        alert('Deploy integration will connect to your configured enterprise services (GitHub, Jenkins, Docker, etc.)');
    }
}

// Export for use in other modules
window.AdvancedAIChatInterface = AdvancedAIChatInterface;
export default AdvancedAIChatInterface;