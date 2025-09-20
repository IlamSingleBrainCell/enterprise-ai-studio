/**
 * Docker Connector
 * Integration with Docker Engine API for container and image management
 */

import { BaseConnector } from './enterprise-api-framework.js';

class DockerConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // Default to local Docker daemon if no host specified
        this.dockerHost = config.dockerHost || 'http://localhost:2376';
        this.tlsVerify = config.tlsVerify || false;
        this.certPath = config.certPath || null;
        
        // API version
        this.apiVersion = config.apiVersion || 'v1.41';
        
        // Build base URL
        this.baseUrl = `${this.dockerHost}/${this.apiVersion}`;
    }

    /**
     * Authenticate with Docker (if using remote daemon with auth)
     */
    async authenticate() {
        try {
            // For local Docker daemon, test connectivity by getting version
            const version = await this.getVersion();
            
            this.authenticated = true;
            this.lastAuthTime = Date.now();

            return {
                dockerVersion: version.Version,
                apiVersion: version.ApiVersion,
                platform: version.Platform?.Name || 'unknown',
                timestamp: this.lastAuthTime
            };

        } catch (error) {
            this.authenticated = false;
            throw new Error(`Docker authentication failed: ${error.message}`);
        }
    }

    /**
     * Get authentication headers (for TLS/auth scenarios)
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add authentication if configured
        if (this.config.username && this.config.password) {
            const credentials = btoa(`${this.config.username}:${this.config.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }

        return headers;
    }

    /**
     * Make requests to Docker API
     */
    async request(endpoint, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
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
     * System Information
     */
    async getVersion() {
        return await this.request('/version');
    }

    async getInfo() {
        return await this.request('/info');
    }

    async ping() {
        try {
            await this.request('/_ping');
            return { status: 'ok', timestamp: new Date().toISOString() };
        } catch (error) {
            return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
        }
    }

    async getEvents(options = {}) {
        const params = new URLSearchParams();
        if (options.since) params.append('since', options.since);
        if (options.until) params.append('until', options.until);
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/events${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    async getDiskUsage() {
        return await this.request('/system/df');
    }

    /**
     * Container Management
     */
    async getContainers(options = {}) {
        const params = new URLSearchParams();
        if (options.all !== undefined) params.append('all', options.all);
        if (options.limit) params.append('limit', options.limit);
        if (options.size !== undefined) params.append('size', options.size);
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/containers/json${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    async getContainer(containerId) {
        return await this.request(`/containers/${containerId}/json`);
    }

    async createContainer(config) {
        return await this.request('/containers/create', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async startContainer(containerId) {
        return await this.request(`/containers/${containerId}/start`, {
            method: 'POST'
        });
    }

    async stopContainer(containerId, options = {}) {
        const params = new URLSearchParams();
        if (options.timeout) params.append('t', options.timeout);

        const endpoint = `/containers/${containerId}/stop${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'POST' });
    }

    async restartContainer(containerId, options = {}) {
        const params = new URLSearchParams();
        if (options.timeout) params.append('t', options.timeout);

        const endpoint = `/containers/${containerId}/restart${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'POST' });
    }

    async killContainer(containerId, signal = 'SIGKILL') {
        const params = new URLSearchParams({ signal });
        return await this.request(`/containers/${containerId}/kill?${params}`, {
            method: 'POST'
        });
    }

    async removeContainer(containerId, options = {}) {
        const params = new URLSearchParams();
        if (options.force !== undefined) params.append('force', options.force);
        if (options.volumes !== undefined) params.append('v', options.volumes);
        if (options.link !== undefined) params.append('link', options.link);

        const endpoint = `/containers/${containerId}${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'DELETE' });
    }

    async pauseContainer(containerId) {
        return await this.request(`/containers/${containerId}/pause`, {
            method: 'POST'
        });
    }

    async unpauseContainer(containerId) {
        return await this.request(`/containers/${containerId}/unpause`, {
            method: 'POST'
        });
    }

    async getContainerLogs(containerId, options = {}) {
        const params = new URLSearchParams();
        if (options.stdout !== undefined) params.append('stdout', options.stdout);
        if (options.stderr !== undefined) params.append('stderr', options.stderr);
        if (options.since) params.append('since', options.since);
        if (options.until) params.append('until', options.until);
        if (options.timestamps !== undefined) params.append('timestamps', options.timestamps);
        if (options.tail) params.append('tail', options.tail);

        const endpoint = `/containers/${containerId}/logs${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, {
            headers: { 'Accept': 'text/plain' }
        });
    }

    async getContainerStats(containerId, stream = false) {
        const params = new URLSearchParams({ stream: stream.toString() });
        return await this.request(`/containers/${containerId}/stats?${params}`);
    }

    async getContainerProcesses(containerId, options = {}) {
        const params = new URLSearchParams();
        if (options.psArgs) params.append('ps_args', options.psArgs);

        const endpoint = `/containers/${containerId}/top${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    async execContainer(containerId, config) {
        // Create exec instance
        const execConfig = await this.request(`/containers/${containerId}/exec`, {
            method: 'POST',
            body: JSON.stringify(config)
        });

        // Start exec
        await this.request(`/exec/${execConfig.Id}/start`, {
            method: 'POST',
            body: JSON.stringify({
                Detach: config.Detach || false,
                Tty: config.Tty || false
            })
        });

        return execConfig;
    }

    /**
     * Image Management
     */
    async getImages(options = {}) {
        const params = new URLSearchParams();
        if (options.all !== undefined) params.append('all', options.all);
        if (options.filters) params.append('filters', JSON.stringify(options.filters));
        if (options.digests !== undefined) params.append('digests', options.digests);

        const endpoint = `/images/json${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    async getImage(imageId) {
        return await this.request(`/images/${imageId}/json`);
    }

    async getImageHistory(imageId) {
        return await this.request(`/images/${imageId}/history`);
    }

    async pullImage(imageName, options = {}) {
        const params = new URLSearchParams();
        if (options.tag) params.append('tag', options.tag);
        if (options.platform) params.append('platform', options.platform);

        const endpoint = `/images/create?fromImage=${encodeURIComponent(imageName)}${params.toString() ? '&' + params : ''}`;
        
        return await this.request(endpoint, {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'X-Registry-Auth': options.authConfig ? btoa(JSON.stringify(options.authConfig)) : ''
            }
        });
    }

    async buildImage(dockerfile, options = {}) {
        const params = new URLSearchParams();
        if (options.t) params.append('t', options.t); // tag
        if (options.q !== undefined) params.append('q', options.q); // quiet
        if (options.nocache !== undefined) params.append('nocache', options.nocache);
        if (options.rm !== undefined) params.append('rm', options.rm);
        if (options.forcerm !== undefined) params.append('forcerm', options.forcerm);
        if (options.platform) params.append('platform', options.platform);

        const endpoint = `/build${params.toString() ? '?' + params : ''}`;

        return await this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-tar',
                ...this.getAuthHeaders()
            },
            body: dockerfile // Should be tar archive
        });
    }

    async removeImage(imageId, options = {}) {
        const params = new URLSearchParams();
        if (options.force !== undefined) params.append('force', options.force);
        if (options.noprune !== undefined) params.append('noprune', options.noprune);

        const endpoint = `/images/${imageId}${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'DELETE' });
    }

    async tagImage(imageId, repo, tag) {
        const params = new URLSearchParams({ repo, tag });
        return await this.request(`/images/${imageId}/tag?${params}`, {
            method: 'POST'
        });
    }

    async pushImage(imageName, options = {}) {
        const params = new URLSearchParams();
        if (options.tag) params.append('tag', options.tag);

        const endpoint = `/images/${encodeURIComponent(imageName)}/push${params.toString() ? '?' + params : ''}`;
        
        return await this.request(endpoint, {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'X-Registry-Auth': options.authConfig ? btoa(JSON.stringify(options.authConfig)) : ''
            }
        });
    }

    async searchImages(term, options = {}) {
        const params = new URLSearchParams({ term });
        if (options.limit) params.append('limit', options.limit);
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        return await this.request(`/images/search?${params}`);
    }

    async pruneImages(options = {}) {
        const params = new URLSearchParams();
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/images/prune${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'POST' });
    }

    /**
     * Network Management
     */
    async getNetworks(options = {}) {
        const params = new URLSearchParams();
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/networks${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    async getNetwork(networkId) {
        return await this.request(`/networks/${networkId}`);
    }

    async createNetwork(config) {
        return await this.request('/networks/create', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async removeNetwork(networkId) {
        return await this.request(`/networks/${networkId}`, {
            method: 'DELETE'
        });
    }

    async connectContainerToNetwork(networkId, containerId, config = {}) {
        return await this.request(`/networks/${networkId}/connect`, {
            method: 'POST',
            body: JSON.stringify({
                Container: containerId,
                ...config
            })
        });
    }

    async disconnectContainerFromNetwork(networkId, containerId, options = {}) {
        return await this.request(`/networks/${networkId}/disconnect`, {
            method: 'POST',
            body: JSON.stringify({
                Container: containerId,
                Force: options.force || false
            })
        });
    }

    async pruneNetworks(options = {}) {
        const params = new URLSearchParams();
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/networks/prune${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'POST' });
    }

    /**
     * Volume Management
     */
    async getVolumes(options = {}) {
        const params = new URLSearchParams();
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/volumes${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    async getVolume(volumeName) {
        return await this.request(`/volumes/${volumeName}`);
    }

    async createVolume(config) {
        return await this.request('/volumes/create', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async removeVolume(volumeName, options = {}) {
        const params = new URLSearchParams();
        if (options.force !== undefined) params.append('force', options.force);

        const endpoint = `/volumes/${volumeName}${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'DELETE' });
    }

    async pruneVolumes(options = {}) {
        const params = new URLSearchParams();
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/volumes/prune${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'POST' });
    }

    /**
     * Docker Compose Integration (requires Docker Compose)
     */
    async composeUp(projectName, composeFile, options = {}) {
        // This would typically be done via docker-compose CLI or Docker Compose API
        throw new Error('Docker Compose integration requires additional setup');
    }

    async composeDown(projectName, options = {}) {
        // This would typically be done via docker-compose CLI
        throw new Error('Docker Compose integration requires additional setup');
    }

    /**
     * Swarm Management (Docker Swarm mode)
     */
    async getSwarmInfo() {
        try {
            const info = await this.getInfo();
            return info.Swarm;
        } catch (error) {
            throw new Error(`Failed to get swarm info: ${error.message}`);
        }
    }

    async initSwarm(config = {}) {
        return await this.request('/swarm/init', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async joinSwarm(config) {
        return await this.request('/swarm/join', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async leaveSwarm(options = {}) {
        const params = new URLSearchParams();
        if (options.force !== undefined) params.append('force', options.force);

        const endpoint = `/swarm/leave${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint, { method: 'POST' });
    }

    async getNodes() {
        return await this.request('/nodes');
    }

    async getServices() {
        return await this.request('/services');
    }

    async getTasks(options = {}) {
        const params = new URLSearchParams();
        if (options.filters) params.append('filters', JSON.stringify(options.filters));

        const endpoint = `/tasks${params.toString() ? '?' + params : ''}`;
        return await this.request(endpoint);
    }

    /**
     * Registry Operations
     */
    async login(registry, credentials) {
        return await this.request('/auth', {
            method: 'POST',
            body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
                email: credentials.email || '',
                serveraddress: registry
            })
        });
    }

    /**
     * Statistics and Monitoring
     */
    async getSystemStats() {
        const [info, version, containers, images, networks, volumes] = await Promise.all([
            this.getInfo(),
            this.getVersion(),
            this.getContainers({ all: true }),
            this.getImages(),
            this.getNetworks(),
            this.getVolumes()
        ]);

        const containerStats = {
            total: containers.length,
            running: containers.filter(c => c.State === 'running').length,
            stopped: containers.filter(c => c.State === 'exited').length,
            paused: containers.filter(c => c.State === 'paused').length
        };

        return {
            version: version.Version,
            apiVersion: version.ApiVersion,
            platform: version.Platform?.Name,
            architecture: info.Architecture,
            cpus: info.NCPU,
            memory: info.MemTotal,
            containers: containerStats,
            images: images.length,
            networks: networks.length,
            volumes: volumes.Volumes?.length || 0,
            timestamp: new Date().toISOString()
        };
    }

    async getContainerResourceUsage() {
        const containers = await this.getContainers({ all: false }); // Only running containers
        const stats = [];

        for (const container of containers) {
            try {
                const stat = await this.getContainerStats(container.Id, false);
                stats.push({
                    id: container.Id,
                    name: container.Names[0],
                    image: container.Image,
                    stats: stat
                });
            } catch (error) {
                // Skip containers that can't provide stats
            }
        }

        return stats;
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const ping = await this.ping();
            const version = await this.getVersion();
            
            return {
                status: ping.status === 'ok' ? 'healthy' : 'unhealthy',
                version: version.Version,
                apiVersion: version.ApiVersion,
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
    getConnectorInfo() {
        return {
            name: 'Docker',
            dockerHost: this.dockerHost,
            apiVersion: this.apiVersion,
            tlsVerify: this.tlsVerify,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null
        };
    }
}

// Export for use in other modules
window.DockerConnector = DockerConnector;
export default DockerConnector;