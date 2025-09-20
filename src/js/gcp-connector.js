/**
 * Google Cloud Platform (GCP) Connector
 * Integration with Google Cloud APIs for cloud resource management
 */

import { BaseConnector } from './enterprise-api-framework.js';

class GCPConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // GCP authentication methods: service account key, OAuth, or application default credentials
        this.authMethod = config.authMethod || 'service_account';
        
        if (this.authMethod === 'service_account') {
            if (!config.serviceAccountKey) {
                throw new Error('GCP service account auth requires serviceAccountKey in config');
            }
            this.serviceAccountKey = config.serviceAccountKey;
        }
        
        this.projectId = config.projectId;
        this.region = config.region || 'us-central1';
        this.zone = config.zone || 'us-central1-a';
        
        // GCP API endpoints
        this.authUrl = 'https://oauth2.googleapis.com/token';
        this.computeUrl = 'https://compute.googleapis.com/compute/v1';
        this.storageUrl = 'https://storage.googleapis.com/storage/v1';
        this.cloudfunctionsUrl = 'https://cloudfunctions.googleapis.com/v1';
        this.cloudrunUrl = 'https://run.googleapis.com/v1';
        this.containerUrl = 'https://container.googleapis.com/v1';
        this.monitoringUrl = 'https://monitoring.googleapis.com/v1';
        this.loggingUrl = 'https://logging.googleapis.com/v2';
        this.resourceManagerUrl = 'https://cloudresourcemanager.googleapis.com/v1';
        this.iamUrl = 'https://iam.googleapis.com/v1';
        
        // Access token for API calls
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Authenticate with GCP using service account
     */
    async authenticate() {
        try {
            if (this.authMethod === 'service_account') {
                return await this.authenticateServiceAccount();
            } else {
                throw new Error(`Unsupported auth method: ${this.authMethod}`);
            }
        } catch (error) {
            this.authenticated = false;
            throw new Error(`GCP authentication failed: ${error.message}`);
        }
    }

    async authenticateServiceAccount() {
        const now = Math.floor(Date.now() / 1000);
        const expiry = now + 3600; // 1 hour
        
        // Create JWT header
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };
        
        // Create JWT payload
        const payload = {
            iss: this.serviceAccountKey.client_email,
            scope: 'https://www.googleapis.com/auth/cloud-platform',
            aud: this.authUrl,
            exp: expiry,
            iat: now
        };
        
        // Create JWT (simplified - in production use a proper JWT library)
        const jwt = await this.createJWT(header, payload, this.serviceAccountKey.private_key);
        
        // Exchange JWT for access token
        const response = await this.makeHttpRequest(this.authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            }).toString()
        });

        this.accessToken = response.access_token;
        this.tokenExpiry = Date.now() + (response.expires_in * 1000);
        this.authenticated = true;
        this.lastAuthTime = Date.now();

        return {
            access_token: this.accessToken,
            expires_in: response.expires_in,
            token_type: response.token_type,
            timestamp: this.lastAuthTime
        };
    }

    async createJWT(header, payload, privateKey) {
        // Simplified JWT creation - in production use a proper crypto library
        const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
        const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
        
        const message = `${encodedHeader}.${encodedPayload}`;
        
        // Note: This is a simplified implementation
        // In a real application, you would use the Web Crypto API or a proper JWT library
        // to sign with the private key
        const signature = btoa(`signature_${message}`).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
        
        return `${message}.${signature}`;
    }

    /**
     * Check if token needs refresh
     */
    async ensureValidToken() {
        if (!this.authenticated || !this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
            await this.authenticate();
        }
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make requests to GCP APIs
     */
    async request(endpoint, options = {}) {
        await this.ensureValidToken();

        const url = endpoint.startsWith('http') ? endpoint : `${this.computeUrl}${endpoint}`;
        
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
     * Project Management
     */
    async getProjects() {
        return await this.makeHttpRequest(`${this.resourceManagerUrl}/projects`, {
            headers: this.getAuthHeaders()
        });
    }

    async getProject(projectId = null) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.resourceManagerUrl}/projects/${projId}`, {
            headers: this.getAuthHeaders()
        });
    }

    /**
     * Compute Engine Management
     */
    async getInstances(projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances`);
    }

    async getInstance(instanceName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances/${instanceName}`);
    }

    async startInstance(instanceName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances/${instanceName}/start`, {
            method: 'POST'
        });
    }

    async stopInstance(instanceName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances/${instanceName}/stop`, {
            method: 'POST'
        });
    }

    async resetInstance(instanceName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances/${instanceName}/reset`, {
            method: 'POST'
        });
    }

    async deleteInstance(instanceName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances/${instanceName}`, {
            method: 'DELETE'
        });
    }

    async createInstance(instanceConfig, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.request(`/projects/${projId}/zones/${zn}/instances`, {
            method: 'POST',
            body: JSON.stringify(instanceConfig)
        });
    }

    /**
     * Cloud Storage Management
     */
    async getBuckets(projectId = null) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.storageUrl}/b?project=${projId}`, {
            headers: this.getAuthHeaders()
        });
    }

    async getBucket(bucketName) {
        return await this.makeHttpRequest(`${this.storageUrl}/b/${bucketName}`, {
            headers: this.getAuthHeaders()
        });
    }

    async createBucket(bucketName, config, projectId = null) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.storageUrl}/b?project=${projId}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                name: bucketName,
                ...config
            })
        });
    }

    async deleteBucket(bucketName) {
        return await this.makeHttpRequest(`${this.storageUrl}/b/${bucketName}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
    }

    async getObjects(bucketName, options = {}) {
        const params = new URLSearchParams();
        if (options.prefix) params.append('prefix', options.prefix);
        if (options.maxResults) params.append('maxResults', options.maxResults);
        if (options.pageToken) params.append('pageToken', options.pageToken);
        
        const url = `${this.storageUrl}/b/${bucketName}/o${params.toString() ? '?' + params : ''}`;
        return await this.makeHttpRequest(url, {
            headers: this.getAuthHeaders()
        });
    }

    async getObject(bucketName, objectName) {
        return await this.makeHttpRequest(`${this.storageUrl}/b/${bucketName}/o/${encodeURIComponent(objectName)}`, {
            headers: this.getAuthHeaders()
        });
    }

    async uploadObject(bucketName, objectName, data, metadata = {}) {
        return await this.makeHttpRequest(`${this.storageUrl}/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Content-Type': metadata.contentType || 'application/octet-stream'
            },
            body: data
        });
    }

    async deleteObject(bucketName, objectName) {
        return await this.makeHttpRequest(`${this.storageUrl}/b/${bucketName}/o/${encodeURIComponent(objectName)}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
    }

    /**
     * Cloud Functions Management
     */
    async getFunctions(projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudfunctionsUrl}/projects/${projId}/locations/${reg}/functions`, {
            headers: this.getAuthHeaders()
        });
    }

    async getFunction(functionName, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudfunctionsUrl}/projects/${projId}/locations/${reg}/functions/${functionName}`, {
            headers: this.getAuthHeaders()
        });
    }

    async callFunction(functionName, data = {}, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudfunctionsUrl}/projects/${projId}/locations/${reg}/functions/${functionName}:call`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ data })
        });
    }

    async createFunction(functionConfig, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudfunctionsUrl}/projects/${projId}/locations/${reg}/functions`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(functionConfig)
        });
    }

    async deleteFunction(functionName, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudfunctionsUrl}/projects/${projId}/locations/${reg}/functions/${functionName}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
    }

    /**
     * Cloud Run Management
     */
    async getCloudRunServices(projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudrunUrl}/projects/${projId}/locations/${reg}/services`, {
            headers: this.getAuthHeaders()
        });
    }

    async getCloudRunService(serviceName, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudrunUrl}/projects/${projId}/locations/${reg}/services/${serviceName}`, {
            headers: this.getAuthHeaders()
        });
    }

    async deployCloudRunService(serviceConfig, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudrunUrl}/projects/${projId}/locations/${reg}/services`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(serviceConfig)
        });
    }

    async deleteCloudRunService(serviceName, projectId = null, region = null) {
        const projId = projectId || this.projectId;
        const reg = region || this.region;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.cloudrunUrl}/projects/${projId}/locations/${reg}/services/${serviceName}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
    }

    /**
     * Google Kubernetes Engine (GKE) Management
     */
    async getGKEClusters(projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.containerUrl}/projects/${projId}/zones/${zn}/clusters`, {
            headers: this.getAuthHeaders()
        });
    }

    async getGKECluster(clusterName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.containerUrl}/projects/${projId}/zones/${zn}/clusters/${clusterName}`, {
            headers: this.getAuthHeaders()
        });
    }

    async createGKECluster(clusterConfig, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.containerUrl}/projects/${projId}/zones/${zn}/clusters`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(clusterConfig)
        });
    }

    async deleteGKECluster(clusterName, projectId = null, zone = null) {
        const projId = projectId || this.projectId;
        const zn = zone || this.zone;
        
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.containerUrl}/projects/${projId}/zones/${zn}/clusters/${clusterName}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
    }

    /**
     * Cloud Monitoring
     */
    async getMetrics(projectId = null, options = {}) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        const params = new URLSearchParams();
        if (options.filter) params.append('filter', options.filter);
        if (options.pageSize) params.append('pageSize', options.pageSize);
        if (options.pageToken) params.append('pageToken', options.pageToken);
        
        const url = `${this.monitoringUrl}/projects/${projId}/metricDescriptors${params.toString() ? '?' + params : ''}`;
        return await this.makeHttpRequest(url, {
            headers: this.getAuthHeaders()
        });
    }

    async getTimeSeriesData(projectId = null, options = {}) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        const params = new URLSearchParams();
        if (options.filter) params.append('filter', options.filter);
        if (options.interval) params.append('interval.endTime', options.interval.endTime);
        if (options.interval) params.append('interval.startTime', options.interval.startTime);
        
        const url = `${this.monitoringUrl}/projects/${projId}/timeSeries${params.toString() ? '?' + params : ''}`;
        return await this.makeHttpRequest(url, {
            headers: this.getAuthHeaders()
        });
    }

    /**
     * Cloud Logging
     */
    async getLogs(projectId = null, options = {}) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.loggingUrl}/projects/${projId}/logs`, {
            headers: this.getAuthHeaders()
        });
    }

    async getLogEntries(projectId = null, options = {}) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        const body = {
            resourceNames: [`projects/${projId}`],
            ...options
        };
        
        return await this.makeHttpRequest(`${this.loggingUrl}/entries:list`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(body)
        });
    }

    async writeLogEntry(logEntry, projectId = null) {
        const projId = projectId || this.projectId;
        if (!projId) {
            throw new Error('Project ID is required');
        }
        
        return await this.makeHttpRequest(`${this.loggingUrl}/entries:write`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                entries: [logEntry],
                logName: `projects/${projId}/logs/application`
            })
        });
    }

    /**
     * IAM Management
     */
    async getIAMPolicy(resource) {
        return await this.makeHttpRequest(`${this.iamUrl}/${resource}:getIamPolicy`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });
    }

    async setIAMPolicy(resource, policy) {
        return await this.makeHttpRequest(`${this.iamUrl}/${resource}:setIamPolicy`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ policy })
        });
    }

    async testIAMPermissions(resource, permissions) {
        return await this.makeHttpRequest(`${this.iamUrl}/${resource}:testIamPermissions`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ permissions })
        });
    }

    /**
     * Statistics and Monitoring
     */
    async getGCPResourceSummary(projectId = null) {
        try {
            const projId = projectId || this.projectId;
            if (!projId) {
                throw new Error('Project ID is required');
            }

            const [instances, buckets, functions, cloudRunServices, gkeClusters] = await Promise.allSettled([
                this.getInstances(projId),
                this.getBuckets(projId),
                this.getFunctions(projId),
                this.getCloudRunServices(projId),
                this.getGKEClusters(projId)
            ]);

            return {
                computeInstances: {
                    status: instances.status,
                    count: instances.status === 'fulfilled' ? (instances.value.items?.length || 0) : 0,
                    error: instances.status === 'rejected' ? instances.reason.message : null
                },
                storageBuckets: {
                    status: buckets.status,
                    count: buckets.status === 'fulfilled' ? (buckets.value.items?.length || 0) : 0,
                    error: buckets.status === 'rejected' ? buckets.reason.message : null
                },
                cloudFunctions: {
                    status: functions.status,
                    count: functions.status === 'fulfilled' ? (functions.value.functions?.length || 0) : 0,
                    error: functions.status === 'rejected' ? functions.reason.message : null
                },
                cloudRun: {
                    status: cloudRunServices.status,
                    count: cloudRunServices.status === 'fulfilled' ? (cloudRunServices.value.items?.length || 0) : 0,
                    error: cloudRunServices.status === 'rejected' ? cloudRunServices.reason.message : null
                },
                gkeClusters: {
                    status: gkeClusters.status,
                    count: gkeClusters.status === 'fulfilled' ? (gkeClusters.value.clusters?.length || 0) : 0,
                    error: gkeClusters.status === 'rejected' ? gkeClusters.reason.message : null
                },
                project: projId,
                region: this.region,
                zone: this.zone,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get GCP resource summary: ${error.message}`);
        }
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const project = await this.getProject();
            return {
                status: 'healthy',
                project: project.name,
                projectId: project.projectId,
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
            name: 'GCP',
            projectId: this.projectId,
            region: this.region,
            zone: this.zone,
            authMethod: this.authMethod,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null,
            tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null
        };
    }
}

// Export for use in other modules
window.GCPConnector = GCPConnector;
export default GCPConnector;