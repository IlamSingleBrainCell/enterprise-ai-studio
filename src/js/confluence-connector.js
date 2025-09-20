/**
 * Confluence Connector
 * Integration with Confluence for documentation and knowledge management
 */

import { BaseConnector } from './enterprise-api-framework.js';

class ConfluenceConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // Required config: baseUrl, username, apiToken
        if (!config.baseUrl || !config.username || !config.apiToken) {
            throw new Error('Confluence requires baseUrl, username, and apiToken in config');
        }
        
        this.apiVersion = 'latest';
    }

    /**
     * Authenticate with Confluence
     */
    async authenticate() {
        try {
            // Test authentication by getting current user info
            const response = await this.makeHttpRequest(`${this.config.baseUrl}/wiki/rest/api/user/current`, {
                headers: this.getAuthHeaders()
            });

            this.authenticated = true;
            this.lastAuthTime = Date.now();

            return {
                access_token: this.config.apiToken,
                user: response.displayName,
                accountId: response.accountId,
                timestamp: this.lastAuthTime
            };

        } catch (error) {
            this.authenticated = false;
            throw new Error(`Confluence authentication failed: ${error.message}`);
        }
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const credentials = btoa(`${this.config.username}:${this.config.apiToken}`);
        return {
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make requests to Confluence API
     */
    async request(endpoint, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const url = `${this.config.baseUrl}/wiki/rest/api${endpoint}`;
        
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
     * Space Management
     */
    async getSpaces(options = {}) {
        const params = new URLSearchParams({
            start: options.start || 0,
            limit: options.limit || 25,
            type: options.type || '',
            status: options.status || 'current',
            expand: options.expand ? options.expand.join(',') : 'description,homepage'
        });

        return await this.request(`/space?${params}`);
    }

    async getSpace(spaceKey, options = {}) {
        const params = new URLSearchParams({
            expand: options.expand ? options.expand.join(',') : 'description,homepage,metadata'
        });

        return await this.request(`/space/${spaceKey}?${params}`);
    }

    async createSpace(spaceData) {
        return await this.request('/space', {
            method: 'POST',
            body: JSON.stringify({
                key: spaceData.key,
                name: spaceData.name,
                description: {
                    plain: {
                        value: spaceData.description || '',
                        representation: 'plain'
                    }
                },
                type: spaceData.type || 'global'
            })
        });
    }

    async updateSpace(spaceKey, spaceData) {
        return await this.request(`/space/${spaceKey}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: spaceData.name,
                description: {
                    plain: {
                        value: spaceData.description || '',
                        representation: 'plain'
                    }
                }
            })
        });
    }

    /**
     * Content Management
     */
    async getContent(options = {}) {
        const params = new URLSearchParams({
            type: options.type || 'page',
            spaceKey: options.spaceKey || '',
            title: options.title || '',
            status: options.status || 'current',
            start: options.start || 0,
            limit: options.limit || 25,
            expand: options.expand ? options.expand.join(',') : 'space,history,version,ancestors'
        });

        return await this.request(`/content?${params}`);
    }

    async getContentById(contentId, options = {}) {
        const params = new URLSearchParams({
            status: options.status || 'current',
            version: options.version || '',
            expand: options.expand ? options.expand.join(',') : 'space,body.storage,version,ancestors'
        });

        return await this.request(`/content/${contentId}?${params}`);
    }

    async createContent(contentData) {
        return await this.request('/content', {
            method: 'POST',
            body: JSON.stringify({
                type: contentData.type || 'page',
                title: contentData.title,
                space: {
                    key: contentData.spaceKey
                },
                body: {
                    storage: {
                        value: contentData.body || '',
                        representation: 'storage'
                    }
                },
                ancestors: contentData.parentId ? [{ id: contentData.parentId }] : []
            })
        });
    }

    async updateContent(contentId, contentData) {
        // Get current version first
        const current = await this.getContentById(contentId, { expand: ['version'] });
        
        return await this.request(`/content/${contentId}`, {
            method: 'PUT',
            body: JSON.stringify({
                version: {
                    number: current.version.number + 1
                },
                title: contentData.title,
                type: contentData.type || 'page',
                body: {
                    storage: {
                        value: contentData.body || '',
                        representation: 'storage'
                    }
                }
            })
        });
    }

    async deleteContent(contentId) {
        return await this.request(`/content/${contentId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Page Management
     */
    async getPages(spaceKey, options = {}) {
        return await this.getContent({
            type: 'page',
            spaceKey,
            ...options
        });
    }

    async getPage(pageId, options = {}) {
        return await this.getContentById(pageId, options);
    }

    async createPage(pageData) {
        return await this.createContent({
            type: 'page',
            ...pageData
        });
    }

    async getPageTree(spaceKey, rootPageId = null) {
        const pages = await this.getPages(spaceKey, { 
            expand: ['ancestors', 'children.page'],
            limit: 1000 
        });

        // Build tree structure
        const pageMap = new Map();
        const tree = [];

        // First pass: create all page nodes
        pages.results.forEach(page => {
            pageMap.set(page.id, {
                ...page,
                children: []
            });
        });

        // Second pass: build hierarchy
        pages.results.forEach(page => {
            const pageNode = pageMap.get(page.id);
            if (page.ancestors && page.ancestors.length > 0) {
                const parentId = page.ancestors[page.ancestors.length - 1].id;
                const parent = pageMap.get(parentId);
                if (parent) {
                    parent.children.push(pageNode);
                } else {
                    tree.push(pageNode);
                }
            } else {
                tree.push(pageNode);
            }
        });

        return tree;
    }

    /**
     * Blog Post Management
     */
    async getBlogPosts(spaceKey, options = {}) {
        return await this.getContent({
            type: 'blogpost',
            spaceKey,
            ...options
        });
    }

    async createBlogPost(blogData) {
        return await this.createContent({
            type: 'blogpost',
            ...blogData
        });
    }

    /**
     * Attachment Management
     */
    async getAttachments(contentId, options = {}) {
        const params = new URLSearchParams({
            start: options.start || 0,
            limit: options.limit || 25,
            filename: options.filename || '',
            mediaType: options.mediaType || ''
        });

        return await this.request(`/content/${contentId}/child/attachment?${params}`);
    }

    async uploadAttachment(contentId, fileData, fileName, options = {}) {
        const formData = new FormData();
        formData.append('file', fileData, fileName);
        formData.append('comment', options.comment || '');

        return await this.makeHttpRequest(`${this.config.baseUrl}/wiki/rest/api/content/${contentId}/child/attachment`, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeaders().Authorization,
                'X-Atlassian-Token': 'no-check'
            },
            body: formData
        });
    }

    /**
     * Search
     */
    async search(query, options = {}) {
        const params = new URLSearchParams({
            cql: query,
            start: options.start || 0,
            limit: options.limit || 25,
            expand: options.expand ? options.expand.join(',') : 'content'
        });

        return await this.request(`/content/search?${params}`);
    }

    async searchContent(searchTerm, options = {}) {
        const cql = this.buildCQLQuery(searchTerm, options);
        return await this.search(cql, options);
    }

    buildCQLQuery(searchTerm, options = {}) {
        let cql = `text ~ "${searchTerm}"`;

        if (options.spaceKey) {
            cql += ` AND space = "${options.spaceKey}"`;
        }

        if (options.type) {
            cql += ` AND type = "${options.type}"`;
        }

        if (options.creator) {
            cql += ` AND creator = "${options.creator}"`;
        }

        if (options.dateFrom) {
            cql += ` AND created >= "${options.dateFrom}"`;
        }

        if (options.dateTo) {
            cql += ` AND created <= "${options.dateTo}"`;
        }

        return cql;
    }

    /**
     * User Management
     */
    async getUsers(options = {}) {
        const params = new URLSearchParams({
            start: options.start || 0,
            limit: options.limit || 25,
            username: options.username || '',
            key: options.key || ''
        });

        return await this.request(`/user?${params}`);
    }

    async getCurrentUser() {
        return await this.request('/user/current');
    }

    /**
     * Labels and Metadata
     */
    async getLabels(contentId) {
        return await this.request(`/content/${contentId}/label`);
    }

    async addLabels(contentId, labels) {
        return await this.request(`/content/${contentId}/label`, {
            method: 'POST',
            body: JSON.stringify(
                labels.map(label => ({
                    prefix: 'global',
                    name: label
                }))
            )
        });
    }

    async removeLabel(contentId, labelName) {
        return await this.request(`/content/${contentId}/label?name=${labelName}`, {
            method: 'DELETE'
        });
    }

    /**
     * Comments and Feedback
     */
    async getComments(contentId, options = {}) {
        const params = new URLSearchParams({
            start: options.start || 0,
            limit: options.limit || 25,
            location: options.location || '',
            depth: options.depth || 'all'
        });

        return await this.request(`/content/${contentId}/child/comment?${params}`);
    }

    async createComment(contentId, commentData) {
        return await this.request('/content', {
            method: 'POST',
            body: JSON.stringify({
                type: 'comment',
                container: {
                    id: contentId
                },
                body: {
                    storage: {
                        value: commentData.body,
                        representation: 'storage'
                    }
                }
            })
        });
    }

    /**
     * Analytics and Reporting
     */
    async getContentAnalytics(contentId, options = {}) {
        // Note: This might require additional permissions or Confluence Analytics
        try {
            const content = await this.getContentById(contentId, { expand: ['history', 'version'] });
            const comments = await this.getComments(contentId);
            const labels = await this.getLabels(contentId);

            return {
                content: {
                    id: content.id,
                    title: content.title,
                    type: content.type,
                    created: content.history.createdDate,
                    lastModified: content.version.when,
                    version: content.version.number
                },
                engagement: {
                    comments: comments.size,
                    labels: labels.results.length
                },
                history: content.history
            };
        } catch (error) {
            throw new Error(`Failed to get analytics for content ${contentId}: ${error.message}`);
        }
    }

    async getSpaceAnalytics(spaceKey) {
        const [space, pages, blogPosts] = await Promise.all([
            this.getSpace(spaceKey),
            this.getPages(spaceKey, { limit: 1000 }),
            this.getBlogPosts(spaceKey, { limit: 1000 })
        ]);

        const totalContent = pages.size + blogPosts.size;
        const recentContent = [...pages.results, ...blogPosts.results]
            .filter(content => {
                const created = new Date(content.history.createdDate);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return created > monthAgo;
            });

        return {
            space: {
                key: space.key,
                name: space.name,
                type: space.type
            },
            content: {
                totalPages: pages.size,
                totalBlogPosts: blogPosts.size,
                totalContent,
                recentContent: recentContent.length
            },
            activity: {
                contentCreatedLastMonth: recentContent.length,
                averageContentPerMonth: totalContent / 12 // Rough estimate
            }
        };
    }

    /**
     * Template Management
     */
    async getTemplates(spaceKey = null) {
        const params = new URLSearchParams({
            spaceKey: spaceKey || '',
            start: 0,
            limit: 25
        });

        return await this.request(`/template?${params}`);
    }

    async createTemplate(templateData) {
        return await this.request('/template', {
            method: 'POST',
            body: JSON.stringify({
                name: templateData.name,
                description: templateData.description || '',
                templateType: templateData.type || 'page',
                body: {
                    storage: {
                        value: templateData.body,
                        representation: 'storage'
                    }
                },
                space: templateData.spaceKey ? { key: templateData.spaceKey } : null
            })
        });
    }

    /**
     * Permissions and Restrictions
     */
    async getContentRestrictions(contentId) {
        return await this.request(`/content/${contentId}/restriction`);
    }

    async addContentRestriction(contentId, restrictionData) {
        return await this.request(`/content/${contentId}/restriction`, {
            method: 'POST',
            body: JSON.stringify({
                operation: restrictionData.operation || 'read',
                restrictions: {
                    user: restrictionData.users || [],
                    group: restrictionData.groups || []
                }
            })
        });
    }

    /**
     * Export and Backup
     */
    async exportSpace(spaceKey, format = 'pdf') {
        // Note: This is a simplified export - actual implementation may vary
        const pages = await this.getPages(spaceKey, { 
            expand: ['body.storage'],
            limit: 1000 
        });

        const exportData = {
            space: await this.getSpace(spaceKey),
            pages: pages.results,
            exportDate: new Date().toISOString(),
            format
        };

        return exportData;
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const response = await this.getCurrentUser();
            return {
                status: 'healthy',
                user: response.displayName,
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
            name: 'Confluence',
            version: this.apiVersion,
            baseUrl: this.config.baseUrl,
            username: this.config.username,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null
        };
    }
}

// Export for use in other modules
window.ConfluenceConnector = ConfluenceConnector;
export default ConfluenceConnector;