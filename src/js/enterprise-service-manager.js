/**
 * Enterprise Service Manager
 * Orchestrates all enterprise API connectors and provides unified interface
 */

import { EnterpriseAPIFramework } from './enterprise-api-framework.js';
import GitHubEnterpriseConnector from './github-enterprise-connector.js';
import JIRAAgileConnector from './jira-agile-connector.js';
import ConfluenceConnector from './confluence-connector.js';
import JenkinsConnector from './jenkins-connector.js';
import DockerConnector from './docker-connector.js';
import AWSConnector from './aws-connector.js';
import AzureConnector from './azure-connector.js';
import GCPConnector from './gcp-connector.js';

class EnterpriseServiceManager {
    constructor() {
        this.framework = new EnterpriseAPIFramework();
        this.connectors = new Map();
        this.configurations = new Map();
        this.initialized = false;
        
        // Service mappings
        this.serviceTypes = {
            'github': GitHubEnterpriseConnector,
            'jira': JIRAAgileConnector,
            'confluence': ConfluenceConnector,
            'jenkins': JenkinsConnector,
            'docker': DockerConnector,
            'aws': AWSConnector,
            'azure': AzureConnector,
            'gcp': GCPConnector
        };
        
        // Status tracking
        this.serviceStatus = new Map();
        this.lastHealthCheck = null;
        
        // Event handlers
        this.eventHandlers = new Map();
    }

    /**
     * Initialize the Enterprise Service Manager
     */
    async initialize() {
        try {
            // Initialize the API framework
            await this.framework.initialize();
            
            // Load configurations
            await this.loadConfigurations();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            this.emit('manager:initialized');
            
            return true;
        } catch (error) {
            this.emit('manager:error', { type: 'initialization', error });
            throw error;
        }
    }

    /**
     * Setup event listeners for the framework
     */
    setupEventListeners() {
        this.framework.on('request:success', (data) => {
            this.emit('service:request-success', data);
        });

        this.framework.on('request:error', (data) => {
            this.emit('service:request-error', data);
        });

        this.framework.on('auth:refreshed', (data) => {
            this.emit('service:auth-refreshed', data);
        });
    }

    /**
     * Configure a service connector
     */
    async configureService(serviceType, serviceName, config) {
        try {
            if (!this.serviceTypes[serviceType]) {
                throw new Error(`Unknown service type: ${serviceType}`);
            }

            // Store configuration
            this.configurations.set(serviceName, {
                type: serviceType,
                config,
                enabled: config.enabled !== false
            });

            // Create and register connector if enabled
            if (config.enabled !== false) {
                const ConnectorClass = this.serviceTypes[serviceType];
                const connector = new ConnectorClass(config);
                
                this.framework.registerConnector(serviceName, connector);
                this.connectors.set(serviceName, connector);
                
                // Test connection
                await connector.authenticate();
                
                this.serviceStatus.set(serviceName, {
                    status: 'connected',
                    lastConnect: Date.now(),
                    error: null
                });
                
                this.emit('service:configured', { serviceName, serviceType });
            }

            // Save configurations
            await this.saveConfigurations();
            
            return true;
        } catch (error) {
            this.serviceStatus.set(serviceName, {
                status: 'error',
                lastConnect: null,
                error: error.message
            });
            
            this.emit('service:configuration-error', { serviceName, error });
            throw error;
        }
    }

    /**
     * Enable a service
     */
    async enableService(serviceName) {
        const config = this.configurations.get(serviceName);
        if (!config) {
            throw new Error(`Service ${serviceName} not found`);
        }

        config.enabled = true;
        return await this.configureService(config.type, serviceName, config.config);
    }

    /**
     * Disable a service
     */
    async disableService(serviceName) {
        const config = this.configurations.get(serviceName);
        if (config) {
            config.enabled = false;
        }

        // Remove from framework
        this.framework.connectors.delete(serviceName);
        this.connectors.delete(serviceName);
        
        this.serviceStatus.set(serviceName, {
            status: 'disabled',
            lastConnect: null,
            error: null
        });

        await this.saveConfigurations();
        this.emit('service:disabled', { serviceName });
    }

    /**
     * Get service connector
     */
    getService(serviceName) {
        return this.connectors.get(serviceName);
    }

    /**
     * Make a request through any service
     */
    async request(serviceName, endpoint, options = {}) {
        return await this.framework.request(serviceName, endpoint, options);
    }

    /**
     * Health check all services
     */
    async healthCheckAll() {
        const results = await this.framework.healthCheck();
        this.lastHealthCheck = Date.now();
        
        // Update service status
        Object.entries(results).forEach(([serviceName, result]) => {
            this.serviceStatus.set(serviceName, {
                status: result.status,
                lastCheck: this.lastHealthCheck,
                responseTime: result.responseTime,
                error: result.error || null
            });
        });

        this.emit('health:check-complete', results);
        return results;
    }

    /**
     * Get all service statuses
     */
    getServiceStatuses() {
        const statuses = {};
        this.serviceStatus.forEach((status, serviceName) => {
            statuses[serviceName] = {
                ...status,
                configured: this.configurations.has(serviceName),
                enabled: this.configurations.get(serviceName)?.enabled || false
            };
        });
        return statuses;
    }

    /**
     * Load configurations from storage
     */
    async loadConfigurations() {
        try {
            const stored = localStorage.getItem('enterprise-service-configs');
            if (stored) {
                const configs = JSON.parse(stored);
                
                for (const [serviceName, serviceConfig] of Object.entries(configs)) {
                    this.configurations.set(serviceName, serviceConfig);
                    
                    // Auto-configure enabled services
                    if (serviceConfig.enabled) {
                        try {
                            await this.configureService(serviceConfig.type, serviceName, serviceConfig.config);
                        } catch (error) {
                            // Service will be marked as error in status
                        }
                    }
                }
            }
        } catch (error) {
            this.emit('config:load-error', { error });
        }
    }

    /**
     * Save configurations to storage
     */
    async saveConfigurations() {
        try {
            const configs = {};
            this.configurations.forEach((config, serviceName) => {
                configs[serviceName] = config;
            });
            
            localStorage.setItem('enterprise-service-configs', JSON.stringify(configs));
            this.emit('config:saved');
        } catch (error) {
            this.emit('config:save-error', { error });
        }
    }

    /**
     * Integrated workflow methods
     */

    /**
     * Create a new project across multiple services
     */
    async createProject(projectData) {
        const results = {};
        const errors = [];

        try {
            // Create in GitHub if configured
            if (this.connectors.has('github')) {
                try {
                    const githubResult = await this.getService('github').createRepository({
                        name: projectData.name,
                        description: projectData.description,
                        private: projectData.private !== false
                    });
                    results.github = githubResult;
                } catch (error) {
                    errors.push({ service: 'github', error: error.message });
                }
            }

            // Create in JIRA if configured
            if (this.connectors.has('jira')) {
                try {
                    const jiraResult = await this.getService('jira').createProject({
                        key: projectData.key || projectData.name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 10),
                        name: projectData.name,
                        description: projectData.description,
                        leadAccountId: projectData.leadAccountId
                    });
                    results.jira = jiraResult;
                } catch (error) {
                    errors.push({ service: 'jira', error: error.message });
                }
            }

            // Create in Confluence if configured
            if (this.connectors.has('confluence')) {
                try {
                    const confluenceResult = await this.getService('confluence').createSpace({
                        key: projectData.key || projectData.name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 10),
                        name: `${projectData.name} Documentation`,
                        description: `Documentation space for ${projectData.name}`
                    });
                    results.confluence = confluenceResult;
                } catch (error) {
                    errors.push({ service: 'confluence', error: error.message });
                }
            }

            this.emit('project:created', { projectData, results, errors });
            
            return {
                success: Object.keys(results).length > 0,
                results,
                errors
            };

        } catch (error) {
            this.emit('project:creation-error', { projectData, error });
            throw error;
        }
    }

    /**
     * Synchronize project data across services
     */
    async synchronizeProject(projectIdentifier) {
        const syncResults = {};
        
        try {
            // Get project data from all services
            if (this.connectors.has('github')) {
                try {
                    syncResults.github = await this.getService('github').getRepository(projectIdentifier);
                } catch (error) {
                    syncResults.github = { error: error.message };
                }
            }

            if (this.connectors.has('jira')) {
                try {
                    syncResults.jira = await this.getService('jira').getProject(projectIdentifier);
                } catch (error) {
                    syncResults.jira = { error: error.message };
                }
            }

            if (this.connectors.has('confluence')) {
                try {
                    syncResults.confluence = await this.getService('confluence').getSpace(projectIdentifier);
                } catch (error) {
                    syncResults.confluence = { error: error.message };
                }
            }

            this.emit('project:synchronized', { projectIdentifier, syncResults });
            return syncResults;

        } catch (error) {
            this.emit('project:sync-error', { projectIdentifier, error });
            throw error;
        }
    }

    /**
     * Get unified project dashboard data
     */
    async getProjectDashboard(projectIdentifier) {
        const dashboard = {
            project: projectIdentifier,
            timestamp: new Date().toISOString(),
            services: {},
            summary: {}
        };

        try {
            // GitHub data
            if (this.connectors.has('github')) {
                try {
                    const [repo, commits, prs, issues] = await Promise.all([
                        this.getService('github').getRepository(projectIdentifier),
                        this.getService('github').getCommits(projectIdentifier, { perPage: 10 }),
                        this.getService('github').getPullRequests(projectIdentifier),
                        this.getService('github').getIssues(projectIdentifier)
                    ]);

                    dashboard.services.github = {
                        repository: repo,
                        recentCommits: commits.length,
                        openPRs: prs.length,
                        openIssues: issues.length,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count
                    };
                } catch (error) {
                    dashboard.services.github = { error: error.message };
                }
            }

            // JIRA data
            if (this.connectors.has('jira')) {
                try {
                    const projectStats = await this.getService('jira').getProjectStatistics(projectIdentifier);
                    dashboard.services.jira = projectStats;
                } catch (error) {
                    dashboard.services.jira = { error: error.message };
                }
            }

            // Confluence data
            if (this.connectors.has('confluence')) {
                try {
                    const spaceStats = await this.getService('confluence').getSpaceAnalytics(projectIdentifier);
                    dashboard.services.confluence = spaceStats;
                } catch (error) {
                    dashboard.services.confluence = { error: error.message };
                }
            }

            // Generate summary
            dashboard.summary = this.generateProjectSummary(dashboard.services);
            
            this.emit('dashboard:generated', dashboard);
            return dashboard;

        } catch (error) {
            this.emit('dashboard:error', { projectIdentifier, error });
            throw error;
        }
    }

    /**
     * Generate project summary from service data
     */
    generateProjectSummary(services) {
        const summary = {
            health: 'unknown',
            activity: 'unknown',
            issues: 0,
            documentation: 'unknown'
        };

        // Health assessment
        const healthyServices = Object.values(services).filter(s => !s.error).length;
        const totalServices = Object.keys(services).length;
        
        if (healthyServices === totalServices) {
            summary.health = 'excellent';
        } else if (healthyServices > totalServices / 2) {
            summary.health = 'good';
        } else {
            summary.health = 'poor';
        }

        // Activity assessment
        if (services.github && !services.github.error) {
            summary.activity = services.github.recentCommits > 5 ? 'high' : 
                              services.github.recentCommits > 2 ? 'medium' : 'low';
        }

        // Issues count
        if (services.github && !services.github.error) {
            summary.issues += services.github.openIssues;
        }
        if (services.jira && !services.jira.error) {
            summary.issues += services.jira.summary?.totalIssues || 0;
        }

        // Documentation assessment
        if (services.confluence && !services.confluence.error) {
            const totalContent = services.confluence.content?.totalContent || 0;
            summary.documentation = totalContent > 10 ? 'comprehensive' :
                                  totalContent > 5 ? 'adequate' : 'minimal';
        }

        return summary;
    }

    /**
     * Event system
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    // Prevent handler errors from breaking the system
                }
            });
        }
    }

    /**
     * Get manager statistics
     */
    getStatistics() {
        return {
            services: {
                configured: this.configurations.size,
                enabled: Array.from(this.configurations.values()).filter(c => c.enabled).length,
                connected: Array.from(this.serviceStatus.values()).filter(s => s.status === 'connected').length
            },
            framework: this.framework.getStatistics(),
            lastHealthCheck: this.lastHealthCheck,
            uptime: Date.now() - (this.initTime || Date.now())
        };
    }

    /**
     * Export configuration
     */
    exportConfiguration() {
        const config = {};
        this.configurations.forEach((serviceConfig, serviceName) => {
            config[serviceName] = {
                type: serviceConfig.type,
                enabled: serviceConfig.enabled,
                // Don't export sensitive data like tokens
                config: {
                    baseUrl: serviceConfig.config.baseUrl,
                    username: serviceConfig.config.username,
                    org: serviceConfig.config.org
                }
            };
        });
        return config;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.framework.destroy();
        this.connectors.clear();
        this.configurations.clear();
        this.serviceStatus.clear();
        this.eventHandlers.clear();
        this.initialized = false;
        this.emit('manager:destroyed');
    }
}

// Export for use in other modules
window.EnterpriseServiceManager = EnterpriseServiceManager;
export default EnterpriseServiceManager;