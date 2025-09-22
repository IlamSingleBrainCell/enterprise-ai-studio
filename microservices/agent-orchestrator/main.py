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
PHI4_SERVICE_URL = "http://phi4-service:8001"
AGENT_SERVICES = {
    "product_manager": "http://product-manager-agent:8002",
    "business_analyst": "http://business-analyst-agent:8003",
    "software_developer": "http://software-developer-agent:8004",
    "qa_engineer": "http://qa-engineer-agent:8005",
    "devops_engineer": "http://devops-engineer-agent:8006"
}

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
        "id": workflow_id,
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
                "id": wf["id"],
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
    
    # Prepare request for Phi-4 service
    request_data = {
        "agent_type": agent_type,
        "task": task["task"],
        "context": context,
        "max_tokens": 500,
        "temperature": 0.7
    }
    
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{PHI4_SERVICE_URL}/agent/generate",
                json=request_data
            )
            response.raise_for_status()
            result_data = response.json()
        
        processing_time = time.time() - start_time
        
        return AgentResult(
            agent_type=agent_type,
            task_id=task_id,
            response=result_data["response"],
            confidence=result_data["confidence"],
            processing_time=processing_time,
            status="completed"
        )
        
    except Exception as e:
        logger.error(f"Failed to execute task for {agent_type}: {str(e)}")
        raise e

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
    uvicorn.run(app, host="0.0.0.0", port=8000)