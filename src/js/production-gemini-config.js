/**
 * Production Gemini API Configuration
 * Enhanced API management with security, rate limiting, and error handling
 */

class ProductionGeminiConfig {
    constructor() {
        // Use the provided production API key
        this.apiKey = 'AIzaSyC6JpuPJPjZyLnNOs0peWh47K7MVPR7NOk';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.rateLimitQueue = [];
        this.requestCount = 0;
        this.maxRequestsPerMinute = 60;
        this.lastResetTime = Date.now();
        this.isConfigured = true; // Set to true since we have the API key
        
        this.init();
    }

    init() {
        // Check for stored API key
        this.loadConfiguration();
        this.setupRateLimiting();
    }

    /**
     * Load configuration from secure storage
     */
    loadConfiguration() {
        try {
            // Check localStorage for encrypted API key
            const encryptedKey = localStorage.getItem('gemini_api_key_encrypted');
            if (encryptedKey) {
                this.apiKey = this.decryptApiKey(encryptedKey);
                this.isConfigured = true;
            }

            // Load other settings
            const settings = JSON.parse(localStorage.getItem('gemini_settings') || '{}');
            this.maxRequestsPerMinute = settings.rateLimitRpm || 60;
            
        } catch (error) {
            console.warn('Failed to load Gemini configuration:', error);
        }
    }

    /**
     * Configure API with user-provided key
     */
    async configureAPI(apiKey, settings = {}) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Valid API key is required');
        }

        // Validate API key format
        if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
            throw new Error('Invalid Gemini API key format');
        }

        // Test the API key
        const isValid = await this.validateApiKey(apiKey);
        if (!isValid) {
            throw new Error('API key validation failed');
        }

        // Store encrypted key
        const encryptedKey = this.encryptApiKey(apiKey);
        localStorage.setItem('gemini_api_key_encrypted', encryptedKey);
        
        // Store settings
        const geminiSettings = {
            rateLimitRpm: settings.rateLimitRpm || 60,
            maxTokens: settings.maxTokens || 2048,
            temperature: settings.temperature || 0.7,
            configuredAt: new Date().toISOString()
        };
        localStorage.setItem('gemini_settings', JSON.stringify(geminiSettings));

        this.apiKey = apiKey;
        this.maxRequestsPerMinute = geminiSettings.rateLimitRpm;
        this.isConfigured = true;

        return true;
    }

    /**
     * Validate API key by making a test request
     */
    async validateApiKey(apiKey) {
        try {
            const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Test connection' }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 10,
                        temperature: 0.1
                    }
                })
            });

            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Simple encryption for API key storage
     */
    encryptApiKey(apiKey) {
        // Simple XOR encryption with timestamp salt
        const salt = Date.now().toString();
        let encrypted = '';
        for (let i = 0; i < apiKey.length; i++) {
            encrypted += String.fromCharCode(
                apiKey.charCodeAt(i) ^ salt.charCodeAt(i % salt.length)
            );
        }
        return btoa(salt + '|' + encrypted);
    }

    /**
     * Decrypt API key from storage
     */
    decryptApiKey(encryptedKey) {
        try {
            const decoded = atob(encryptedKey);
            const [salt, encrypted] = decoded.split('|');
            
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                decrypted += String.fromCharCode(
                    encrypted.charCodeAt(i) ^ salt.charCodeAt(i % salt.length)
                );
            }
            return decrypted;
        } catch (error) {
            throw new Error('Failed to decrypt API key');
        }
    }

    /**
     * Setup rate limiting mechanism
     */
    setupRateLimiting() {
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastResetTime >= 60000) { // Reset every minute
                this.requestCount = 0;
                this.lastResetTime = now;
                this.processQueue();
            }
        }, 1000);
    }

    /**
     * Process queued requests
     */
    processQueue() {
        while (this.rateLimitQueue.length > 0 && this.requestCount < this.maxRequestsPerMinute) {
            const queuedRequest = this.rateLimitQueue.shift();
            this.executeRequest(queuedRequest);
        }
    }

    /**
     * Make rate-limited API request
     */
    async makeRequest(prompt, options = {}) {
        if (!this.isConfigured || !this.apiKey) {
            throw new Error('Gemini API not configured. Please set up your API key.');
        }

        return new Promise((resolve, reject) => {
            const request = {
                prompt,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            };

            if (this.requestCount < this.maxRequestsPerMinute) {
                this.executeRequest(request);
            } else {
                this.rateLimitQueue.push(request);
            }
        });
    }

    /**
     * Execute API request
     */
    async executeRequest(request) {
        this.requestCount++;
        
        try {
            const requestBody = {
                contents: [{
                    parts: [{ text: request.prompt }]
                }],
                generationConfig: {
                    maxOutputTokens: request.options.maxTokens || 2048,
                    temperature: request.options.temperature || 0.7,
                    candidateCount: 1
                }
            };

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const result = data.candidates[0].content.parts[0].text;
                request.resolve(result);
            } else {
                throw new Error('Invalid response format from Gemini API');
            }

        } catch (error) {
            request.reject(error);
        }
    }

    /**
     * Clear configuration and stored data
     */
    clearConfiguration() {
        localStorage.removeItem('gemini_api_key_encrypted');
        localStorage.removeItem('gemini_settings');
        this.apiKey = null;
        this.isConfigured = false;
        this.requestCount = 0;
        this.rateLimitQueue = [];
    }

    /**
     * Get configuration status
     */
    getStatus() {
        const settings = JSON.parse(localStorage.getItem('gemini_settings') || '{}');
        return {
            isConfigured: this.isConfigured,
            rateLimitRpm: this.maxRequestsPerMinute,
            currentRequestCount: this.requestCount,
            queueLength: this.rateLimitQueue.length,
            configuredAt: settings.configuredAt || null,
            hasValidKey: !!this.apiKey
        };
    }
}

// Export for use in other modules
window.ProductionGeminiConfig = ProductionGeminiConfig;
export default ProductionGeminiConfig;