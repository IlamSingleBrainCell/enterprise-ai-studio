/**
 * Conversation Database System
 * JSON-based persistent storage for AI conversations and project context
 */

class ConversationDatabase {
    constructor() {
        this.dbName = 'macquarie_ai_conversations';
        this.version = 1;
        this.conversations = new Map();
        this.projects = new Map();
        this.sessions = new Map();
        this.isInitialized = false;
        
        // Initialize IndexedDB for browser-based persistence
        this.initializeDB();
    }

    /**
     * Initialize the database
     */
    async initializeDB() {
        try {
            // For browser environment, use IndexedDB
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
                await this.initIndexedDB();
            } else {
                // Fallback to localStorage for development
                this.initLocalStorage();
            }
            
            this.isInitialized = true;
            console.log('Conversation Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize conversation database:', error);
            this.initLocalStorage(); // Fallback
            this.isInitialized = true;
        }
    }

    /**
     * Initialize IndexedDB for production
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('conversations')) {
                    const conversationStore = db.createObjectStore('conversations', { keyPath: 'sessionId' });
                    conversationStore.createIndex('projectId', 'projectId', { unique: false });
                    conversationStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'projectId' });
                    projectStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
                    sessionStore.createIndex('projectId', 'projectId', { unique: false });
                }
            };
        });
    }

    /**
     * Fallback to localStorage
     */
    initLocalStorage() {
        const stored = localStorage.getItem(this.dbName);
        if (stored) {
            const data = JSON.parse(stored);
            this.conversations = new Map(data.conversations || []);
            this.projects = new Map(data.projects || []);
            this.sessions = new Map(data.sessions || []);
        }
    }

    /**
     * Create a new conversation session
     */
    async createSession(projectId = null, sessionName = null) {
        const sessionId = this.generateUUID();
        const session = {
            sessionId,
            projectId: projectId || this.generateUUID(),
            sessionName: sessionName || `Session ${new Date().toLocaleString()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            metadata: {
                userAgent: navigator?.userAgent || 'Unknown',
                platform: navigator?.platform || 'Unknown'
            }
        };

        // Initialize conversation for this session
        const conversation = {
            sessionId,
            projectId: session.projectId,
            messages: [],
            projectContext: {
                requirements: {},
                architecture: {},
                codebase: {},
                compliance: {},
                artifacts: []
            },
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };

        await this.saveSession(session);
        await this.saveConversation(conversation);
        
        return sessionId;
    }

    /**
     * Add message to conversation
     */
    async addMessage(sessionId, message) {
        const conversation = await this.getConversation(sessionId);
        if (!conversation) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const messageObj = {
            id: this.generateUUID(),
            sessionId,
            type: message.type || 'user', // user, agent, system
            agentType: message.agentType || null, // requirements, design, build, rcm
            content: message.content,
            artifacts: message.artifacts || [],
            metadata: message.metadata || {},
            timestamp: new Date().toISOString()
        };

        conversation.messages.push(messageObj);
        conversation.updatedAt = new Date().toISOString();

        await this.saveConversation(conversation);
        return messageObj;
    }

    /**
     * Update project context
     */
    async updateProjectContext(sessionId, contextType, data) {
        const conversation = await this.getConversation(sessionId);
        if (!conversation) {
            throw new Error(`Session ${sessionId} not found`);
        }

        conversation.projectContext[contextType] = {
            ...conversation.projectContext[contextType],
            ...data,
            updatedAt: new Date().toISOString()
        };

        conversation.updatedAt = new Date().toISOString();
        await this.saveConversation(conversation);
        
        return conversation.projectContext[contextType];
    }

    /**
     * Add artifact (generated code, documents, etc.)
     */
    async addArtifact(sessionId, artifact) {
        const conversation = await this.getConversation(sessionId);
        if (!conversation) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const artifactObj = {
            id: this.generateUUID(),
            type: artifact.type, // code, document, config, etc.
            name: artifact.name,
            content: artifact.content,
            language: artifact.language || null,
            path: artifact.path || null,
            agentType: artifact.agentType || null,
            createdAt: new Date().toISOString()
        };

        conversation.projectContext.artifacts.push(artifactObj);
        conversation.updatedAt = new Date().toISOString();

        await this.saveConversation(conversation);
        return artifactObj;
    }

    /**
     * Get conversation by session ID
     */
    async getConversation(sessionId) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['conversations'], 'readonly');
                const store = transaction.objectStore('conversations');
                const request = store.get(sessionId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            return this.conversations.get(sessionId);
        }
    }

    /**
     * Get all conversations for a project
     */
    async getProjectConversations(projectId) {
        const conversations = [];
        
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['conversations'], 'readonly');
                const store = transaction.objectStore('conversations');
                const index = store.index('projectId');
                const request = index.getAll(projectId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            for (const [_, conversation] of this.conversations) {
                if (conversation.projectId === projectId) {
                    conversations.push(conversation);
                }
            }
            return conversations;
        }
    }

    /**
     * Get conversation history for context
     */
    async getConversationContext(sessionId, messageLimit = 20) {
        const conversation = await this.getConversation(sessionId);
        if (!conversation) return null;

        return {
            sessionId,
            projectId: conversation.projectId,
            recentMessages: conversation.messages.slice(-messageLimit),
            projectContext: conversation.projectContext,
            totalMessages: conversation.messages.length
        };
    }

    /**
     * Search conversations
     */
    async searchConversations(query, projectId = null) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        if (this.db) {
            // IndexedDB search implementation
            const conversations = await this.getAllConversations();
            for (const conversation of conversations) {
                if (projectId && conversation.projectId !== projectId) continue;
                
                for (const message of conversation.messages) {
                    if (message.content.toLowerCase().includes(searchTerm)) {
                        results.push({
                            sessionId: conversation.sessionId,
                            projectId: conversation.projectId,
                            message,
                            relevance: this.calculateRelevance(message.content, searchTerm)
                        });
                    }
                }
            }
        } else {
            // localStorage search
            for (const [_, conversation] of this.conversations) {
                if (projectId && conversation.projectId !== projectId) continue;
                
                for (const message of conversation.messages) {
                    if (message.content.toLowerCase().includes(searchTerm)) {
                        results.push({
                            sessionId: conversation.sessionId,
                            projectId: conversation.projectId,
                            message,
                            relevance: this.calculateRelevance(message.content, searchTerm)
                        });
                    }
                }
            }
        }
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    /**
     * Save conversation
     */
    async saveConversation(conversation) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['conversations'], 'readwrite');
                const store = transaction.objectStore('conversations');
                const request = store.put(conversation);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            this.conversations.set(conversation.sessionId, conversation);
            this.saveToLocalStorage();
        }
    }

    /**
     * Save session
     */
    async saveSession(session) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['sessions'], 'readwrite');
                const store = transaction.objectStore('sessions');
                const request = store.put(session);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            this.sessions.set(session.sessionId, session);
            this.saveToLocalStorage();
        }
    }

    /**
     * Save to localStorage (fallback)
     */
    saveToLocalStorage() {
        const data = {
            conversations: Array.from(this.conversations.entries()),
            projects: Array.from(this.projects.entries()),
            sessions: Array.from(this.sessions.entries())
        };
        localStorage.setItem(this.dbName, JSON.stringify(data));
    }

    /**
     * Calculate search relevance
     */
    calculateRelevance(content, searchTerm) {
        const contentLower = content.toLowerCase();
        const termLower = searchTerm.toLowerCase();
        
        let score = 0;
        const words = contentLower.split(/\s+/);
        
        for (const word of words) {
            if (word === termLower) score += 10;
            else if (word.includes(termLower)) score += 5;
            else if (termLower.includes(word)) score += 2;
        }
        
        return score;
    }

    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get database statistics
     */
    async getStats() {
        let totalConversations = 0;
        let totalMessages = 0;
        let totalArtifacts = 0;

        if (this.db) {
            const conversations = await this.getAllConversations();
            totalConversations = conversations.length;
            for (const conv of conversations) {
                totalMessages += conv.messages.length;
                totalArtifacts += conv.projectContext.artifacts.length;
            }
        } else {
            totalConversations = this.conversations.size;
            for (const [_, conv] of this.conversations) {
                totalMessages += conv.messages.length;
                totalArtifacts += conv.projectContext.artifacts.length;
            }
        }

        return {
            totalConversations,
            totalMessages,
            totalArtifacts,
            totalProjects: this.projects.size,
            totalSessions: this.sessions.size
        };
    }

    /**
     * Get all conversations
     */
    async getAllConversations() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['conversations'], 'readonly');
                const store = transaction.objectStore('conversations');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            return Array.from(this.conversations.values());
        }
    }
}

// Export for use in other modules
window.ConversationDatabase = ConversationDatabase;
export default ConversationDatabase;