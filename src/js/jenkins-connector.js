/**
 * Jenkins Connector
 * Integration with Jenkins for CI/CD pipeline management and build automation
 */

import { BaseConnector } from './enterprise-api-framework.js';

class JenkinsConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // Required config: baseUrl, username, apiToken
        if (!config.baseUrl || !config.username || !config.apiToken) {
            throw new Error('Jenkins requires baseUrl, username, and apiToken in config');
        }
        
        this.crumbIssuer = null;
    }

    /**
     * Authenticate with Jenkins
     */
    async authenticate() {
        try {
            // Get Jenkins crumb for CSRF protection
            try {
                this.crumbIssuer = await this.makeHttpRequest(`${this.config.baseUrl}/crumbIssuer/api/json`, {
                    headers: this.getAuthHeaders()
                });
            } catch (error) {
                // Some Jenkins instances don't have CSRF protection enabled
                this.crumbIssuer = null;
            }

            // Test authentication by getting Jenkins version
            const response = await this.makeHttpRequest(`${this.config.baseUrl}/api/json`, {
                headers: this.getAuthHeaders()
            });

            this.authenticated = true;
            this.lastAuthTime = Date.now();

            return {
                access_token: this.config.apiToken,
                user: this.config.username,
                jenkinsVersion: response.version || 'unknown',
                timestamp: this.lastAuthTime
            };

        } catch (error) {
            this.authenticated = false;
            throw new Error(`Jenkins authentication failed: ${error.message}`);
        }
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const credentials = btoa(`${this.config.username}:${this.config.apiToken}`);
        const headers = {
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json'
        };

        // Add CSRF crumb if available
        if (this.crumbIssuer) {
            headers[this.crumbIssuer.crumbRequestField] = this.crumbIssuer.crumb;
        }

        return headers;
    }

    /**
     * Make requests to Jenkins API
     */
    async request(endpoint, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
        
        const requestOptions = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };

        return await this.makeHttpRequest(url, requestOptions);
    }

    /**
     * Job Management
     */
    async getJobs() {
        const response = await this.request('/api/json?tree=jobs[name,url,color,lastBuild[number,timestamp,result]]');
        return response.jobs;
    }

    async getJob(jobName) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/api/json`);
    }

    async createJob(jobName, configXml) {
        return await this.request(`/createItem?name=${encodeURIComponent(jobName)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                ...this.getAuthHeaders()
            },
            body: configXml
        });
    }

    async updateJob(jobName, configXml) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/config.xml`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                ...this.getAuthHeaders()
            },
            body: configXml
        });
    }

    async deleteJob(jobName) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/doDelete`, {
            method: 'POST'
        });
    }

    async getJobConfig(jobName) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/config.xml`, {
            headers: {
                'Accept': 'application/xml'
            }
        });
    }

    /**
     * Build Management
     */
    async getBuilds(jobName, options = {}) {
        const params = new URLSearchParams({
            tree: 'builds[number,timestamp,result,duration,url,changeSet[items[msg,author[fullName]]]]'
        });

        const response = await this.request(`/job/${encodeURIComponent(jobName)}/api/json?${params}`);
        
        let builds = response.builds || [];
        
        if (options.limit) {
            builds = builds.slice(0, options.limit);
        }
        
        return builds;
    }

    async getBuild(jobName, buildNumber) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`);
    }

    async triggerBuild(jobName, parameters = {}) {
        const endpoint = Object.keys(parameters).length > 0 
            ? `/job/${encodeURIComponent(jobName)}/buildWithParameters`
            : `/job/${encodeURIComponent(jobName)}/build`;

        const formData = new URLSearchParams();
        Object.entries(parameters).forEach(([key, value]) => {
            formData.append(key, value);
        });

        return await this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...this.getAuthHeaders()
            },
            body: formData.toString()
        });
    }

    async stopBuild(jobName, buildNumber) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/${buildNumber}/stop`, {
            method: 'POST'
        });
    }

    async getBuildLog(jobName, buildNumber, options = {}) {
        const params = new URLSearchParams();
        if (options.start) params.append('start', options.start);
        
        const endpoint = `/job/${encodeURIComponent(jobName)}/${buildNumber}/consoleText${params.toString() ? '?' + params : ''}`;
        
        return await this.request(endpoint, {
            headers: {
                'Accept': 'text/plain'
            }
        });
    }

    async getBuildStatus(jobName, buildNumber) {
        const build = await this.getBuild(jobName, buildNumber);
        return {
            number: build.number,
            result: build.result,
            building: build.building,
            duration: build.duration,
            timestamp: build.timestamp,
            url: build.url
        };
    }

    /**
     * Pipeline Management
     */
    async getPipelines() {
        const jobs = await this.getJobs();
        return jobs.filter(job => job._class && job._class.includes('Pipeline'));
    }

    async createPipeline(pipelineName, pipelineScript) {
        const configXml = this.generatePipelineConfig(pipelineScript);
        return await this.createJob(pipelineName, configXml);
    }

    generatePipelineConfig(pipelineScript) {
        return `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <actions/>
  <description></description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers/>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${this.escapeXml(pipelineScript)}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
    }

    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Node and Agent Management
     */
    async getNodes() {
        const response = await this.request('/computer/api/json?tree=computer[displayName,offline,temporarilyOffline,numExecutors,oneOffExecutors[*]]');
        return response.computer;
    }

    async getNode(nodeName) {
        return await this.request(`/computer/${encodeURIComponent(nodeName)}/api/json`);
    }

    async createNode(nodeData) {
        const formData = new URLSearchParams({
            name: nodeData.name,
            type: nodeData.type || 'hudson.slaves.DumbSlave',
            json: JSON.stringify({
                name: nodeData.name,
                nodeDescription: nodeData.description || '',
                numExecutors: nodeData.numExecutors || 1,
                remoteFS: nodeData.remoteFS || '/tmp',
                labelString: nodeData.labels || '',
                mode: nodeData.mode || 'NORMAL',
                launcher: nodeData.launcher || { stapler: { $class: 'hudson.slaves.JNLPLauncher' } }
            })
        });

        return await this.request('/computer/doCreateItem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...this.getAuthHeaders()
            },
            body: formData.toString()
        });
    }

    async deleteNode(nodeName) {
        return await this.request(`/computer/${encodeURIComponent(nodeName)}/doDelete`, {
            method: 'POST'
        });
    }

    /**
     * Queue Management
     */
    async getQueue() {
        const response = await this.request('/queue/api/json?tree=items[id,task[name],why,buildableStartMilliseconds]');
        return response.items;
    }

    async cancelQueueItem(itemId) {
        return await this.request(`/queue/cancelItem?id=${itemId}`, {
            method: 'POST'
        });
    }

    /**
     * Plugin Management
     */
    async getPlugins() {
        const response = await this.request('/pluginManager/api/json?depth=1&tree=plugins[shortName,version,hasUpdate,enabled,active]');
        return response.plugins;
    }

    async installPlugin(pluginName, version = null) {
        const pluginSpec = version ? `${pluginName}@${version}` : pluginName;
        
        return await this.request('/pluginManager/installNecessaryPlugins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...this.getAuthHeaders()
            },
            body: `plugin.${pluginSpec}.default=on`
        });
    }

    /**
     * System Management
     */
    async getSystemInfo() {
        return await this.request('/systemInfo');
    }

    async getSystemLog() {
        return await this.request('/log/all', {
            headers: {
                'Accept': 'text/plain'
            }
        });
    }

    async quietDown() {
        return await this.request('/quietDown', {
            method: 'POST'
        });
    }

    async restart() {
        return await this.request('/restart', {
            method: 'POST'
        });
    }

    async safeRestart() {
        return await this.request('/safeRestart', {
            method: 'POST'
        });
    }

    /**
     * Statistics and Monitoring
     */
    async getStatistics() {
        const [jobs, nodes, queue, plugins] = await Promise.all([
            this.getJobs(),
            this.getNodes(),
            this.getQueue(),
            this.getPlugins()
        ]);

        const jobStats = {
            total: jobs.length,
            success: jobs.filter(j => j.color === 'blue').length,
            failed: jobs.filter(j => j.color === 'red').length,
            unstable: jobs.filter(j => j.color === 'yellow').length,
            disabled: jobs.filter(j => j.color === 'disabled').length
        };

        const nodeStats = {
            total: nodes.length,
            online: nodes.filter(n => !n.offline).length,
            offline: nodes.filter(n => n.offline).length,
            totalExecutors: nodes.reduce((sum, n) => sum + (n.numExecutors || 0), 0)
        };

        const pluginStats = {
            total: plugins.length,
            enabled: plugins.filter(p => p.enabled).length,
            hasUpdates: plugins.filter(p => p.hasUpdate).length
        };

        return {
            jobs: jobStats,
            nodes: nodeStats,
            queue: queue.length,
            plugins: pluginStats,
            timestamp: new Date().toISOString()
        };
    }

    async getBuildHistory(jobName, days = 30) {
        const builds = await this.getBuilds(jobName, { limit: 100 });
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        const recentBuilds = builds.filter(build => build.timestamp > cutoff);
        
        const stats = {
            total: recentBuilds.length,
            success: recentBuilds.filter(b => b.result === 'SUCCESS').length,
            failed: recentBuilds.filter(b => b.result === 'FAILURE').length,
            unstable: recentBuilds.filter(b => b.result === 'UNSTABLE').length,
            aborted: recentBuilds.filter(b => b.result === 'ABORTED').length,
            averageDuration: recentBuilds.length > 0 
                ? recentBuilds.reduce((sum, b) => sum + (b.duration || 0), 0) / recentBuilds.length 
                : 0
        };

        return {
            period: `Last ${days} days`,
            statistics: stats,
            builds: recentBuilds
        };
    }

    /**
     * Webhook Management
     */
    async createWebhook(jobName, webhookUrl, events = ['build']) {
        // This would typically involve configuring a webhook plugin
        // Implementation depends on the specific webhook plugin used
        throw new Error('Webhook creation requires specific plugin configuration');
    }

    /**
     * Blue Ocean API (if available)
     */
    async getBlueOceanPipelines() {
        try {
            return await this.request('/blue/rest/organizations/jenkins/pipelines/');
        } catch (error) {
            throw new Error('Blue Ocean plugin not available or not installed');
        }
    }

    async getBlueOceanRuns(pipelineName) {
        try {
            return await this.request(`/blue/rest/organizations/jenkins/pipelines/${encodeURIComponent(pipelineName)}/runs/`);
        } catch (error) {
            throw new Error('Blue Ocean plugin not available or not installed');
        }
    }

    /**
     * Multi-branch Pipeline Support
     */
    async getMultiBranchJobs() {
        const jobs = await this.getJobs();
        return jobs.filter(job => 
            job._class && (
                job._class.includes('MultiBranch') || 
                job._class.includes('WorkflowMultiBranchProject')
            )
        );
    }

    async scanMultiBranchJob(jobName) {
        return await this.request(`/job/${encodeURIComponent(jobName)}/build`, {
            method: 'POST'
        });
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const response = await this.request('/api/json');
            return {
                status: 'healthy',
                version: response.version,
                mode: response.mode,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get connector information
     */
    getInfo() {
        return {
            name: 'Jenkins',
            baseUrl: this.config.baseUrl,
            username: this.config.username,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null,
            crumbEnabled: !!this.crumbIssuer
        };
    }
}

// Export for use in other modules
window.JenkinsConnector = JenkinsConnector;
export default JenkinsConnector;