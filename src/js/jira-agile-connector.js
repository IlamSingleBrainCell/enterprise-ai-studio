/**
 * JIRA Agile Connector
 * Integration with JIRA for project management and agile workflows
 */

import { BaseConnector } from './enterprise-api-framework.js';

class JIRAAgileConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // Required config: baseUrl, username, apiToken
        if (!config.baseUrl || !config.username || !config.apiToken) {
            throw new Error('JIRA requires baseUrl, username, and apiToken in config');
        }
        
        this.apiVersion = '3';
        this.agileApiVersion = '1.0';
    }

    /**
     * Authenticate with JIRA
     */
    async authenticate() {
        try {
            // Test authentication by getting current user info
            const response = await this.makeHttpRequest(`${this.config.baseUrl}/rest/api/${this.apiVersion}/myself`, {
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
            throw new Error(`JIRA authentication failed: ${error.message}`);
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
     * Make requests to JIRA API
     */
    async request(endpoint, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const url = `${this.config.baseUrl}/rest/api/${this.apiVersion}${endpoint}`;
        
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
     * Make requests to JIRA Agile API
     */
    async agileRequest(endpoint, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const url = `${this.config.baseUrl}/rest/agile/${this.agileApiVersion}${endpoint}`;
        
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
    async getProjects(options = {}) {
        const params = new URLSearchParams({
            expand: options.expand || 'description,lead,url,projectKeys',
            maxResults: options.maxResults || 50,
            startAt: options.startAt || 0
        });

        return await this.request(`/project/search?${params}`);
    }

    async getProject(projectKey) {
        return await this.request(`/project/${projectKey}?expand=description,lead,url,projectKeys,permissions,insight`);
    }

    async createProject(projectData) {
        return await this.request('/project', {
            method: 'POST',
            body: JSON.stringify({
                key: projectData.key,
                name: projectData.name,
                projectTypeKey: projectData.projectType || 'software',
                projectTemplateKey: projectData.template || 'com.pyxis.greenhopper.jira:gh-simplified-agility-scrum',
                description: projectData.description || '',
                lead: projectData.leadAccountId,
                assigneeType: 'PROJECT_LEAD',
                categoryId: projectData.categoryId
            })
        });
    }

    /**
     * Issue Management
     */
    async getIssues(jql, options = {}) {
        const requestBody = {
            jql: jql || 'project IS NOT EMPTY',
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            fields: options.fields || ['summary', 'status', 'assignee', 'reporter', 'priority', 'created', 'updated'],
            expand: options.expand || ['names', 'schema', 'operations', 'editmeta', 'changelog', 'versionedRepresentations']
        };

        return await this.request('/search', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
    }

    async getIssue(issueKey, options = {}) {
        const params = new URLSearchParams({
            fields: options.fields ? options.fields.join(',') : '*all',
            expand: options.expand ? options.expand.join(',') : 'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations'
        });

        return await this.request(`/issue/${issueKey}?${params}`);
    }

    async createIssue(issueData) {
        return await this.request('/issue', {
            method: 'POST',
            body: JSON.stringify({
                fields: {
                    project: { key: issueData.projectKey },
                    summary: issueData.summary,
                    description: {
                        type: 'doc',
                        version: 1,
                        content: [{
                            type: 'paragraph',
                            content: [{
                                type: 'text',
                                text: issueData.description || ''
                            }]
                        }]
                    },
                    issuetype: { name: issueData.issueType || 'Task' },
                    assignee: issueData.assigneeAccountId ? { accountId: issueData.assigneeAccountId } : null,
                    priority: issueData.priority ? { name: issueData.priority } : null,
                    labels: issueData.labels || [],
                    components: issueData.components ? issueData.components.map(c => ({ name: c })) : [],
                    customfield_10020: issueData.epicLink ? { key: issueData.epicLink } : null // Epic Link
                }
            })
        });
    }

    async updateIssue(issueKey, updateData) {
        return await this.request(`/issue/${issueKey}`, {
            method: 'PUT',
            body: JSON.stringify({
                fields: updateData
            })
        });
    }

    async transitionIssue(issueKey, transitionId, comment = null) {
        const transitionData = {
            transition: { id: transitionId }
        };

        if (comment) {
            transitionData.update = {
                comment: [{
                    add: {
                        body: {
                            type: 'doc',
                            version: 1,
                            content: [{
                                type: 'paragraph',
                                content: [{
                                    type: 'text',
                                    text: comment
                                }]
                            }]
                        }
                    }
                }]
            };
        }

        return await this.request(`/issue/${issueKey}/transitions`, {
            method: 'POST',
            body: JSON.stringify(transitionData)
        });
    }

    /**
     * Sprint Management
     */
    async getBoards(options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            type: options.type || 'scrum',
            name: options.name || '',
            projectKeyOrId: options.projectKey || ''
        });

        return await this.agileRequest(`/board?${params}`);
    }

    async getBoard(boardId) {
        return await this.agileRequest(`/board/${boardId}`);
    }

    async getSprints(boardId, options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            state: options.state || 'active'
        });

        return await this.agileRequest(`/board/${boardId}/sprint?${params}`);
    }

    async createSprint(sprintData) {
        return await this.agileRequest('/sprint', {
            method: 'POST',
            body: JSON.stringify({
                name: sprintData.name,
                startDate: sprintData.startDate,
                endDate: sprintData.endDate,
                originBoardId: sprintData.boardId,
                goal: sprintData.goal || ''
            })
        });
    }

    async startSprint(sprintId) {
        return await this.agileRequest(`/sprint/${sprintId}`, {
            method: 'POST',
            body: JSON.stringify({
                state: 'active'
            })
        });
    }

    async closeSprint(sprintId) {
        return await this.agileRequest(`/sprint/${sprintId}`, {
            method: 'POST',
            body: JSON.stringify({
                state: 'closed'
            })
        });
    }

    async getSprintIssues(sprintId, options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            jql: options.jql || '',
            validateQuery: options.validateQuery || true,
            fields: options.fields ? options.fields.join(',') : 'summary,status,assignee,priority'
        });

        return await this.agileRequest(`/sprint/${sprintId}/issue?${params}`);
    }

    /**
     * Epic Management
     */
    async getEpics(boardId, options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            done: options.done || false
        });

        return await this.agileRequest(`/board/${boardId}/epic?${params}`);
    }

    async getEpicIssues(epicId, options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            jql: options.jql || '',
            validateQuery: options.validateQuery || true,
            fields: options.fields ? options.fields.join(',') : 'summary,status,assignee,priority'
        });

        return await this.agileRequest(`/epic/${epicId}/issue?${params}`);
    }

    /**
     * Backlog Management
     */
    async getBacklog(boardId, options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            jql: options.jql || '',
            validateQuery: options.validateQuery || true,
            fields: options.fields ? options.fields.join(',') : 'summary,status,assignee,priority,storyPoints'
        });

        return await this.agileRequest(`/board/${boardId}/backlog?${params}`);
    }

    async moveIssuesToBacklog(issueKeys) {
        return await this.agileRequest('/backlog/issue', {
            method: 'POST',
            body: JSON.stringify({
                issues: issueKeys
            })
        });
    }

    async moveIssuesToSprint(sprintId, issueKeys) {
        return await this.agileRequest(`/sprint/${sprintId}/issue`, {
            method: 'POST',
            body: JSON.stringify({
                issues: issueKeys
            })
        });
    }

    /**
     * Reporting and Analytics
     */
    async getSprintReport(boardId, sprintId) {
        return await this.agileRequest(`/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`);
    }

    async getBurndownChart(boardId, sprintId) {
        return await this.agileRequest(`/rapid/charts/scopechangeburndownchart?rapidViewId=${boardId}&sprintId=${sprintId}`);
    }

    async getVelocityChart(boardId) {
        return await this.agileRequest(`/rapid/charts/velocity?rapidViewId=${boardId}`);
    }

    async getCumulativeFlowDiagram(boardId, options = {}) {
        const params = new URLSearchParams({
            rapidViewId: boardId,
            swimlaneId: options.swimlaneId || '',
            columnId: options.columnId || '',
            quickFilterId: options.quickFilterId || ''
        });

        return await this.agileRequest(`/rapid/charts/cumulativeflowdiagram?${params}`);
    }

    /**
     * Workflow Management
     */
    async getWorkflows() {
        return await this.request('/workflow');
    }

    async getWorkflow(workflowId) {
        return await this.request(`/workflow/${workflowId}`);
    }

    async getTransitions(issueKey) {
        return await this.request(`/issue/${issueKey}/transitions`);
    }

    /**
     * User and Permission Management
     */
    async getUsers(options = {}) {
        const params = new URLSearchParams({
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            username: options.username || '',
            query: options.query || ''
        });

        return await this.request(`/users/search?${params}`);
    }

    async getProjectRoles(projectKey) {
        return await this.request(`/project/${projectKey}/role`);
    }

    async getProjectPermissions(projectKey) {
        return await this.request(`/project/${projectKey}/permissionscheme`);
    }

    /**
     * Custom Fields and Metadata
     */
    async getFields() {
        return await this.request('/field');
    }

    async getIssueTypes() {
        return await this.request('/issuetype');
    }

    async getPriorities() {
        return await this.request('/priority');
    }

    async getStatuses() {
        return await this.request('/status');
    }

    /**
     * Advanced Search and JQL
     */
    async searchIssues(jqlQuery, options = {}) {
        const searchData = {
            jql: jqlQuery,
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            fields: options.fields || ['key', 'summary', 'status', 'assignee', 'priority', 'created', 'updated'],
            expand: options.expand || []
        };

        return await this.request('/search', {
            method: 'POST',
            body: JSON.stringify(searchData)
        });
    }

    async validateJQL(jqlQuery) {
        return await this.request('/jql/parse', {
            method: 'POST',
            body: JSON.stringify({
                queries: [jqlQuery]
            })
        });
    }

    /**
     * Project Statistics and Analytics
     */
    async getProjectStatistics(projectKey) {
        const [
            project,
            issues,
            components,
            versions
        ] = await Promise.all([
            this.getProject(projectKey),
            this.searchIssues(`project = ${projectKey}`, { maxResults: 1000 }),
            this.request(`/project/${projectKey}/components`),
            this.request(`/project/${projectKey}/versions`)
        ]);

        const issuesByStatus = {};
        const issuesByType = {};
        const issuesByPriority = {};
        const issuesByAssignee = {};

        issues.issues.forEach(issue => {
            // Count by status
            const status = issue.fields.status.name;
            issuesByStatus[status] = (issuesByStatus[status] || 0) + 1;

            // Count by type
            const type = issue.fields.issuetype.name;
            issuesByType[type] = (issuesByType[type] || 0) + 1;

            // Count by priority
            if (issue.fields.priority) {
                const priority = issue.fields.priority.name;
                issuesByPriority[priority] = (issuesByPriority[priority] || 0) + 1;
            }

            // Count by assignee
            const assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
            issuesByAssignee[assignee] = (issuesByAssignee[assignee] || 0) + 1;
        });

        return {
            project: {
                key: project.key,
                name: project.name,
                description: project.description,
                lead: project.lead
            },
            summary: {
                totalIssues: issues.total,
                components: components.length,
                versions: versions.length
            },
            distribution: {
                byStatus: issuesByStatus,
                byType: issuesByType,
                byPriority: issuesByPriority,
                byAssignee: issuesByAssignee
            }
        };
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const response = await this.request('/myself');
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
            name: 'JIRA Agile',
            version: this.apiVersion,
            agileVersion: this.agileApiVersion,
            baseUrl: this.config.baseUrl,
            username: this.config.username,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null
        };
    }
}

// Export for use in other modules
window.JIRAAgileConnector = JIRAAgileConnector;
export default JIRAAgileConnector;