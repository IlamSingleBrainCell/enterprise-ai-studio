# Agent Orchestrator Service
# Manages multi-agent workflows and coordination

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import asyncio
import httpx
import json
import time
from datetime import datetime
import logging
import uuid
import os
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agent Orchestrator Service",
    description="Multi-agent workflow orchestration and coordination",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkflowStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class AgentTask(BaseModel):
    agent_type: str
    task: str
    context: Dict[str, Any] = {}
    dependencies: List[str] = []
    priority: int = 1

class WorkflowRequest(BaseModel):
    workflow_id: Optional[str] = None
    project_name: str
    description: str
    tasks: List[AgentTask]
    metadata: Dict[str, Any] = {}

class WorkflowResponse(BaseModel):
    workflow_id: str
    status: WorkflowStatus
    results: Dict[str, Any] = {}
    progress: float = 0.0
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class AgentResult(BaseModel):
    agent_type: str
    task_id: str
    response: str
    confidence: float
    processing_time: float
    status: str

# In-memory workflow storage (in production, use Redis or database)
workflows: Dict[str, Dict] = {}
agent_results: Dict[str, List[AgentResult]] = {}

# Service endpoints
import os
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://phi4-service:8001")

# Optional per-agent dedicated Phi-4 service endpoints.
# Provide env vars like PRODUCT_MANAGER_PHI4_URL, BUSINESS_ANALYST_PHI4_URL, etc.
AGENT_PHI4_ENV_MAP = {
    "product_manager": "PRODUCT_MANAGER_PHI4_URL",
    "business_analyst": "BUSINESS_ANALYST_PHI4_URL",
    "software_developer": "SOFTWARE_DEVELOPER_PHI4_URL",
    "qa_engineer": "QA_ENGINEER_PHI4_URL",
    "devops_engineer": "DEVOPS_ENGINEER_PHI4_URL",
}

def resolve_agent_phi4_url(agent_type: str) -> str:
    env_var = AGENT_PHI4_ENV_MAP.get(agent_type)
    if env_var and os.getenv(env_var):
        return os.getenv(env_var)
    return AI_SERVICE_URL

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "agent-orchestrator",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/workflow/create", response_model=WorkflowResponse)
async def create_workflow(request: WorkflowRequest, background_tasks: BackgroundTasks):
    """Create and start a new multi-agent workflow"""
    
    workflow_id = request.workflow_id or str(uuid.uuid4())
    
    workflow = {
        "workflow_id": workflow_id,
        "project_name": request.project_name,
        "description": request.description,
        "tasks": [task.dict() for task in request.tasks],
        "metadata": request.metadata,
        "status": WorkflowStatus.PENDING,
        "started_at": datetime.now(),
        "completed_at": None,
        "progress": 0.0,
        "results": {},
        "error_message": None
    }
    
    workflows[workflow_id] = workflow
    agent_results[workflow_id] = []
    
    # Start workflow execution in background
    background_tasks.add_task(execute_workflow, workflow_id)
    
    return WorkflowResponse(**workflow)

@app.get("/workflow/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow_status(workflow_id: str):
    """Get workflow status and results"""
    
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows[workflow_id]
    return WorkflowResponse(**workflow)

@app.get("/workflow/{workflow_id}/results")
async def get_workflow_results(workflow_id: str):
    """Get detailed workflow results"""
    
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {
        "workflow_id": workflow_id,
        "workflow": workflows[workflow_id],
        "agent_results": agent_results.get(workflow_id, [])
    }

@app.post("/workflow/{workflow_id}/pause")
async def pause_workflow(workflow_id: str):
    """Pause workflow execution"""
    
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflows[workflow_id]["status"] = WorkflowStatus.PAUSED
    return {"message": "Workflow paused", "workflow_id": workflow_id}

@app.post("/workflow/{workflow_id}/resume")
async def resume_workflow(workflow_id: str, background_tasks: BackgroundTasks):
    """Resume paused workflow"""
    
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows[workflow_id]
    if workflow["status"] != WorkflowStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Workflow is not paused")
    
    workflow["status"] = WorkflowStatus.IN_PROGRESS
    background_tasks.add_task(execute_workflow, workflow_id)
    
    return {"message": "Workflow resumed", "workflow_id": workflow_id}

@app.get("/workflows")
async def list_workflows():
    """List all workflows"""
    
    return {
        "workflows": [
            {
                "workflow_id": wf["workflow_id"],
                "project_name": wf["project_name"],
                "status": wf["status"],
                "progress": wf["progress"],
                "started_at": wf["started_at"]
            }
            for wf in workflows.values()
        ]
    }

async def execute_workflow(workflow_id: str):
    """Execute workflow with agent coordination"""
    
    try:
        workflow = workflows[workflow_id]
        workflow["status"] = WorkflowStatus.IN_PROGRESS
        
        tasks = workflow["tasks"]
        completed_tasks = []
        total_tasks = len(tasks)
        
        logger.info(f"Starting workflow {workflow_id} with {total_tasks} tasks")
        
        # Sort tasks by priority and dependencies
        sorted_tasks = sorted(tasks, key=lambda x: (len(x["dependencies"]), -x["priority"]))
        
        for i, task in enumerate(sorted_tasks):
            # Check if workflow is paused
            if workflow["status"] == WorkflowStatus.PAUSED:
                logger.info(f"Workflow {workflow_id} paused")
                return
            
            # Check dependencies
            if not all(dep in completed_tasks for dep in task["dependencies"]):
                logger.warning(f"Dependencies not met for task {task['agent_type']}")
                continue
            
            # Execute agent task
            try:
                result = await execute_agent_task(workflow_id, task)
                agent_results[workflow_id].append(result)
                completed_tasks.append(task["agent_type"])
                
                # Update progress
                progress = (i + 1) / total_tasks * 100
                workflow["progress"] = progress
                
                # Store result in workflow
                workflow["results"][task["agent_type"]] = {
                    "response": result.response,
                    "confidence": result.confidence,
                    "processing_time": result.processing_time
                }
                
                logger.info(f"Completed task {task['agent_type']} for workflow {workflow_id}")
                
            except Exception as e:
                logger.error(f"Task {task['agent_type']} failed: {str(e)}")
                workflow["status"] = WorkflowStatus.FAILED
                workflow["error_message"] = f"Task {task['agent_type']} failed: {str(e)}"
                return
        
        # Mark workflow as completed
        workflow["status"] = WorkflowStatus.COMPLETED
        workflow["completed_at"] = datetime.now()
        workflow["progress"] = 100.0
        
        logger.info(f"Workflow {workflow_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Workflow {workflow_id} failed: {str(e)}")
        workflow["status"] = WorkflowStatus.FAILED
        workflow["error_message"] = str(e)

async def execute_agent_task(workflow_id: str, task: Dict[str, Any]) -> AgentResult:
    """Execute a single agent task"""
    
    agent_type = task["agent_type"]
    task_id = f"{workflow_id}_{agent_type}_{int(time.time())}"
    
    # Build context from previous results
    context = task.get("context", {})
    if workflow_id in workflows:
        context["previous_results"] = workflows[workflow_id]["results"]
    
    # Prepare request for Phi-4 agent endpoint
    request_data = {
        "agent_type": agent_type,
        "task": task["task"],
        "context": context,
        "max_tokens": 500,
        "temperature": 0.7
    }
    
    start_time = time.time()
    
    try:
        service_url = resolve_agent_phi4_url(agent_type)
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{service_url.rstrip('/')}/agent/generate",
                json=request_data
            )
            response.raise_for_status()
            result_data = response.json()
        
        processing_time = time.time() - start_time
        
        # Extract response from Phi-4 agent endpoint
        ai_response = result_data.get("response", "")
        confidence = result_data.get("confidence", 0.9)
        
        return AgentResult(
            agent_type=agent_type,
            task_id=task_id,
            response=ai_response,
            confidence=confidence,
            processing_time=processing_time,
            status="completed"
        )
        
    except Exception as e:
        logger.error(f"Failed to execute task for {agent_type}: {str(e)}")
        raise e

def build_agent_prompt(agent_type: str, task: str, context: Dict[str, Any]) -> str:
    """Build enhanced prompt for specific agent types"""
    
    base_prompt = f"Task: {task}\n\n"
    
    # Add context information
    if context:
        base_prompt += "Context:\n"
        for key, value in context.items():
            if key != "previous_results":
                base_prompt += f"- {key}: {value}\n"
        base_prompt += "\n"
    
    # Add previous results if available
    if "previous_results" in context and context["previous_results"]:
        base_prompt += "Previous Results:\n"
        for agent, result in context["previous_results"].items():
            base_prompt += f"- {agent}: {result.get('response', '')[:200]}...\n"
        base_prompt += "\n"
    
    # Add agent-specific instructions
    agent_instructions = {
        "product_manager": """
As a Product Manager, focus on:
- Business value and user needs
- Feature prioritization
- Market analysis and competitive landscape
- User stories and acceptance criteria
- Roadmap planning and milestones
        """,
        "business_analyst": """
As a Business Analyst, focus on:
- Requirements gathering and analysis
- Process mapping and optimization
- Stakeholder communication
- Functional and non-functional requirements
- Risk assessment and mitigation
        """,
        "software_developer": """
As a Software Developer, focus on:
- Technical architecture and design patterns
- Code structure and implementation approach
- Technology stack recommendations
- Performance and scalability considerations
- Development best practices and standards
        """,
        "qa_engineer": """
As a QA Engineer, focus on:
- Test strategy and planning
- Test case design and automation
- Quality metrics and reporting
- Bug tracking and resolution
- Performance and security testing
        """,
        "devops_engineer": """
As a DevOps Engineer, focus on:
- CI/CD pipeline design
- Infrastructure as code
- Monitoring and logging
- Deployment strategies
- Security and compliance
        """
    }
    
    if agent_type in agent_instructions:
        base_prompt += agent_instructions[agent_type]
    
    base_prompt += "\nProvide a comprehensive response addressing the task requirements:"
    
    return base_prompt

@app.post("/workflow/sdlc")
async def create_sdlc_workflow(
    project_name: str,
    requirements: str,
    background_tasks: BackgroundTasks
):
    """Create a complete SDLC workflow"""
    
    # Define SDLC workflow tasks
    sdlc_tasks = [
        AgentTask(
            agent_type="product_manager",
            task=f"Analyze requirements and create product specifications for: {requirements}",
            context={"project_name": project_name, "requirements": requirements},
            priority=5
        ),
        AgentTask(
            agent_type="business_analyst",
            task=f"Create detailed business analysis and functional requirements based on the product specifications",
            context={"project_name": project_name},
            dependencies=["product_manager"],
            priority=4
        ),
        AgentTask(
            agent_type="software_developer",
            task=f"Design system architecture and create implementation plan based on business requirements",
            context={"project_name": project_name},
            dependencies=["business_analyst"],
            priority=3
        ),
        AgentTask(
            agent_type="qa_engineer",
            task=f"Create comprehensive testing strategy and test plans for the system",
            context={"project_name": project_name},
            dependencies=["software_developer"],
            priority=2
        ),
        AgentTask(
            agent_type="devops_engineer",
            task=f"Design deployment pipeline and infrastructure for the project",
            context={"project_name": project_name},
            dependencies=["software_developer"],
            priority=1
        )
    ]
    
    workflow_request = WorkflowRequest(
        project_name=project_name,
        description=f"Complete SDLC workflow for: {requirements}",
        tasks=sdlc_tasks,
        metadata={"workflow_type": "sdlc", "requirements": requirements}
    )
    
    return await create_workflow(workflow_request, background_tasks)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)