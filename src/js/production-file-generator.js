/**
 * Production File Generation System
 * Creates actual downloadable project files with complete project structure
 */

class ProductionFileGenerator {
    constructor() {
        this.generatedFiles = new Map();
        this.projectMetadata = null;
        this.templates = new Map();
        
        this.initializeTemplates();
    }

    /**
     * Initialize code templates for different languages and frameworks
     */
    initializeTemplates() {
        // React TypeScript Template
        this.templates.set('react-typescript', {
            'package.json': {
                type: 'json',
                content: (projectName, description) => ({
                    name: projectName.toLowerCase().replace(/\s+/g, '-'),
                    version: '0.1.0',
                    description: description,
                    private: true,
                    dependencies: {
                        react: '^18.2.0',
                        'react-dom': '^18.2.0',
                        'react-scripts': '5.0.1',
                        typescript: '^4.9.5',
                        '@types/react': '^18.2.0',
                        '@types/react-dom': '^18.2.0'
                    },
                    scripts: {
                        start: 'react-scripts start',
                        build: 'react-scripts build',
                        test: 'react-scripts test',
                        eject: 'react-scripts eject'
                    },
                    browserslist: {
                        production: ['>0.2%', 'not dead', 'not op_mini all'],
                        development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
                    }
                })
            },
            'src/App.tsx': {
                type: 'typescript',
                content: (projectName, description) => `import React from 'react';
import './App.css';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${projectName}</h1>
        <p>${description}</p>
        <div className="feature-grid">
          {/* Generated components will be added here */}
        </div>
      </header>
    </div>
  );
};

export default App;`
            },
            'src/App.css': {
                type: 'css',
                content: () => `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
  max-width: 1200px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-card h3 {
  margin-top: 0;
  color: #61dafb;
}

.feature-card p {
  line-height: 1.6;
}`
            },
            'src/index.tsx': {
                type: 'typescript',
                content: () => `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
            },
            'src/index.css': {
                type: 'css',
                content: () => `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}`
            },
            'public/index.html': {
                type: 'html',
                content: (projectName, description) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${description}" />
    <title>${projectName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
            },
            'README.md': {
                type: 'markdown',
                content: (projectName, description) => `# ${projectName}

${description}

## Getting Started

This project was generated using the Macquarie CGM Post Trade AI-Powered SDLC Platform.

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm build\` - Builds the app for production
- \`npm test\` - Launches the test runner
- \`npm eject\` - Ejects from Create React App (one-way operation)

## Project Structure

\`\`\`
${projectName.toLowerCase().replace(/\s+/g, '-')}/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── package.json
└── README.md
\`\`\`

## Features

- ⚡ Fast development with React Hot Reload
- 🎨 Modern UI with CSS Grid and Flexbox
- 📱 Responsive design
- 🔧 TypeScript for type safety
- 🧪 Testing setup with Jest
- 🚀 Production build optimization

## Generated by AI Agents

This project was created through an AI-powered SDLC workflow:

1. **Requirements Analysis** - Project requirements analyzed and documented
2. **User Story Generation** - Features broken down into user stories
3. **Code Generation** - Complete application code generated
4. **Testing Strategy** - Test cases and quality assurance plan created
5. **Deployment Configuration** - Production deployment setup included

## Next Steps

1. Customize the application to match your specific requirements
2. Add additional features and components
3. Implement backend API integration if needed
4. Set up CI/CD pipeline for automated deployment
5. Configure monitoring and analytics

## Support

Generated by Macquarie CGM Post Trade AI-Powered SDLC Platform
For support and questions, contact your development team.`
            },
            'tsconfig.json': {
                type: 'json',
                content: () => ({
                    compilerOptions: {
                        target: 'es5',
                        lib: ['dom', 'dom.iterable', 'esnext'],
                        allowJs: true,
                        skipLibCheck: true,
                        esModuleInterop: true,
                        allowSyntheticDefaultImports: true,
                        strict: true,
                        forceConsistentCasingInFileNames: true,
                        noFallthroughCasesInSwitch: true,
                        module: 'esnext',
                        moduleResolution: 'node',
                        resolveJsonModule: true,
                        isolatedModules: true,
                        noEmit: true,
                        jsx: 'react-jsx'
                    },
                    include: ['src'],
                    exclude: ['node_modules']
                })
            }
        });

        // Python FastAPI Template
        this.templates.set('python-fastapi', {
            'main.py': {
                type: 'python',
                content: (projectName, description) => `"""
${projectName}
${description}

Generated by Macquarie CGM Post Trade AI-Powered SDLC Platform
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="${projectName}",
    description="${description}",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    completed: bool = False

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None

# In-memory storage (replace with database in production)
items_db: List[Item] = []
next_id = 1

@app.get("/")
async def root():
    return {
        "message": "Welcome to ${projectName}",
        "description": "${description}",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/items", response_model=List[Item])
async def get_items():
    return items_db

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    for item in items_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.post("/items", response_model=Item)
async def create_item(item: ItemCreate):
    global next_id
    new_item = Item(
        id=next_id,
        name=item.name,
        description=item.description,
        completed=False
    )
    items_db.append(new_item)
    next_id += 1
    return new_item

@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, item_update: ItemCreate):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            items_db[i].name = item_update.name
            items_db[i].description = item_update.description
            return items_db[i]
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            del items_db[i]
            return {"message": "Item deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)`
            },
            'requirements.txt': {
                type: 'text',
                content: () => `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6`
            },
            'Dockerfile': {
                type: 'docker',
                content: (projectName) => `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
            },
            'docker-compose.yml': {
                type: 'yaml',
                content: (projectName) => `version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENV=development
    volumes:
      - .:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Add database service if needed
  # db:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_DB: ${projectName.toLowerCase().replace(/\s+/g, '_')}
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   ports:
  #     - "5432:5432"
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data

# volumes:
#   postgres_data:`
            }
        });
    }

    /**
     * Generate project files with AI-powered content
     */
    async generateProjectFiles(projectContext) {
        try {
            // Initialize Gemini API if not available
            if (!window.geminiConfig) {
                window.geminiConfig = new ProductionGeminiConfig();
            }

            const files = [];
            
            // Generate package.json with AI-enhanced content
            const packageJsonPrompt = `Create a professional package.json for ${projectContext.name}. 
Description: ${projectContext.description}
Technology: ${projectContext.technology}
Features: ${projectContext.features.join(', ')}
Include appropriate dependencies for a modern ${projectContext.technology} application.`;

            const packageJsonContent = await window.geminiConfig.makeRequest(packageJsonPrompt, {
                maxTokens: 800,
                temperature: 0.3
            });

            files.push({
                path: 'package.json',
                content: packageJsonContent,
                description: 'Project configuration and dependencies',
                type: 'json'
            });

            // Generate main application component
            const appComponentPrompt = `Create a professional React TypeScript component for ${projectContext.name}.
Description: ${projectContext.description}
Features to include: ${projectContext.features.join(', ')}
Compliance requirements: ${projectContext.compliance.join(', ')}
Create a modern, professional component with proper TypeScript types.`;

            const appContent = await window.geminiConfig.makeRequest(appComponentPrompt, {
                maxTokens: 1200,
                temperature: 0.4
            });

            files.push({
                path: 'src/App.tsx',
                content: appContent,
                description: 'Main application component',
                type: 'tsx'
            });

            // Generate README with AI content
            const readmePrompt = `Create a comprehensive README.md for ${projectContext.name}.
Description: ${projectContext.description}
Technology: ${projectContext.technology}
Features: ${projectContext.features.join(', ')}
Compliance: ${projectContext.compliance.join(', ')}
Include installation, usage, and development instructions.`;

            const readmeContent = await window.geminiConfig.makeRequest(readmePrompt, {
                maxTokens: 1000,
                temperature: 0.3
            });

            files.push({
                path: 'README.md',
                content: readmeContent,
                description: 'Project documentation',
                type: 'markdown'
            });

            // Generate API service file
            const apiServicePrompt = `Create a TypeScript API service module for ${projectContext.name}.
Description: ${projectContext.description}
Features: ${projectContext.features.join(', ')}
Include proper error handling, TypeScript interfaces, and modern async/await patterns.`;

            const apiServiceContent = await window.geminiConfig.makeRequest(apiServicePrompt, {
                maxTokens: 1000,
                temperature: 0.4
            });

            files.push({
                path: 'src/services/api.ts',
                content: apiServiceContent,
                description: 'API service layer',
                type: 'typescript'
            });

            // Generate test file
            const testPrompt = `Create comprehensive Jest/RTL tests for a ${projectContext.technology} application named ${projectContext.name}.
Features to test: ${projectContext.features.join(', ')}
Include unit tests and integration tests with proper TypeScript types.`;

            const testContent = await window.geminiConfig.makeRequest(testPrompt, {
                maxTokens: 800,
                temperature: 0.3
            });

            files.push({
                path: 'src/__tests__/App.test.tsx',
                content: testContent,
                description: 'Test suite',
                type: 'test'
            });

            // Generate Docker configuration
            const dockerPrompt = `Create a production-ready Dockerfile for a ${projectContext.technology} application.
Include multi-stage build, security best practices, and optimizations.`;

            const dockerContent = await window.geminiConfig.makeRequest(dockerPrompt, {
                maxTokens: 600,
                temperature: 0.2
            });

            files.push({
                path: 'Dockerfile',
                content: dockerContent,
                description: 'Container configuration',
                type: 'docker'
            });

            // Generate CI/CD pipeline
            const cicdPrompt = `Create a GitHub Actions workflow for ${projectContext.name}.
Technology: ${projectContext.technology}
Include build, test, security scanning, and deployment stages.`;

            const cicdContent = await window.geminiConfig.makeRequest(cicdPrompt, {
                maxTokens: 800,
                temperature: 0.3
            });

            files.push({
                path: '.github/workflows/ci-cd.yml',
                content: cicdContent,
                description: 'CI/CD pipeline configuration',
                type: 'yaml'
            });

            return files;

        } catch (error) {
            throw new Error(`Failed to generate project files: ${error.message}`);
        }
    }

    /**
     * Generate complete project files based on requirements
     */
    async generateProject(requirements, language, framework, additionalOptions = {}) {
        try {
            this.generatedFiles.clear();
            
            // Parse project metadata
            this.projectMetadata = this.parseRequirements(requirements, language, framework);
            
            // Select appropriate template
            const templateKey = this.getTemplateKey(language, framework);
            const template = this.templates.get(templateKey);
            
            if (!template) {
                throw new Error(`No template found for ${language} with ${framework}`);
            }

            // Generate files from template
            for (const [filePath, fileConfig] of Object.entries(template)) {
                let content;
                
                if (typeof fileConfig.content === 'function') {
                    content = fileConfig.content(
                        this.projectMetadata.name,
                        this.projectMetadata.description,
                        this.projectMetadata
                    );
                } else {
                    content = fileConfig.content;
                }

                // Convert objects to formatted strings
                if (fileConfig.type === 'json' && typeof content === 'object') {
                    content = JSON.stringify(content, null, 2);
                }

                this.generatedFiles.set(filePath, {
                    content,
                    type: fileConfig.type,
                    size: new Blob([content]).size,
                    lastModified: new Date()
                });
            }

            // Generate additional files based on requirements
            await this.generateAdditionalFiles(requirements, additionalOptions);

            return {
                success: true,
                fileCount: this.generatedFiles.size,
                totalSize: this.getTotalSize(),
                files: Array.from(this.generatedFiles.keys())
            };

        } catch (error) {
            throw new Error(`Project generation failed: ${error.message}`);
        }
    }

    /**
     * Parse requirements to extract project metadata
     */
    parseRequirements(requirements, language, framework) {
        // Extract project name from requirements
        const nameMatch = requirements.match(/create (?:a |an )?(.+?)(?:\s+(?:app|application|system|platform|tool))/i);
        const projectName = nameMatch ? nameMatch[1].trim() : 'Generated Project';

        return {
            name: projectName,
            description: requirements,
            language,
            framework,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Get template key based on language and framework
     */
    getTemplateKey(language, framework) {
        const key = `${language}-${framework}`.toLowerCase();
        
        // Map common combinations
        const mappings = {
            'typescript-react': 'react-typescript',
            'javascript-react': 'react-typescript',
            'python-fastapi': 'python-fastapi',
            'python-django': 'python-fastapi' // Use FastAPI as default
        };

        return mappings[key] || 'react-typescript'; // Default fallback
    }

    /**
     * Generate additional files based on specific requirements
     */
    async generateAdditionalFiles(requirements, options) {
        // Generate test files
        if (options.includeTests !== false) {
            this.generateTestFiles(requirements);
        }

        // Generate deployment configuration
        if (options.includeDeployment !== false) {
            this.generateDeploymentFiles();
        }

        // Generate documentation
        if (options.includeDocumentation !== false) {
            this.generateDocumentationFiles(requirements);
        }
    }

    /**
     * Generate test files
     */
    generateTestFiles(requirements) {
        if (this.projectMetadata.language === 'typescript' || this.projectMetadata.language === 'javascript') {
            this.generatedFiles.set('src/__tests__/App.test.tsx', {
                content: `import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  test('renders project title', () => {
    render(<App />);
    const titleElement = screen.getByText('${this.projectMetadata.name}');
    expect(titleElement).toBeInTheDocument();
  });

  test('renders project description', () => {
    render(<App />);
    const descElement = screen.getByText('${this.projectMetadata.description}');
    expect(descElement).toBeInTheDocument();
  });

  test('has proper app structure', () => {
    render(<App />);
    const appElement = screen.getByTestId('app-container');
    expect(appElement).toHaveClass('App');
  });
});`,
                type: 'typescript',
                size: 0,
                lastModified: new Date()
            });
        }
    }

    /**
     * Generate deployment files
     */
    generateDeploymentFiles() {
        // GitHub Actions workflow
        this.generatedFiles.set('.github/workflows/ci-cd.yml', {
            content: `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: echo "Deploy to your production environment"`,
            type: 'yaml',
            size: 0,
            lastModified: new Date()
        });

        // Docker configuration for multi-stage builds
        this.generatedFiles.set('Dockerfile.prod', {
            content: `# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
            type: 'docker',
            size: 0,
            lastModified: new Date()
        });
    }

    /**
     * Generate documentation files
     */
    generateDocumentationFiles(requirements) {
        this.generatedFiles.set('docs/API.md', {
            content: `# API Documentation

## Overview

This document describes the API endpoints for ${this.projectMetadata.name}.

## Base URL

\`\`\`
http://localhost:8000
\`\`\`

## Authentication

Currently, no authentication is required. In production, implement proper authentication.

## Endpoints

### Health Check

\`\`\`
GET /health
\`\`\`

Returns the health status of the API.

### Get All Items

\`\`\`
GET /items
\`\`\`

Returns a list of all items.

### Create Item

\`\`\`
POST /items
Content-Type: application/json

{
  "name": "string",
  "description": "string"
}
\`\`\`

Creates a new item.

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.`,
            type: 'markdown',
            size: 0,
            lastModified: new Date()
        });
    }

    /**
     * Create downloadable ZIP file
     */
    async createDownloadableZip() {
        if (this.generatedFiles.size === 0) {
            throw new Error('No files generated. Please run generateProject first.');
        }

        // Use JSZip library for creating ZIP files
        const JSZip = window.JSZip || await this.loadJSZip();
        const zip = new JSZip();

        // Add all generated files to ZIP
        for (const [filePath, fileData] of this.generatedFiles) {
            zip.file(filePath, fileData.content);
        }

        // Generate ZIP blob
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        return zipBlob;
    }

    /**
     * Load JSZip library dynamically
     */
    async loadJSZip() {
        if (window.JSZip) {
            return window.JSZip;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error('Failed to load JSZip library'));
            document.head.appendChild(script);
        });
    }

    /**
     * Download ZIP file
     */
    async downloadProject(fileName = null) {
        try {
            const zipBlob = await this.createDownloadableZip();
            const projectName = this.projectMetadata?.name || 'generated-project';
            const downloadFileName = fileName || `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`;

            // Create download link
            const downloadUrl = URL.createObjectURL(zipBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = downloadFileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up object URL
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

            return {
                success: true,
                fileName: downloadFileName,
                size: zipBlob.size,
                fileCount: this.generatedFiles.size
            };

        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    /**
     * Get total size of generated files
     */
    getTotalSize() {
        let totalSize = 0;
        for (const [, fileData] of this.generatedFiles) {
            totalSize += fileData.size || new Blob([fileData.content]).size;
        }
        return totalSize;
    }

    /**
     * Get file list with metadata
     */
    getFileList() {
        const files = [];
        for (const [filePath, fileData] of this.generatedFiles) {
            files.push({
                path: filePath,
                type: fileData.type,
                size: fileData.size || new Blob([fileData.content]).size,
                lastModified: fileData.lastModified
            });
        }
        return files.sort((a, b) => a.path.localeCompare(b.path));
    }

    /**
     * Get file content by path
     */
    getFileContent(filePath) {
        const fileData = this.generatedFiles.get(filePath);
        return fileData ? fileData.content : null;
    }

    /**
     * Clear all generated files
     */
    clearFiles() {
        this.generatedFiles.clear();
        this.projectMetadata = null;
    }
}

// Export for use in other modules
window.ProductionFileGenerator = ProductionFileGenerator;
export default ProductionFileGenerator;