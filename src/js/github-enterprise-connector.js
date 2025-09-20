/**
 * GitHub Enterprise Connector
 * Integration with GitHub Enterprise for repository management and CI/CD
 */

import { BaseConnector } from './enterprise-api-framework.js';

class GitHubEnterpriseConnector extends BaseConnector {
    constructor(config) {
        super(config);
        this.apiVersion = 'v3';
        this.userAgent = 'Macquarie-CGM-PostTrade/1.0';
        
        // Required config: baseUrl, token, org
        if (!config.baseUrl || !config.token || !config.org) {
            throw new Error('GitHub Enterprise requires baseUrl, token, and org in config');
        }
    }

    /**
     * Authenticate with GitHub Enterprise
     */
    async authenticate() {
        try {
            // Test the token by getting user info
            const response = await this.makeHttpRequest(`${this.config.baseUrl}/api/v3/user`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'User-Agent': this.userAgent,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            this.authenticated = true;
            this.lastAuthTime = Date.now();

            return {
                access_token: this.config.token,
                user: response.login,
                timestamp: this.lastAuthTime
            };

        } catch (error) {
            this.authenticated = false;
            throw new Error(`GitHub authentication failed: ${error.message}`);
        }
    }

    /**
     * Make requests to GitHub Enterprise API
     */
    async request(endpoint, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const url = `${this.config.baseUrl}/api/v3${endpoint}`;
        
        const requestOptions = {
            ...options,
            headers: {
                'Authorization': `token ${this.config.token}`,
                'User-Agent': this.userAgent,
                'Accept': 'application/vnd.github.v3+json',
                ...options.headers
            }
        };

        return await this.makeHttpRequest(url, requestOptions);
    }

    /**
     * Repository Management
     */
    async getRepositories(options = {}) {
        const params = new URLSearchParams({
            type: options.type || 'all',
            sort: options.sort || 'updated',
            direction: options.direction || 'desc',
            per_page: options.perPage || 30,
            page: options.page || 1
        });

        return await this.request(`/orgs/${this.config.org}/repos?${params}`);
    }

    async getRepository(repoName) {
        return await this.request(`/repos/${this.config.org}/${repoName}`);
    }

    async createRepository(repoData) {
        return await this.request(`/orgs/${this.config.org}/repos`, {
            method: 'POST',
            body: JSON.stringify({
                name: repoData.name,
                description: repoData.description || '',
                private: repoData.private || true,
                has_issues: repoData.hasIssues !== false,
                has_projects: repoData.hasProjects !== false,
                has_wiki: repoData.hasWiki !== false,
                auto_init: repoData.autoInit || true,
                gitignore_template: repoData.gitignoreTemplate,
                license_template: repoData.licenseTemplate
            })
        });
    }

    /**
     * Branch Management
     */
    async getBranches(repoName) {
        return await this.request(`/repos/${this.config.org}/${repoName}/branches`);
    }

    async createBranch(repoName, branchName, fromBranch = 'main') {
        // Get the SHA of the source branch
        const sourceRef = await this.request(`/repos/${this.config.org}/${repoName}/git/refs/heads/${fromBranch}`);
        
        return await this.request(`/repos/${this.config.org}/${repoName}/git/refs`, {
            method: 'POST',
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: sourceRef.object.sha
            })
        });
    }

    async mergeBranch(repoName, targetBranch, sourceBranch, commitMessage) {
        return await this.request(`/repos/${this.config.org}/${repoName}/merges`, {
            method: 'POST',
            body: JSON.stringify({
                base: targetBranch,
                head: sourceBranch,
                commit_message: commitMessage || `Merge ${sourceBranch} into ${targetBranch}`
            })
        });
    }

    /**
     * Pull Request Management
     */
    async getPullRequests(repoName, state = 'open') {
        return await this.request(`/repos/${this.config.org}/${repoName}/pulls?state=${state}`);
    }

    async createPullRequest(repoName, prData) {
        return await this.request(`/repos/${this.config.org}/${repoName}/pulls`, {
            method: 'POST',
            body: JSON.stringify({
                title: prData.title,
                body: prData.body || '',
                head: prData.head,
                base: prData.base,
                maintainer_can_modify: prData.maintainerCanModify !== false,
                draft: prData.draft || false
            })
        });
    }

    async mergePullRequest(repoName, pullNumber, mergeMethod = 'merge') {
        return await this.request(`/repos/${this.config.org}/${repoName}/pulls/${pullNumber}/merge`, {
            method: 'PUT',
            body: JSON.stringify({
                merge_method: mergeMethod
            })
        });
    }

    /**
     * Issue Management
     */
    async getIssues(repoName, options = {}) {
        const params = new URLSearchParams({
            state: options.state || 'open',
            labels: options.labels ? options.labels.join(',') : '',
            assignee: options.assignee || '',
            per_page: options.perPage || 30,
            page: options.page || 1
        });

        return await this.request(`/repos/${this.config.org}/${repoName}/issues?${params}`);
    }

    async createIssue(repoName, issueData) {
        return await this.request(`/repos/${this.config.org}/${repoName}/issues`, {
            method: 'POST',
            body: JSON.stringify({
                title: issueData.title,
                body: issueData.body || '',
                assignees: issueData.assignees || [],
                labels: issueData.labels || [],
                milestone: issueData.milestone
            })
        });
    }

    /**
     * Workflow and Actions Management
     */
    async getWorkflows(repoName) {
        return await this.request(`/repos/${this.config.org}/${repoName}/actions/workflows`);
    }

    async getWorkflowRuns(repoName, workflowId, options = {}) {
        const params = new URLSearchParams({
            status: options.status || '',
            branch: options.branch || '',
            per_page: options.perPage || 30,
            page: options.page || 1
        });

        return await this.request(`/repos/${this.config.org}/${repoName}/actions/workflows/${workflowId}/runs?${params}`);
    }

    async triggerWorkflow(repoName, workflowId, ref = 'main', inputs = {}) {
        return await this.request(`/repos/${this.config.org}/${repoName}/actions/workflows/${workflowId}/dispatches`, {
            method: 'POST',
            body: JSON.stringify({
                ref,
                inputs
            })
        });
    }

    /**
     * Code Analysis
     */
    async getFileContent(repoName, filePath, ref = 'main') {
        const response = await this.request(`/repos/${this.config.org}/${repoName}/contents/${filePath}?ref=${ref}`);
        
        if (response.content) {
            // Decode base64 content
            return {
                ...response,
                decodedContent: atob(response.content.replace(/\s/g, ''))
            };
        }
        
        return response;
    }

    async searchCode(query, options = {}) {
        const params = new URLSearchParams({
            q: `${query} org:${this.config.org}`,
            sort: options.sort || 'indexed',
            order: options.order || 'desc',
            per_page: options.perPage || 30,
            page: options.page || 1
        });

        return await this.request(`/search/code?${params}`);
    }

    async getCommits(repoName, options = {}) {
        const params = new URLSearchParams({
            sha: options.branch || 'main',
            path: options.path || '',
            author: options.author || '',
            since: options.since || '',
            until: options.until || '',
            per_page: options.perPage || 30,
            page: options.page || 1
        });

        return await this.request(`/repos/${this.config.org}/${repoName}/commits?${params}`);
    }

    /**
     * Organization Management
     */
    async getOrganizationMembers() {
        return await this.request(`/orgs/${this.config.org}/members`);
    }

    async getTeams() {
        return await this.request(`/orgs/${this.config.org}/teams`);
    }

    async getTeamMembers(teamSlug) {
        return await this.request(`/orgs/${this.config.org}/teams/${teamSlug}/members`);
    }

    /**
     * Webhooks Management
     */
    async getWebhooks(repoName) {
        return await this.request(`/repos/${this.config.org}/${repoName}/hooks`);
    }

    async createWebhook(repoName, webhookData) {
        return await this.request(`/repos/${this.config.org}/${repoName}/hooks`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'web',
                active: true,
                events: webhookData.events || ['push', 'pull_request'],
                config: {
                    url: webhookData.url,
                    content_type: webhookData.contentType || 'json',
                    secret: webhookData.secret || '',
                    insecure_ssl: webhookData.insecureSsl || '0'
                }
            })
        });
    }

    /**
     * Statistics and Analytics
     */
    async getRepositoryStatistics(repoName) {
        const [
            repo,
            languages,
            contributors,
            commits,
            releases
        ] = await Promise.all([
            this.getRepository(repoName),
            this.request(`/repos/${this.config.org}/${repoName}/languages`),
            this.request(`/repos/${this.config.org}/${repoName}/contributors`),
            this.getCommits(repoName, { perPage: 100 }),
            this.request(`/repos/${this.config.org}/${repoName}/releases`)
        ]);

        return {
            repository: repo,
            languages,
            contributors: contributors.length,
            recentCommits: commits.length,
            releases: releases.length,
            statistics: {
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                watchers: repo.watchers_count,
                issues: repo.open_issues_count,
                size: repo.size
            }
        };
    }

    async getOrganizationStatistics() {
        const repos = await this.getRepositories({ perPage: 100 });
        const members = await this.getOrganizationMembers();
        const teams = await this.getTeams();

        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        const languages = {};

        // Get language distribution across all repos
        for (const repo of repos.slice(0, 20)) { // Limit to avoid rate limits
            try {
                const repoLangs = await this.request(`/repos/${this.config.org}/${repo.name}/languages`);
                Object.keys(repoLangs).forEach(lang => {
                    languages[lang] = (languages[lang] || 0) + repoLangs[lang];
                });
            } catch (error) {
                // Skip repos that error out
            }
        }

        return {
            repositories: {
                total: repos.length,
                public: repos.filter(r => !r.private).length,
                private: repos.filter(r => r.private).length
            },
            members: members.length,
            teams: teams.length,
            engagement: {
                totalStars,
                totalForks,
                averageStars: totalStars / repos.length
            },
            languages: Object.keys(languages).sort((a, b) => languages[b] - languages[a]).slice(0, 10)
        };
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const response = await this.request('/rate_limit');
            return {
                status: 'healthy',
                rateLimit: response.rate,
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
            name: 'GitHub Enterprise',
            version: this.apiVersion,
            organization: this.config.org,
            baseUrl: this.config.baseUrl,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null
        };
    }
}

// Export for use in other modules
window.GitHubEnterpriseConnector = GitHubEnterpriseConnector;
export default GitHubEnterpriseConnector;