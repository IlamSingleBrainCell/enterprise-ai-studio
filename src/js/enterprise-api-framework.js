/**
 * Enterprise API Connector Framework
 * Centralized framework for managing enterprise service integrations
 */

class EnterpriseAPIFramework {
    constructor() {
        this.connectors = new Map();
        this.cache = new Map();
        this.rateLimits = new Map();
        this.authTokens = new Map();
        this.initialized = false;
        
        // Global configuration
        this.config = {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            cacheTimeout: 300000, // 5 minutes
            rateLimitWindow: 60000, // 1 minute
            maxRequestsPerWindow: 100
        };
        
        // Event system for notifications
        this.eventListeners = new Map();
    }

    /**
     * Initialize the API framework
     */
    async initialize() {
        try {
            // Load configuration from storage
            await this.loadConfiguration();
            
            // Initialize rate limiting
            this.initializeRateLimiting();
            
            // Start cache cleanup
            this.startCacheCleanup();
            
            this.initialized = true;
            this.emit('framework:initialized');
            
            return true;
        } catch (error) {
            this.emit('framework:error', { type: 'initialization', error });
            return false;
        }
    }

    /**
     * Register a new API connector
     */
    registerConnector(name, connector) {
        if (!connector.authenticate || !connector.request) {
            throw new Error(`Connector ${name} must implement authenticate() and request() methods`);
        }
        
        this.connectors.set(name, connector);
        this.rateLimits.set(name, { requests: [], limit: this.config.maxRequestsPerWindow });
        
        this.emit('connector:registered', { name, connector });
    }

    /**
     * Get a registered connector
     */
    getConnector(name) {
        return this.connectors.get(name);
    }

    /**
     * Universal API request method with built-in features
     */
    async request(connectorName, endpoint, options = {}) {
        try {
            // Check if connector exists
            const connector = this.connectors.get(connectorName);
            if (!connector) {
                throw new Error(`Connector ${connectorName} not found`);
            }

            // Check rate limits
            if (!this.checkRateLimit(connectorName)) {
                throw new Error(`Rate limit exceeded for ${connectorName}`);
            }

            // Check cache first
            const cacheKey = this.generateCacheKey(connectorName, endpoint, options);
            if (options.useCache !== false) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    this.emit('request:cache-hit', { connectorName, endpoint });
                    return cached;
                }
            }

            // Ensure authentication
            await this.ensureAuthentication(connectorName);

            // Record rate limit
            this.recordRequest(connectorName);

            // Make the request with retry logic
            const response = await this.makeRequestWithRetry(connector, endpoint, options);

            // Cache the response
            if (options.cache !== false && response) {
                this.setCache(cacheKey, response);
            }

            this.emit('request:success', { connectorName, endpoint, response });
            return response;

        } catch (error) {
            this.emit('request:error', { connectorName, endpoint, error });
            throw error;
        }
    }

    /**
     * Ensure connector is authenticated
     */
    async ensureAuthentication(connectorName) {
        const connector = this.connectors.get(connectorName);
        const tokenKey = `${connectorName}_token`;
        
        // Check if we have a valid token
        let token = this.authTokens.get(tokenKey);
        if (!token || this.isTokenExpired(token)) {
            // Authenticate
            token = await connector.authenticate();
            this.authTokens.set(tokenKey, {
                ...token,
                timestamp: Date.now()
            });
            
            this.emit('auth:refreshed', { connectorName });
        }
        
        return token;
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        if (!token.expiresIn) return false;
        return (Date.now() - token.timestamp) > (token.expiresIn * 1000);
    }

    /**
     * Make request with retry logic
     */
    async makeRequestWithRetry(connector, endpoint, options, attempt = 1) {
        try {
            const requestOptions = {
                timeout: this.config.timeout,
                ...options
            };

            return await connector.request(endpoint, requestOptions);

        } catch (error) {
            if (attempt < this.config.retryAttempts && this.isRetryableError(error)) {
                const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                await this.sleep(delay);
                return this.makeRequestWithRetry(connector, endpoint, options, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        const retryableCodes = [429, 500, 502, 503, 504];
        return retryableCodes.includes(error.status) || error.code === 'NETWORK_ERROR';
    }

    /**
     * Rate limiting implementation
     */
    checkRateLimit(connectorName) {
        const rateLimit = this.rateLimits.get(connectorName);
        if (!rateLimit) return true;

        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        
        // Clean old requests
        rateLimit.requests = rateLimit.requests.filter(time => time > windowStart);
        
        return rateLimit.requests.length < rateLimit.limit;
    }

    /**
     * Record a request for rate limiting
     */
    recordRequest(connectorName) {
        const rateLimit = this.rateLimits.get(connectorName);
        if (rateLimit) {
            rateLimit.requests.push(Date.now());
        }
    }

    /**
     * Initialize rate limiting
     */
    initializeRateLimiting() {
        // Clean up rate limit records every minute
        setInterval(() => {
            const now = Date.now();
            const windowStart = now - this.config.rateLimitWindow;
            
            this.rateLimits.forEach((rateLimit) => {
                rateLimit.requests = rateLimit.requests.filter(time => time > windowStart);
            });
        }, 60000);
    }

    /**
     * Cache management
     */
    generateCacheKey(connectorName, endpoint, options) {
        const key = `${connectorName}:${endpoint}:${JSON.stringify(options)}`;
        return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            const expiredKeys = [];
            
            this.cache.forEach((value, key) => {
                if ((now - value.timestamp) > this.config.cacheTimeout) {
                    expiredKeys.push(key);
                }
            });
            
            expiredKeys.forEach(key => this.cache.delete(key));
            
            if (expiredKeys.length > 0) {
                this.emit('cache:cleanup', { removedCount: expiredKeys.length });
            }
        }, this.config.cacheTimeout);
    }

    /**
     * Load configuration from storage
     */
    async loadConfiguration() {
        try {
            const stored = localStorage.getItem('enterprise-api-config');
            if (stored) {
                const config = JSON.parse(stored);
                this.config = { ...this.config, ...config };
            }
        } catch (error) {
            // Use default configuration
        }
    }

    /**
     * Save configuration to storage
     */
    async saveConfiguration() {
        try {
            localStorage.setItem('enterprise-api-config', JSON.stringify(this.config));
        } catch (error) {
            this.emit('config:save-error', { error });
        }
    }

    /**
     * Update configuration
     */
    updateConfiguration(updates) {
        this.config = { ...this.config, ...updates };
        this.saveConfiguration();
        this.emit('config:updated', { config: this.config });
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    // Prevent callback errors from breaking the framework
                }
            });
        }
    }

    /**
     * Health check for all connectors
     */
    async healthCheck() {
        const results = {};
        
        for (const [name, connector] of this.connectors) {
            try {
                const start = Date.now();
                
                if (connector.healthCheck) {
                    await connector.healthCheck();
                } else {
                    // Default health check - try a simple request
                    await this.ensureAuthentication(name);
                }
                
                const duration = Date.now() - start;
                results[name] = {
                    status: 'healthy',
                    responseTime: duration,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                results[name] = {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        this.emit('health:check-complete', results);
        return results;
    }

    /**
     * Get framework statistics
     */
    getStatistics() {
        const stats = {
            connectors: this.connectors.size,
            cacheSize: this.cache.size,
            rateLimits: {},
            authTokens: this.authTokens.size,
            uptime: Date.now() - (this.initTime || Date.now())
        };

        // Rate limit statistics
        this.rateLimits.forEach((rateLimit, name) => {
            stats.rateLimits[name] = {
                requestsInWindow: rateLimit.requests.length,
                limit: rateLimit.limit,
                utilization: (rateLimit.requests.length / rateLimit.limit) * 100
            };
        });

        return stats;
    }

    /**
     * Utility methods
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear all intervals and timeouts
        this.cache.clear();
        this.rateLimits.clear();
        this.authTokens.clear();
        this.eventListeners.clear();
        this.connectors.clear();
        
        this.initialized = false;
        this.emit('framework:destroyed');
    }
}

/**
 * Abstract base class for all connectors
 */
class BaseConnector {
    constructor(config) {
        this.config = config;
        this.authenticated = false;
        this.lastAuthTime = null;
    }

    /**
     * Must be implemented by each connector
     */
    async authenticate() {
        throw new Error('authenticate() method must be implemented');
    }

    async request(endpoint, options) {
        throw new Error('request() method must be implemented');
    }

    /**
     * Optional health check method
     */
    async healthCheck() {
        // Default implementation
        return { status: 'ok' };
    }

    /**
     * Helper method for making HTTP requests
     */
    async makeHttpRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Helper method for handling authentication headers
     */
    getAuthHeaders(token) {
        if (typeof token === 'string') {
            return { 'Authorization': `Bearer ${token}` };
        } else if (token && token.access_token) {
            return { 'Authorization': `Bearer ${token.access_token}` };
        }
        return {};
    }
}

// Export for use in other modules
window.EnterpriseAPIFramework = EnterpriseAPIFramework;
window.BaseConnector = BaseConnector;
export { EnterpriseAPIFramework, BaseConnector };