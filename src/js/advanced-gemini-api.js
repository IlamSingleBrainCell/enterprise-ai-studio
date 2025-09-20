/**
 * Advanced Gemini API Integration for SDLC Agent Orchestration
 * Supports multi-agent workflows, code generation, and enterprise integration
 */

class AdvancedGeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-1.5-flash';
        this.conversationHistory = [];
        this.activeAgents = new Map();
        this.projectContext = {};
        this.generatedFiles = new Map();
        
        // Agent definitions based on the screenshot
        this.agentDefinitions = {
            'product-manager': {
                name: 'Product Manager Agent',
                role: 'Requirements Analysis',
                icon: '📋',
                color: '#4CAF50',
                systemPrompt: `You are a Product Manager Agent specialized in analyzing business requirements and creating comprehensive project specifications. 
                Your role is to:
                1. Analyze user requirements and business objectives
                2. Create detailed project specifications
                3. Define user stories and acceptance criteria
                4. Identify technical and business constraints
                5. Provide clear guidance to development teams
                
                Always respond in a structured format with clear sections for requirements, user stories, and technical specifications.`
            },
            'business-analyst': {
                name: 'Business Analyst Agent',
                role: 'User Story Generation',
                icon: '📊',
                color: '#2196F3',
                systemPrompt: `You are a Business Analyst Agent focused on translating business requirements into actionable user stories and workflows.
                Your responsibilities include:
                1. Creating detailed user stories with acceptance criteria
                2. Mapping business processes and workflows
                3. Identifying stakeholders and their needs
                4. Creating functional specifications
                5. Ensuring alignment between business goals and technical implementation
                
                Generate user stories in standard format: As a [user type], I want [functionality] so that [benefit].`
            },
            'software-developer': {
                name: 'Software Developer Agent',
                role: 'Design Document Creation & Code Generation',
                icon: '💻',
                color: '#FF9800',
                systemPrompt: `You are a Senior Software Developer Agent responsible for technical design and code implementation.
                Your expertise covers:
                1. System architecture design and documentation
                2. Multi-language code generation (TypeScript, Python, Java, Go, C#, PHP, Rust)
                3. Database design and API specifications
                4. Best practices and design patterns
                5. Code quality and testing strategies
                
                Always provide complete, production-ready code with proper error handling, logging, and documentation.`
            },
            'qa-engineer': {
                name: 'QA Engineer Agent',
                role: 'Security Review & Test Case Generation & Quality Assurance',
                icon: '🧪',
                color: '#9C27B0',
                systemPrompt: `You are a QA Engineer Agent specializing in comprehensive testing and quality assurance.
                Your responsibilities include:
                1. Security vulnerability assessment and reviews
                2. Test case generation (unit, integration, e2e)
                3. Quality assurance strategies and metrics
                4. Performance testing recommendations
                5. Compliance and regulatory testing
                
                Provide detailed test plans, security checklists, and quality metrics for all deliverables.`
            },
            'devops-engineer': {
                name: 'DevOps Engineer Agent',
                role: 'Deployment Ready',
                icon: '🚀',
                color: '#F44336',
                systemPrompt: `You are a DevOps Engineer Agent focused on deployment automation and infrastructure.
                Your expertise includes:
                1. CI/CD pipeline configuration
                2. Infrastructure as Code (Terraform, CloudFormation)
                3. Container orchestration (Docker, Kubernetes)
                4. Cloud deployment strategies (AWS, Azure, GCP)
                5. Monitoring and observability setup
                
                Generate complete deployment configurations and infrastructure code for production-ready systems.`
            }
        };
    }

    /**
     * Initialize the API and validate connection
     */
    async initialize() {
        try {
            // Test the API connection
            const response = await this.makeRequest('gemini-pro:generateContent', {
                contents: [{
                    parts: [{ text: 'Hello, respond with "API Ready" to confirm connection.' }]
                }]
            });
            
            if (response.candidates && response.candidates[0]) {
                console.log('Gemini API initialized successfully');
                return true;
            }
            throw new Error('Invalid API response');
        } catch (error) {
            console.error('Failed to initialize Gemini API:', error);
            throw error;
        }
    }

    /**
     * Make HTTP request to Gemini API
     */
    async makeRequest(endpoint, data, options = {}) {
        const url = `${this.baseUrl}/${endpoint}?key=${this.apiKey}`;
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data)
        };

        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Start SDLC workflow with agent orchestration
     */
    async startSDLCWorkflow(projectRequirements, options = {}) {
        this.projectContext = {
            requirements: projectRequirements,
            language: options.language || 'typescript',
            framework: options.framework || 'react',
            autonomyMode: options.autonomyMode || 'semi-autonomous',
            timestamp: new Date().toISOString(),
            workflowId: this.generateWorkflowId()
        };

        this.conversationHistory = [];
        this.generatedFiles.clear();

        const workflow = {
            id: this.projectContext.workflowId,
            status: 'started',
            agents: [],
            currentStep: 0,
            results: {}
        };

        // Start with Product Manager Agent
        workflow.agents = await this.orchestrateAgents(projectRequirements);
        
        return workflow;
    }

    /**
     * Orchestrate agents in sequence based on SDLC workflow
     */
    async orchestrateAgents(requirements) {
        const agentSequence = [
            'product-manager',
            'business-analyst', 
            'software-developer',
            'qa-engineer',
            'devops-engineer'
        ];

        const results = [];
        let contextForNextAgent = requirements;

        for (const agentId of agentSequence) {
            const agent = this.agentDefinitions[agentId];
            console.log(`🤖 Starting ${agent.name}...`);
            
            const agentResult = await this.runAgent(agentId, contextForNextAgent);
            results.push(agentResult);
            
            // Pass results to next agent as context
            contextForNextAgent = {
                originalRequirements: requirements,
                previousResults: results,
                currentContext: agentResult.output
            };
        }

        return results;
    }

    /**
     * Run individual agent
     */
    async runAgent(agentId, context) {
        const agent = this.agentDefinitions[agentId];
        const startTime = Date.now();

        try {
            const prompt = this.buildAgentPrompt(agent, context);
            
            const response = await this.makeRequest(`${this.model}:generateContent`, {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    topP: 0.8,
                    topK: 40
                }
            });

            const output = response.candidates[0]?.content?.parts[0]?.text || '';
            const duration = Date.now() - startTime;

            const result = {
                agentId,
                agent: agent.name,
                role: agent.role,
                status: 'completed',
                output,
                duration,
                timestamp: new Date().toISOString()
            };

            // Extract and store generated files if any
            this.extractGeneratedFiles(agentId, output);

            this.conversationHistory.push({
                role: 'agent',
                agent: agent.name,
                content: output,
                timestamp: new Date().toISOString()
            });

            return result;

        } catch (error) {
            console.error(`Error running ${agent.name}:`, error);
            return {
                agentId,
                agent: agent.name,
                role: agent.role,
                status: 'error',
                error: error.message,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Build context-aware prompt for each agent
     */
    buildAgentPrompt(agent, context) {
        let prompt = agent.systemPrompt + '\n\n';
        
        if (typeof context === 'string') {
            prompt += `Project Requirements:\n${context}\n\n`;
        } else {
            prompt += `Project Requirements:\n${context.originalRequirements}\n\n`;
            
            if (context.previousResults) {
                prompt += 'Previous Agent Results:\n';
                context.previousResults.forEach(result => {
                    prompt += `${result.agent} (${result.role}):\n${result.output}\n\n`;
                });
            }
        }

        prompt += `Project Context:\n`;
        prompt += `- Language: ${this.projectContext.language}\n`;
        prompt += `- Framework: ${this.projectContext.framework}\n`;
        prompt += `- Autonomy Mode: ${this.projectContext.autonomyMode}\n\n`;

        // Add agent-specific instructions
        switch (agent.role) {
            case 'Requirements Analysis':
                prompt += `Please provide:
1. Detailed requirements analysis
2. Project scope and objectives
3. Technical constraints and assumptions
4. Success criteria and KPIs`;
                break;
                
            case 'User Story Generation':
                prompt += `Please provide:
1. Complete user stories with acceptance criteria
2. User journey maps
3. Functional requirements
4. Business process workflows`;
                break;
                
            case 'Design Document Creation & Code Generation':
                prompt += `Please provide:
1. System architecture design
2. Database schema and API design
3. Complete code implementation
4. File structure and organization
Format code blocks with proper file paths and complete implementations.`;
                break;
                
            case 'Security Review & Test Case Generation & Quality Assurance':
                prompt += `Please provide:
1. Security vulnerability assessment
2. Complete test cases (unit, integration, e2e)
3. Quality assurance checklist
4. Performance testing strategy`;
                break;
                
            case 'Deployment Ready':
                prompt += `Please provide:
1. Complete CI/CD pipeline configuration
2. Infrastructure as Code (Terraform/CloudFormation)
3. Docker configurations
4. Deployment scripts and documentation`;
                break;
        }

        return prompt;
    }

    /**
     * Extract generated files from agent output
     */
    extractGeneratedFiles(agentId, output) {
        // Look for code blocks with file paths
        const fileRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]*?)```/g;
        let match;

        while ((match = fileRegex.exec(output)) !== null) {
            const [, language, filePath, content] = match;
            
            if (filePath && content.trim()) {
                const fileName = filePath.trim();
                this.generatedFiles.set(fileName, {
                    path: fileName,
                    content: content.trim(),
                    language: language || 'text',
                    generatedBy: agentId,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Also look for explicit file definitions
        const explicitFileRegex = /File:\s*(.+?)\n```(\w+)?\n([\s\S]*?)```/g;
        while ((match = explicitFileRegex.exec(output)) !== null) {
            const [, filePath, language, content] = match;
            
            if (filePath && content.trim()) {
                this.generatedFiles.set(filePath.trim(), {
                    path: filePath.trim(),
                    content: content.trim(),
                    language: language || 'text',
                    generatedBy: agentId,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Generate project zip file with all generated files
     */
    async generateProjectZip() {
        if (this.generatedFiles.size === 0) {
            throw new Error('No files generated to download');
        }

        // Import JSZip dynamically
        const JSZip = (await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')).default;
        const zip = new JSZip();

        // Add generated files to zip
        for (const [path, file] of this.generatedFiles) {
            zip.file(path, file.content);
        }

        // Add project metadata
        const metadata = {
            projectName: this.extractProjectName(),
            generatedAt: new Date().toISOString(),
            workflowId: this.projectContext.workflowId,
            language: this.projectContext.language,
            framework: this.projectContext.framework,
            agentsUsed: Array.from(this.activeAgents.keys()),
            fileCount: this.generatedFiles.size
        };

        zip.file('project-metadata.json', JSON.stringify(metadata, null, 2));

        // Add README with instructions
        const readme = this.generateProjectReadme(metadata);
        zip.file('README.md', readme);

        // Generate zip blob
        const content = await zip.generateAsync({ type: 'blob' });
        
        // Trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${metadata.projectName || 'ai-generated-project'}-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return metadata;
    }

    /**
     * Deploy to enterprise connectors
     */
    async deployToConnectors(deploymentTargets = []) {
        const deploymentResults = {};

        for (const target of deploymentTargets) {
            try {
                switch (target.type) {
                    case 'github':
                        deploymentResults.github = await this.deployToGitHub(target.config);
                        break;
                    case 'jenkins':
                        deploymentResults.jenkins = await this.deployToJenkins(target.config);
                        break;
                    case 'docker':
                        deploymentResults.docker = await this.deployToDocker(target.config);
                        break;
                    case 'aws':
                        deploymentResults.aws = await this.deployToAWS(target.config);
                        break;
                    case 'azure':
                        deploymentResults.azure = await this.deployToAzure(target.config);
                        break;
                    case 'gcp':
                        deploymentResults.gcp = await this.deployToGCP(target.config);
                        break;
                }
            } catch (error) {
                deploymentResults[target.type] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        return deploymentResults;
    }

    /**
     * Deploy to GitHub
     */
    async deployToGitHub(config) {
        const enterpriseManager = window.getEnterpriseManager();
        if (!enterpriseManager) {
            throw new Error('Enterprise Service Manager not available');
        }

        const githubService = enterpriseManager.getService('github');
        if (!githubService) {
            throw new Error('GitHub service not configured');
        }

        // Create repository
        const repoName = this.extractProjectName();
        const repo = await githubService.createRepository({
            name: repoName,
            description: `AI-generated project: ${this.projectContext.requirements}`,
            private: false,
            auto_init: true
        });

        // Upload files
        for (const [path, file] of this.generatedFiles) {
            await githubService.createFile(repoName, path, file.content, `Add ${path}`);
        }

        return {
            status: 'success',
            repositoryUrl: repo.html_url,
            filesUploaded: this.generatedFiles.size
        };
    }

    /**
     * Utility methods
     */
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractProjectName() {
        const requirements = this.projectContext.requirements || '';
        const words = requirements.toLowerCase().match(/\b\w+\b/g) || [];
        return words.slice(0, 3).join('-') || 'ai-project';
    }

    generateProjectReadme(metadata) {
        return `# ${metadata.projectName}

## AI-Generated Project

This project was automatically generated using an AI-powered SDLC workflow orchestration system.

### Project Details
- **Generated At**: ${metadata.generatedAt}
- **Language**: ${metadata.language}
- **Framework**: ${metadata.framework}
- **Workflow ID**: ${metadata.workflowId}
- **Files Generated**: ${metadata.fileCount}

### AI Agents Used
${metadata.agentsUsed.map(agent => `- ${agent}`).join('\n')}

### Getting Started

1. Extract all files to your project directory
2. Install dependencies (check package.json or requirements.txt)
3. Follow the setup instructions in the generated documentation
4. Run the application using the provided scripts

### Deployment

This project includes deployment configurations for:
- Docker containers
- CI/CD pipelines
- Cloud infrastructure

Refer to the deployment documentation for specific instructions.

---
*Generated by Macquarie CGM Post Trade AI-Powered SDLC Platform*
`;
    }

    /**
     * Get conversation history for chat interface
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * Get generated files for preview
     */
    getGeneratedFiles() {
        return Array.from(this.generatedFiles.values());
    }

    /**
     * Get workflow status
     */
    getWorkflowStatus() {
        return {
            projectContext: this.projectContext,
            activeAgents: Array.from(this.activeAgents.keys()),
            filesGenerated: this.generatedFiles.size,
            conversationLength: this.conversationHistory.length
        };
    }
}

// Export for use in other modules
window.AdvancedGeminiAPI = AdvancedGeminiAPI;
export default AdvancedGeminiAPI;