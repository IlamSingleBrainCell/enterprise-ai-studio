/**
 * Enterprise Deployment Integration
 * Direct deployment to enterprise connectors with one-click deployment
 */

class EnterpriseDeploymentManager {
    constructor() {
        this.deploymentQueue = [];
        this.activeDeployments = new Map();
        this.deploymentHistory = [];
        this.connectors = new Map();
        
        this.initializeConnectors();
    }

    /**
     * Initialize enterprise connectors
     */
    async initializeConnectors() {
        try {
            // Import existing connectors
            const { GitHubEnterpriseConnector } = await import('./github-enterprise-connector.js');
            const { JiraAgileConnector } = await import('./jira-agile-connector.js');
            const { JenkinsConnector } = await import('./jenkins-connector.js');
            const { DockerConnector } = await import('./docker-connector.js');
            const { AWSConnector } = await import('./aws-connector.js');
            const { AzureConnector } = await import('./azure-connector.js');
            const { GCPConnector } = await import('./gcp-connector.js');

            // Register connectors
            this.connectors.set('github', new GitHubEnterpriseConnector());
            this.connectors.set('jira', new JiraAgileConnector());
            this.connectors.set('jenkins', new JenkinsConnector());
            this.connectors.set('docker', new DockerConnector());
            this.connectors.set('aws', new AWSConnector());
            this.connectors.set('azure', new AzureConnector());
            this.connectors.set('gcp', new GCPConnector());

        } catch (error) {
            console.warn('Some connectors failed to load:', error);
        }
    }

    /**
     * Deploy project to selected enterprise services
     */
    async deployProject(projectData, deploymentConfig) {
        const deploymentId = this.generateDeploymentId();
        
        try {
            const deployment = {
                id: deploymentId,
                projectName: projectData.metadata.name,
                startTime: new Date(),
                status: 'in-progress',
                stages: [],
                selectedServices: deploymentConfig.services || [],
                config: deploymentConfig
            };

            this.activeDeployments.set(deploymentId, deployment);

            // Execute deployment pipeline
            await this.executeDeploymentPipeline(deploymentId, projectData, deploymentConfig);

            return {
                success: true,
                deploymentId,
                status: deployment.status,
                stages: deployment.stages
            };

        } catch (error) {
            this.updateDeploymentStatus(deploymentId, 'failed', error.message);
            throw error;
        }
    }

    /**
     * Execute complete deployment pipeline
     */
    async executeDeploymentPipeline(deploymentId, projectData, config) {
        const deployment = this.activeDeployments.get(deploymentId);
        const services = config.services || [];

        // Stage 1: Source Code Repository (GitHub)
        if (services.includes('github')) {
            await this.executeStage(deploymentId, 'github-repo', async () => {
                const githubConnector = this.connectors.get('github');
                return await githubConnector.createRepository({
                    name: projectData.metadata.name,
                    description: projectData.metadata.description,
                    files: projectData.files,
                    private: config.github?.private || false,
                    autoInit: true
                });
            });
        }

        // Stage 2: Project Management (JIRA)
        if (services.includes('jira')) {
            await this.executeStage(deploymentId, 'jira-project', async () => {
                const jiraConnector = this.connectors.get('jira');
                return await jiraConnector.createProject({
                    name: projectData.metadata.name,
                    description: projectData.metadata.description,
                    projectType: 'software',
                    lead: config.jira?.projectLead || config.user?.email
                });
            });
        }

        // Stage 3: CI/CD Pipeline (Jenkins)
        if (services.includes('jenkins')) {
            await this.executeStage(deploymentId, 'jenkins-pipeline', async () => {
                const jenkinsConnector = this.connectors.get('jenkins');
                return await jenkinsConnector.createPipeline({
                    name: `${projectData.metadata.name}-pipeline`,
                    repoUrl: deployment.stages.find(s => s.name === 'github-repo')?.result?.repoUrl,
                    buildScript: this.generateBuildScript(projectData.metadata.language, projectData.metadata.framework),
                    deploymentTargets: config.jenkins?.deploymentTargets || ['staging']
                });
            });
        }

        // Stage 4: Container Registry (Docker)
        if (services.includes('docker')) {
            await this.executeStage(deploymentId, 'docker-registry', async () => {
                const dockerConnector = this.connectors.get('docker');
                return await dockerConnector.createRepository({
                    name: projectData.metadata.name.toLowerCase().replace(/\s+/g, '-'),
                    description: projectData.metadata.description,
                    dockerfile: projectData.files.get('Dockerfile') || projectData.files.get('Dockerfile.prod'),
                    autoTrigger: true
                });
            });
        }

        // Stage 5: Cloud Infrastructure (AWS/Azure/GCP)
        const cloudProvider = config.cloudProvider || 'aws';
        if (services.includes(cloudProvider)) {
            await this.executeStage(deploymentId, `${cloudProvider}-infrastructure`, async () => {
                const cloudConnector = this.connectors.get(cloudProvider);
                return await cloudConnector.provisionInfrastructure({
                    projectName: projectData.metadata.name,
                    environment: config.environment || 'development',
                    resources: config.cloudResources || this.getDefaultCloudResources(projectData.metadata),
                    region: config.region || 'us-east-1'
                });
            });
        }

        // Stage 6: Application Deployment
        if (services.includes('deployment')) {
            await this.executeStage(deploymentId, 'app-deployment', async () => {
                return await this.deployApplication(deploymentId, projectData, config);
            });
        }

        // Complete deployment
        this.updateDeploymentStatus(deploymentId, 'completed');
        this.moveToHistory(deploymentId);
    }

    /**
     * Execute individual deployment stage
     */
    async executeStage(deploymentId, stageName, stageFunction) {
        const deployment = this.activeDeployments.get(deploymentId);
        const stage = {
            name: stageName,
            startTime: new Date(),
            status: 'running'
        };

        deployment.stages.push(stage);

        try {
            const result = await stageFunction();
            stage.status = 'completed';
            stage.endTime = new Date();
            stage.result = result;
            stage.duration = stage.endTime - stage.startTime;

            return result;
        } catch (error) {
            stage.status = 'failed';
            stage.endTime = new Date();
            stage.error = error.message;
            stage.duration = stage.endTime - stage.startTime;
            throw error;
        }
    }

    /**
     * Deploy application to cloud infrastructure
     */
    async deployApplication(deploymentId, projectData, config) {
        const deployment = this.activeDeployments.get(deploymentId);
        const cloudProvider = config.cloudProvider || 'aws';
        const cloudConnector = this.connectors.get(cloudProvider);

        // Get infrastructure details from previous stage
        const infraStage = deployment.stages.find(s => s.name === `${cloudProvider}-infrastructure`);
        if (!infraStage || infraStage.status !== 'completed') {
            throw new Error(`Infrastructure provisioning required before deployment`);
        }

        const deploymentConfig = {
            applicationName: projectData.metadata.name,
            version: projectData.metadata.version || '1.0.0',
            environment: config.environment || 'development',
            infrastructure: infraStage.result,
            containerImage: this.getContainerImageUrl(deploymentId, projectData),
            envVariables: config.envVariables || {},
            scaling: config.scaling || { min: 1, max: 3 }
        };

        return await cloudConnector.deployApplication(deploymentConfig);
    }

    /**
     * Generate build script based on project type
     */
    generateBuildScript(language, framework) {
        const scripts = {
            'typescript-react': `
#!/bin/bash
echo "Building React TypeScript application..."
npm install
npm run test -- --coverage --watchAll=false
npm run build
echo "Build completed successfully"`,
            'python-fastapi': `
#!/bin/bash
echo "Building Python FastAPI application..."
pip install -r requirements.txt
python -m pytest
docker build -t $JOB_NAME:$BUILD_NUMBER .
echo "Build completed successfully"`
        };

        const key = `${language}-${framework}`.toLowerCase();
        return scripts[key] || scripts['typescript-react'];
    }

    /**
     * Get default cloud resources based on project type
     */
    getDefaultCloudResources(metadata) {
        const baseResources = {
            compute: {
                type: 'container',
                cpu: '0.5 vCPU',
                memory: '1 GB',
                storage: '10 GB'
            },
            networking: {
                publicAccess: true,
                loadBalancer: true,
                autoScaling: true
            },
            database: {
                type: 'managed',
                engine: 'postgresql',
                size: 'small'
            },
            monitoring: {
                logs: true,
                metrics: true,
                alerts: true
            }
        };

        // Adjust based on project requirements
        if (metadata.description.toLowerCase().includes('large scale') || 
            metadata.description.toLowerCase().includes('enterprise')) {
            baseResources.compute.cpu = '2 vCPU';
            baseResources.compute.memory = '4 GB';
            baseResources.database.size = 'medium';
        }

        return baseResources;
    }

    /**
     * Get container image URL from Docker stage
     */
    getContainerImageUrl(deploymentId, projectData) {
        const deployment = this.activeDeployments.get(deploymentId);
        const dockerStage = deployment.stages.find(s => s.name === 'docker-registry');
        
        if (dockerStage && dockerStage.result) {
            return dockerStage.result.imageUrl;
        }

        // Fallback to default naming convention
        const imageName = projectData.metadata.name.toLowerCase().replace(/\s+/g, '-');
        return `docker.io/myorg/${imageName}:latest`;
    }

    /**
     * Update deployment status
     */
    updateDeploymentStatus(deploymentId, status, error = null) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (deployment) {
            deployment.status = status;
            deployment.endTime = new Date();
            if (error) {
                deployment.error = error;
            }
        }
    }

    /**
     * Move completed deployment to history
     */
    moveToHistory(deploymentId) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (deployment) {
            this.deploymentHistory.push({
                ...deployment,
                completedAt: new Date()
            });
            this.activeDeployments.delete(deploymentId);
        }
    }

    /**
     * Generate unique deployment ID
     */
    generateDeploymentId() {
        return 'deploy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get deployment status
     */
    getDeploymentStatus(deploymentId) {
        return this.activeDeployments.get(deploymentId) || 
               this.deploymentHistory.find(d => d.id === deploymentId);
    }

    /**
     * Get all deployments
     */
    getAllDeployments() {
        return {
            active: Array.from(this.activeDeployments.values()),
            history: this.deploymentHistory,
            total: this.activeDeployments.size + this.deploymentHistory.length
        };
    }

    /**
     * Cancel active deployment
     */
    async cancelDeployment(deploymentId) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found or already completed');
        }

        deployment.status = 'cancelled';
        deployment.endTime = new Date();
        
        // Try to cleanup any resources that were created
        for (const stage of deployment.stages) {
            if (stage.status === 'completed' && stage.result && stage.result.cleanup) {
                try {
                    await stage.result.cleanup();
                } catch (error) {
                    console.warn(`Failed to cleanup stage ${stage.name}:`, error);
                }
            }
        }

        this.moveToHistory(deploymentId);
        return { success: true, message: 'Deployment cancelled successfully' };
    }

    /**
     * Get deployment logs
     */
    getDeploymentLogs(deploymentId) {
        const deployment = this.getDeploymentStatus(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }

        const logs = [];
        logs.push(`Deployment ${deploymentId} started at ${deployment.startTime}`);
        
        for (const stage of deployment.stages) {
            logs.push(`Stage ${stage.name} started at ${stage.startTime}`);
            if (stage.status === 'completed') {
                logs.push(`Stage ${stage.name} completed in ${stage.duration}ms`);
            } else if (stage.status === 'failed') {
                logs.push(`Stage ${stage.name} failed: ${stage.error}`);
            }
        }

        if (deployment.endTime) {
            logs.push(`Deployment ${deployment.status} at ${deployment.endTime}`);
        }

        return logs;
    }

    /**
     * Test connector connections
     */
    async testConnectors() {
        const results = new Map();
        
        for (const [name, connector] of this.connectors) {
            try {
                const testResult = await connector.testConnection();
                results.set(name, {
                    status: testResult ? 'connected' : 'failed',
                    lastTested: new Date()
                });
            } catch (error) {
                results.set(name, {
                    status: 'error',
                    error: error.message,
                    lastTested: new Date()
                });
            }
        }

        return Object.fromEntries(results);
    }
}

// Export for use in other modules
window.EnterpriseDeploymentManager = EnterpriseDeploymentManager;
export default EnterpriseDeploymentManager;