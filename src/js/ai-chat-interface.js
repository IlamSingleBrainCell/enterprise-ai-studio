/**
 * AI Chat Interface - GitHub Copilot Style
 * Enhanced chat interface for AI agent orchestration and SDLC workflow
 */

class AIChatInterface {
    constructor(containerId, geminiAPI, conversationDB) {
        this.container = document.getElementById(containerId);
        this.gemini = geminiAPI;
        this.conversationDB = conversationDB;
        this.currentSessionId = null;
        this.isTyping = false;
        this.chatMessages = [];
        
        this.init();
    }

    async init() {
        try {
            // Initialize Gemini API
            this.setupChatUI();
            this.setupEventListeners();
            await this.createNewSession();
            this.loadSessions();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Chat Interface:', error);
            this.showError('Failed to initialize chat system');
            return false;
        }
    }

    /**
     * Setup chat UI elements
     */
    setupChatUI() {
        // Find or create chat container
        this.chatContainer = document.getElementById('ai-chat-container') || this.createChatContainer();
        
        // Setup chat elements
        this.setupChatElements();
        
        // Apply styles
        this.applyChatStyles();
    }

    /**
     * Create chat container if it doesn't exist
     */
    createChatContainer() {
        const container = document.createElement('div');
        container.id = 'ai-chat-container';
        container.className = 'ai-chat-container';
        
        // Add to right tab content
        const rightTabContent = document.getElementById('right-tab-content');
        if (rightTabContent) {
            rightTabContent.appendChild(container);
        }
        
        return container;
    }

    /**
     * Setup all chat elements
     */
    setupChatElements() {
        this.chatContainer.innerHTML = `
            <div class="ai-chat-wrapper">
                <!-- Sessions Sidebar -->
                <div class="chat-sessions-sidebar" id="chat-sessions-sidebar">
                    <div class="sessions-header">
                        <button class="new-session-btn" id="new-session-btn">
                            <span class="plus-icon">+</span>
                            New Chat
                        </button>
                        <button class="close-sessions-btn" id="close-sessions-btn">&times;</button>
                    </div>
                    <div class="sessions-list" id="sessions-list">
                        <!-- Sessions will be loaded here -->
                    </div>
                </div>

                <!-- Main Chat Area -->
                <div class="chat-main-area">
                    <!-- Chat Header -->
                    <div class="chat-header">
                        <div class="chat-title">
                            <button class="sessions-toggle-btn" id="sessions-toggle-btn">
                                <span class="hamburger-icon">☰</span>
                            </button>
                            <div class="ai-avatar">🤖</div>
                            <div class="chat-title-text">
                                <h3>AI Agent Assistant</h3>
                                <span class="chat-status" id="chat-status">Ready to help with your SDLC workflow</span>
                            </div>
                        </div>
                        <div class="chat-actions">
                            <button class="chat-action-btn" id="clear-chat" title="Clear Current Chat">🗑️</button>
                            <button class="chat-action-btn" id="export-chat" title="Export Chat">📤</button>
                        </div>
                    </div>

                    <!-- Chat Messages Area -->
                    <div class="chat-messages" id="chat-messages">
                        <div class="welcome-message">
                            <div class="ai-avatar">🤖</div>
                            <div class="message-content">
                                <h4>Welcome to AI Agent Assistant!</h4>
                                <p>I'm your AI-powered SDLC assistant. I can help you with:</p>
                                <ul>
                                    <li>💻 <strong>Code Generation</strong> - Create complete applications and components</li>
                                    <li>🔍 <strong>Requirements Analysis</strong> - Break down and analyze project requirements</li>
                                    <li>📋 <strong>User Story Creation</strong> - Generate detailed user stories and acceptance criteria</li>
                                    <li>🧪 <strong>Test Generation</strong> - Create comprehensive test suites</li>
                                    <li>🚀 <strong>Deployment Setup</strong> - Configure CI/CD and deployment pipelines</li>
                                    <li>🔧 <strong>Enterprise Integration</strong> - Connect with GitHub, JIRA, Jenkins, AWS, and more</li>
                                </ul>
                                <p>Just describe what you need, and I'll orchestrate the right AI agents to help you!</p>
                            </div>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div class="typing-indicator" id="typing-indicator" style="display: none;">
                        <div class="ai-avatar small">🤖</div>
                        <div class="typing-content">
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>

                    <!-- Chat Input Area -->
                    <div class="chat-input-area">
                        <div class="input-wrapper">
                            <button class="attach-btn" id="attach-btn" title="Attach files or context">📎</button>
                            <textarea 
                                id="chat-input" 
                                placeholder="Describe your project requirements, ask for help with code, or request enterprise integrations..."
                                rows="1"
                            ></textarea>
                            <button class="send-btn" id="send-message">
                                <span class="send-icon">➤</span>
                            </button>
                        </div>
                        <div class="input-suggestions" id="input-suggestions">
                            <button class="suggestion-chip" data-suggestion="Create a full-stack web application">🌐 Create web app</button>
                            <button class="suggestion-chip" data-suggestion="Generate user stories for my project">📋 Generate user stories</button>
                            <button class="suggestion-chip" data-suggestion="Set up CI/CD pipeline">🔄 Setup CI/CD</button>
                            <button class="suggestion-chip" data-suggestion="Integrate with enterprise APIs">🔗 Enterprise APIs</button>
                        </div>
                    </div>
                </div>

                <!-- Attach Options Popup -->
                <div class="attach-options" id="attach-options" style="display: none;">
                    <button class="attach-option" data-type="file">📄 Upload File</button>
                    <button class="attach-option" data-type="github">🐙 GitHub Repository</button>
                    <button class="attach-option" data-type="jira">📊 JIRA Project</button>
                    <button class="attach-option" data-type="confluence">📚 Confluence Space</button>
                </div>
            </div>
        `;
    }

    /**
     * Apply chat-specific styles
     */
    applyChatStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .ai-chat-container {
                height: 100%;
                position: relative;
                background: rgba(15, 15, 20, 0.95);
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ai-chat-wrapper {
                height: 100%;
                display: flex;
                position: relative;
            }

            /* Sessions Sidebar */
            .chat-sessions-sidebar {
                width: 280px;
                background: rgba(20, 20, 25, 0.98);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
                position: absolute;
                height: 100%;
                z-index: 10;
            }

            .chat-sessions-sidebar.open {
                transform: translateX(0);
            }

            .sessions-header {
                padding: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(25, 25, 30, 0.95);
            }

            .new-session-btn {
                flex: 1;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
            }

            .new-session-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .close-sessions-btn {
                background: none;
                border: none;
                color: #999;
                font-size: 1.5em;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 10px;
            }

            .sessions-list {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }

            .session-item {
                padding: 12px;
                background: rgba(40, 40, 50, 0.6);
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid transparent;
            }

            .session-item:hover {
                background: rgba(60, 60, 70, 0.8);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .session-item.active {
                background: rgba(102, 126, 234, 0.2);
                border-color: #667eea;
            }

            .session-title {
                color: white;
                font-weight: 600;
                font-size: 0.9em;
                margin-bottom: 4px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .session-preview {
                color: #999;
                font-size: 0.8em;
                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .session-date {
                color: #666;
                font-size: 0.7em;
                margin-top: 4px;
            }

            /* Main Chat Area */
            .chat-main-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .chat-header {
                background: rgba(25, 25, 30, 0.95);
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

            .sessions-toggle-btn {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .sessions-toggle-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .ai-avatar {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1em;
            }

            .ai-avatar.small {
                width: 24px;
                height: 24px;
                font-size: 0.8em;
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
                background: rgba(60, 60, 70, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1.1em;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chat-action-btn:hover {
                background: rgba(102, 126, 234, 0.3);
                border-color: #667eea;
            }

            /* Chat Messages */
            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 15px;
                scroll-behavior: smooth;
            }

            .welcome-message {
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }

            .message-content {
                background: rgba(40, 40, 50, 0.8);
                padding: 15px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                flex: 1;
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
                margin-bottom: 15px;
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

            .message-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                align-items: center;
            }

            .message-sender {
                color: #ffffff;
                font-weight: 600;
                font-size: 0.9em;
            }

            .message-time {
                color: #999;
                font-size: 0.7em;
            }

            .message-text {
                color: #cccccc;
                line-height: 1.5;
            }

            .agent-badge {
                background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: 600;
                margin-left: 8px;
            }

            /* Typing Indicator */
            .typing-indicator {
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 0 20px 10px;
            }

            .typing-content {
                background: rgba(40, 40, 50, 0.8);
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .typing-dots {
                display: flex;
                gap: 4px;
            }

            .typing-dots span {
                width: 6px;
                height: 6px;
                background: #667eea;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% {
                    transform: scale(0);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            /* Chat Input */
            .chat-input-area {
                background: rgba(25, 25, 30, 0.95);
                padding: 15px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .input-wrapper {
                display: flex;
                gap: 10px;
                align-items: flex-end;
                margin-bottom: 10px;
            }

            .attach-btn {
                background: rgba(60, 60, 70, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #999;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1.1em;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .attach-btn:hover {
                background: rgba(102, 126, 234, 0.3);
                border-color: #667eea;
                color: white;
            }

            .input-wrapper textarea {
                flex: 1;
                background: rgba(40, 40, 50, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                color: white;
                padding: 12px 15px;
                font-family: inherit;
                resize: none;
                min-height: 40px;
                max-height: 120px;
                line-height: 1.5;
            }

            .input-wrapper textarea::placeholder {
                color: #666;
            }

            .input-wrapper textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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

            .send-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .input-suggestions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .suggestion-chip {
                background: rgba(60, 60, 70, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #cccccc;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.8em;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .suggestion-chip:hover {
                background: rgba(102, 126, 234, 0.2);
                border-color: #667eea;
                color: white;
            }

            /* Attach Options */
            .attach-options {
                position: absolute;
                bottom: 70px;
                left: 20px;
                background: rgba(30, 30, 35, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 8px;
                z-index: 100;
                min-width: 180px;
            }

            .attach-option {
                display: block;
                width: 100%;
                background: none;
                border: none;
                color: #cccccc;
                padding: 10px 12px;
                text-align: left;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.3s ease;
                font-size: 0.9em;
            }

            .attach-option:hover {
                background: rgba(102, 126, 234, 0.2);
                color: white;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .chat-sessions-sidebar {
                    width: 100%;
                }
                
                .input-suggestions {
                    display: none;
                }
                
                .chat-title-text h3 {
                    font-size: 1em;
                }
            }
        `;
        
        if (!document.querySelector('style[data-chat-styles]')) {
            styles.setAttribute('data-chat-styles', 'true');
            document.head.appendChild(styles);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sessions toggle
        document.getElementById('sessions-toggle-btn').addEventListener('click', () => {
            this.toggleSessionsPanel();
        });

        document.getElementById('close-sessions-btn').addEventListener('click', () => {
            this.hideSessionsPanel();
        });

        // New session
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.createNewSession();
        });

        // Chat input
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');
        
        chatInput.addEventListener('input', () => {
            this.autoResizeInput();
            this.updateSendButton(chatInput.value.trim().length > 0);
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chatInput.value = chip.dataset.suggestion;
                this.autoResizeInput();
                this.updateSendButton(true);
                chatInput.focus();
            });
        });

        // Attach options
        document.getElementById('attach-btn').addEventListener('click', () => {
            this.showAttachOptions();
        });

        // Clear chat
        document.getElementById('clear-chat').addEventListener('click', () => {
            this.clearChatMessages();
        });
    }

    /**
     * Send message to AI
     */
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message || this.isTyping) return;

        // Clear input
        input.value = '';
        this.autoResizeInput();
        this.updateSendButton(false);

        // Add user message to UI
        this.addMessageToUI('user', message);

        // Save message to current session
        if (this.currentSessionId && this.conversationDB) {
            await this.conversationDB.addMessage(this.currentSessionId, {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
        }

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Determine the type of agent needed
            const agentType = this.determineAgentType(message);
            
            // Generate AI response
            const response = await this.gemini.generateContent(message, {
                maxTokens: 2000,
                temperature: 0.7,
                agentType: agentType
            });

            // Hide typing indicator
            this.hideTypingIndicator();

            // Format and add AI response
            const formattedResponse = this.formatAIResponse(response, agentType);
            this.addMessageToUI('ai', formattedResponse, agentType);

            // Save AI response to current session
            if (this.currentSessionId && this.conversationDB) {
                await this.conversationDB.addMessage(this.currentSessionId, {
                    role: 'assistant',
                    content: formattedResponse,
                    agentType: agentType,
                    timestamp: new Date().toISOString()
                });
            }

            // Update session title if it's the first interaction
            if (this.chatMessages.length <= 2) {
                await this.updateSessionTitle(message);
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToUI('ai', `I apologize, but I encountered an error: ${error.message}`, 'error');
        }
    }

    /**
     * Determine which type of agent should handle the request
     */
    determineAgentType(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('code') || lowerMessage.includes('implement') || lowerMessage.includes('function') || lowerMessage.includes('class')) {
            return 'developer';
        } else if (lowerMessage.includes('test') || lowerMessage.includes('testing') || lowerMessage.includes('qa') || lowerMessage.includes('bug')) {
            return 'qa';
        } else if (lowerMessage.includes('deploy') || lowerMessage.includes('ci/cd') || lowerMessage.includes('pipeline') || lowerMessage.includes('docker')) {
            return 'devops';
        } else if (lowerMessage.includes('user story') || lowerMessage.includes('requirement') || lowerMessage.includes('analysis') || lowerMessage.includes('business')) {
            return 'analyst';
        } else if (lowerMessage.includes('github') || lowerMessage.includes('jira') || lowerMessage.includes('confluence') || lowerMessage.includes('jenkins')) {
            return 'integration';
        } else {
            return 'general';
        }
    }

    /**
     * Format AI response based on agent type
     */
    formatAIResponse(response, agentType) {
        const agentPrefixes = {
            developer: '💻 **Software Developer Agent**\n\n',
            qa: '🧪 **QA Engineer Agent**\n\n',
            devops: '🚀 **DevOps Engineer Agent**\n\n',
            analyst: '📊 **Business Analyst Agent**\n\n',
            integration: '🔗 **Integration Specialist Agent**\n\n',
            general: '🤖 **AI Assistant**\n\n',
            error: '❌ **Error**\n\n'
        };

        const prefix = agentPrefixes[agentType] || agentPrefixes.general;
        return prefix + response;
    }

    /**
     * Add message to UI
     */
    addMessageToUI(type, content, agentType = null) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        const avatarClass = type === 'user' ? 'user-avatar' : 'ai-avatar';
        const avatarContent = type === 'user' ? '👤' : '🤖';
        const senderName = type === 'user' ? 'You' : this.getAgentName(agentType);

        messageElement.innerHTML = `
            <div class="${avatarClass}">${avatarContent}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${senderName}${agentType && agentType !== 'general' ? `<span class="agent-badge">${agentType.toUpperCase()}</span>` : ''}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-text">${this.formatMessageContent(content)}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // Store message
        this.chatMessages.push({
            type,
            content,
            agentType,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Format message content (markdown-like formatting)
     */
    formatMessageContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Create new chat session
     */
    async createNewSession() {
        try {
            if (this.conversationDB) {
                const session = await this.conversationDB.createConversation({
                    title: 'New Chat',
                    type: 'ai-assistant',
                    metadata: {
                        agentTypes: [],
                        projectContext: null
                    }
                });
                
                this.currentSessionId = session.id;
                this.clearChatMessages();
                this.loadSessions();
                this.hideSessionsPanel();
            }
        } catch (error) {
            console.error('Failed to create new session:', error);
        }
    }

    /**
     * Load all sessions
     */
    async loadSessions() {
        try {
            if (this.conversationDB) {
                const sessions = await this.conversationDB.getConversations();
                this.renderSessionsList(sessions);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    /**
     * Render sessions list
     */
    renderSessionsList(sessions) {
        const sessionsList = document.getElementById('sessions-list');
        if (!sessionsList) return;

        sessionsList.innerHTML = '';

        sessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session-item';
            if (session.id === this.currentSessionId) {
                sessionElement.classList.add('active');
            }

            const lastMessage = session.messages && session.messages.length > 0 
                ? session.messages[session.messages.length - 1].content.substring(0, 50) + '...'
                : 'No messages yet';

            sessionElement.innerHTML = `
                <div class="session-title">${session.title}</div>
                <div class="session-preview">${lastMessage}</div>
                <div class="session-date">${new Date(session.createdAt).toLocaleDateString()}</div>
            `;

            sessionElement.addEventListener('click', () => {
                this.loadSession(session.id);
            });

            sessionsList.appendChild(sessionElement);
        });
    }

    /**
     * Load specific session
     */
    async loadSession(sessionId) {
        try {
            if (this.conversationDB) {
                const conversation = await this.conversationDB.getConversation(sessionId);
                if (conversation) {
                    this.currentSessionId = sessionId;
                    this.clearChatMessages();
                    
                    // Load messages
                    if (conversation.messages) {
                        conversation.messages.forEach(message => {
                            this.addMessageToUI(
                                message.role === 'user' ? 'user' : 'ai',
                                message.content,
                                message.agentType
                            );
                        });
                    }
                    
                    this.loadSessions(); // Refresh to update active state
                    this.hideSessionsPanel();
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    }

    /**
     * Update session title based on first message
     */
    async updateSessionTitle(message) {
        try {
            if (this.currentSessionId && this.conversationDB) {
                const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
                await this.conversationDB.updateConversation(this.currentSessionId, {
                    title: title
                });
                this.loadSessions();
            }
        } catch (error) {
            console.error('Failed to update session title:', error);
        }
    }

    /**
     * Clear chat messages (UI only)
     */
    clearChatMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="ai-avatar">🤖</div>
                <div class="message-content">
                    <h4>Welcome to AI Agent Assistant!</h4>
                    <p>I'm your AI-powered SDLC assistant. How can I help you today?</p>
                </div>
            </div>
        `;
        
        this.chatMessages = [];
    }

    /**
     * Toggle sessions panel
     */
    toggleSessionsPanel() {
        const sidebar = document.getElementById('chat-sessions-sidebar');
        sidebar.classList.toggle('open');
    }

    /**
     * Hide sessions panel
     */
    hideSessionsPanel() {
        const sidebar = document.getElementById('chat-sessions-sidebar');
        sidebar.classList.remove('open');
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        this.isTyping = true;
        document.getElementById('typing-indicator').style.display = 'flex';
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        this.isTyping = false;
        document.getElementById('typing-indicator').style.display = 'none';
    }

    /**
     * Update send button state
     */
    updateSendButton(enabled) {
        const sendBtn = document.getElementById('send-message');
        sendBtn.disabled = !enabled || this.isTyping;
    }

    /**
     * Auto-resize input textarea
     */
    autoResizeInput() {
        const input = document.getElementById('chat-input');
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * Show attach options
     */
    showAttachOptions() {
        const attachOptions = document.getElementById('attach-options');
        attachOptions.style.display = attachOptions.style.display === 'none' ? 'block' : 'none';
        
        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#attach-btn') && !e.target.closest('#attach-options')) {
                attachOptions.style.display = 'none';
            }
        });
    }

    /**
     * Get agent name from type
     */
    getAgentName(agentType) {
        const agentNames = {
            developer: 'AI Developer',
            qa: 'QA Engineer',
            devops: 'DevOps Engineer',
            analyst: 'Business Analyst',
            integration: 'Integration Specialist',
            general: 'AI Assistant',
            error: 'System'
        };

        return agentNames[agentType] || 'AI Assistant';
    }

    /**
     * Show error message
     */
    showError(message) {
        this.addMessageToUI('ai', `❌ **Error**: ${message}`, 'error');
    }
}

// Export for use in other modules
window.AIChatInterface = AIChatInterface;
export default AIChatInterface;