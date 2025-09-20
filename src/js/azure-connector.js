/**
 * Azure Connector
 * Integration with Microsoft Azure APIs for cloud resource management
 */

import { BaseConnector } from './enterprise-api-framework.js';

class AzureConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // Azure authentication methods: service principal, managed identity, or interactive
        this.authMethod = config.authMethod || 'service_principal';
        
        if (this.authMethod === 'service_principal') {
            if (!config.tenantId || !config.clientId || !config.clientSecret) {
                throw new Error('Azure service principal auth requires tenantId, clientId, and clientSecret');
            }
        }
        
        this.tenantId = config.tenantId;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.subscriptionId = config.subscriptionId;
        
        // Azure endpoints
        this.authority = config.authority || 'https://login.microsoftonline.com';
        this.managementUrl = config.managementUrl || 'https://management.azure.com';
        this.resourceManagerUrl = 'https://management.azure.com';
        this.graphUrl = 'https://graph.microsoft.com';
        
        // Access token for API calls
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Authenticate with Azure using service principal
     */
    async authenticate() {
        try {
            if (this.authMethod === 'service_principal') {
                return await this.authenticateServicePrincipal();
            } else if (this.authMethod === 'managed_identity') {
                return await this.authenticateManagedIdentity();
            } else {
                throw new Error(`Unsupported auth method: ${this.authMethod}`);
            }
        } catch (error) {
            this.authenticated = false;
            throw new Error(`Azure authentication failed: ${error.message}`);
        }
    }

    async authenticateServicePrincipal() {
        const tokenUrl = `${this.authority}/${this.tenantId}/oauth2/v2.0/token`;
        
        const body = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            scope: 'https://management.azure.com/.default',
            grant_type: 'client_credentials'
        });

        const response = await this.makeHttpRequest(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
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

    async authenticateManagedIdentity() {
        // Azure Instance Metadata Service (IMDS) endpoint
        const tokenUrl = 'http://169.254.169.254/metadata/identity/oauth2/token';
        
        const params = new URLSearchParams({
            'api-version': '2018-02-01',
            resource: 'https://management.azure.com/'
        });

        const response = await this.makeHttpRequest(`${tokenUrl}?${params}`, {
            method: 'GET',
            headers: {
                'Metadata': 'true'
            }
        });

        this.accessToken = response.access_token;
        this.tokenExpiry = Date.now() + (response.expires_in * 1000);
        this.authenticated = true;
        this.lastAuthTime = Date.now();

        return {
            access_token: this.accessToken,
            expires_in: response.expires_in,
            timestamp: this.lastAuthTime
        };
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
     * Make requests to Azure APIs
     */
    async request(endpoint, options = {}) {
        await this.ensureValidToken();

        const url = endpoint.startsWith('http') ? endpoint : `${this.managementUrl}${endpoint}`;
        
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
     * Subscription Management
     */
    async getSubscriptions() {
        return await this.request('/subscriptions?api-version=2020-01-01');
    }

    async getSubscription(subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }
        return await this.request(`/subscriptions/${subId}?api-version=2020-01-01`);
    }

    async getResourceGroups(subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }
        return await this.request(`/subscriptions/${subId}/resourcegroups?api-version=2021-04-01`);
    }

    async createResourceGroup(name, location, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }
        
        return await this.request(`/subscriptions/${subId}/resourcegroups/${name}?api-version=2021-04-01`, {
            method: 'PUT',
            body: JSON.stringify({
                location: location,
                tags: {}
            })
        });
    }

    async deleteResourceGroup(name, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }
        
        return await this.request(`/subscriptions/${subId}/resourcegroups/${name}?api-version=2021-04-01`, {
            method: 'DELETE'
        });
    }

    /**
     * Virtual Machine Management
     */
    async getVirtualMachines(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines?api-version=2021-11-01`;
        } else {
            endpoint = `/subscriptions/${subId}/providers/Microsoft.Compute/virtualMachines?api-version=2021-11-01`;
        }

        return await this.request(endpoint);
    }

    async getVirtualMachine(resourceGroupName, vmName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}?api-version=2021-11-01`);
    }

    async startVirtualMachine(resourceGroupName, vmName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/start?api-version=2021-11-01`, {
            method: 'POST'
        });
    }

    async stopVirtualMachine(resourceGroupName, vmName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/powerOff?api-version=2021-11-01`, {
            method: 'POST'
        });
    }

    async restartVirtualMachine(resourceGroupName, vmName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/restart?api-version=2021-11-01`, {
            method: 'POST'
        });
    }

    async deleteVirtualMachine(resourceGroupName, vmName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}?api-version=2021-11-01`, {
            method: 'DELETE'
        });
    }

    /**
     * Storage Account Management
     */
    async getStorageAccounts(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts?api-version=2021-09-01`;
        } else {
            endpoint = `/subscriptions/${subId}/providers/Microsoft.Storage/storageAccounts?api-version=2021-09-01`;
        }

        return await this.request(endpoint);
    }

    async getStorageAccount(resourceGroupName, accountName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${accountName}?api-version=2021-09-01`);
    }

    async createStorageAccount(resourceGroupName, accountName, config, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${accountName}?api-version=2021-09-01`, {
            method: 'PUT',
            body: JSON.stringify(config)
        });
    }

    async deleteStorageAccount(resourceGroupName, accountName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${accountName}?api-version=2021-09-01`, {
            method: 'DELETE'
        });
    }

    async getStorageAccountKeys(resourceGroupName, accountName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${accountName}/listKeys?api-version=2021-09-01`, {
            method: 'POST'
        });
    }

    /**
     * App Service Management
     */
    async getAppServices(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites?api-version=2021-02-01`;
        } else {
            endpoint = `/subscriptions/${subId}/providers/Microsoft.Web/sites?api-version=2021-02-01`;
        }

        return await this.request(endpoint);
    }

    async getAppService(resourceGroupName, siteName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites/${siteName}?api-version=2021-02-01`);
    }

    async startAppService(resourceGroupName, siteName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites/${siteName}/start?api-version=2021-02-01`, {
            method: 'POST'
        });
    }

    async stopAppService(resourceGroupName, siteName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites/${siteName}/stop?api-version=2021-02-01`, {
            method: 'POST'
        });
    }

    async restartAppService(resourceGroupName, siteName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites/${siteName}/restart?api-version=2021-02-01`, {
            method: 'POST'
        });
    }

    /**
     * SQL Database Management
     */
    async getSqlServers(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Sql/servers?api-version=2021-11-01`;
        } else {
            endpoint = `/subscriptions/${subId}/providers/Microsoft.Sql/servers?api-version=2021-11-01`;
        }

        return await this.request(endpoint);
    }

    async getSqlDatabases(resourceGroupName, serverName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Sql/servers/${serverName}/databases?api-version=2021-11-01`);
    }

    async getSqlDatabase(resourceGroupName, serverName, databaseName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Sql/servers/${serverName}/databases/${databaseName}?api-version=2021-11-01`);
    }

    /**
     * Azure Functions Management
     */
    async getFunctionApps(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites?api-version=2021-02-01&$filter=kind eq 'functionapp'`;
        } else {
            endpoint = `/subscriptions/${subId}/providers/Microsoft.Web/sites?api-version=2021-02-01&$filter=kind eq 'functionapp'`;
        }

        return await this.request(endpoint);
    }

    async getFunctionApp(resourceGroupName, functionAppName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites/${functionAppName}?api-version=2021-02-01`);
    }

    async getFunctions(resourceGroupName, functionAppName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Web/sites/${functionAppName}/functions?api-version=2021-02-01`);
    }

    /**
     * Key Vault Management
     */
    async getKeyVaults(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.KeyVault/vaults?api-version=2021-10-01`;
        } else {
            endpoint = `/subscriptions/${subId}/providers/Microsoft.KeyVault/vaults?api-version=2021-10-01`;
        }

        return await this.request(endpoint);
    }

    async getKeyVault(resourceGroupName, vaultName, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        return await this.request(`/subscriptions/${subId}/resourceGroups/${resourceGroupName}/providers/Microsoft.KeyVault/vaults/${vaultName}?api-version=2021-10-01`);
    }

    /**
     * Monitor and Metrics
     */
    async getMetrics(resourceUri, metricNames, timespan, interval = 'PT1M') {
        const params = new URLSearchParams({
            'api-version': '2018-01-01',
            metricnames: metricNames.join(','),
            timespan: timespan,
            interval: interval
        });

        return await this.request(`${resourceUri}/providers/Microsoft.Insights/metrics?${params}`);
    }

    async getActivityLogs(subscriptionId = null, options = {}) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        const params = new URLSearchParams({
            'api-version': '2015-04-01',
            '$filter': options.filter || `eventTimestamp ge '${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}'`
        });

        return await this.request(`/subscriptions/${subId}/providers/Microsoft.Insights/eventtypes/management/values?${params}`);
    }

    /**
     * Resource Management
     */
    async getAllResources(resourceGroupName = null, subscriptionId = null) {
        const subId = subscriptionId || this.subscriptionId;
        if (!subId) {
            throw new Error('Subscription ID is required');
        }

        let endpoint;
        if (resourceGroupName) {
            endpoint = `/subscriptions/${subId}/resourceGroups/${resourceGroupName}/resources?api-version=2021-04-01`;
        } else {
            endpoint = `/subscriptions/${subId}/resources?api-version=2021-04-01`;
        }

        return await this.request(endpoint);
    }

    async getResource(resourceId) {
        return await this.request(`${resourceId}?api-version=2021-04-01`);
    }

    /**
     * Statistics and Monitoring
     */
    async getAzureResourceSummary(subscriptionId = null) {
        try {
            const subId = subscriptionId || this.subscriptionId;
            if (!subId) {
                throw new Error('Subscription ID is required');
            }

            const [resourceGroups, vms, storageAccounts, appServices, functionApps] = await Promise.allSettled([
                this.getResourceGroups(subId),
                this.getVirtualMachines(null, subId),
                this.getStorageAccounts(null, subId),
                this.getAppServices(null, subId),
                this.getFunctionApps(null, subId)
            ]);

            return {
                resourceGroups: {
                    status: resourceGroups.status,
                    count: resourceGroups.status === 'fulfilled' ? (resourceGroups.value.value?.length || 0) : 0,
                    error: resourceGroups.status === 'rejected' ? resourceGroups.reason.message : null
                },
                virtualMachines: {
                    status: vms.status,
                    count: vms.status === 'fulfilled' ? (vms.value.value?.length || 0) : 0,
                    error: vms.status === 'rejected' ? vms.reason.message : null
                },
                storageAccounts: {
                    status: storageAccounts.status,
                    count: storageAccounts.status === 'fulfilled' ? (storageAccounts.value.value?.length || 0) : 0,
                    error: storageAccounts.status === 'rejected' ? storageAccounts.reason.message : null
                },
                appServices: {
                    status: appServices.status,
                    count: appServices.status === 'fulfilled' ? (appServices.value.value?.length || 0) : 0,
                    error: appServices.status === 'rejected' ? appServices.reason.message : null
                },
                functionApps: {
                    status: functionApps.status,
                    count: functionApps.status === 'fulfilled' ? (functionApps.value.value?.length || 0) : 0,
                    error: functionApps.status === 'rejected' ? functionApps.reason.message : null
                },
                subscription: subId,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get Azure resource summary: ${error.message}`);
        }
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const subscriptions = await this.getSubscriptions();
            return {
                status: 'healthy',
                subscriptions: subscriptions.value?.length || 0,
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
            name: 'Azure',
            tenantId: this.tenantId,
            subscriptionId: this.subscriptionId,
            authMethod: this.authMethod,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null,
            tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null
        };
    }
}

// Export for use in other modules
window.AzureConnector = AzureConnector;
export default AzureConnector;