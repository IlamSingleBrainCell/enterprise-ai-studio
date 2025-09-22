# API Gateway Service
# Central entry point for all microservices

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import httpx
import time
import logging
from typing import Dict, Optional
from pydantic import BaseModel
import asyncio
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Enterprise AI Gateway",
    description="API Gateway for Enterprise AI Microservices Architecture",
    version="1.0.0"
)

from pydantic import BaseModel

# Request models
class SDLCWorkflowRequest(BaseModel):
    project_name: str
    requirements: str

# Security
security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service registry
SERVICES = {
    "orchestrator": {
        "url": "http://agent-orchestrator:8002",
        "health": "/health",
        "status": "unknown"
    },
    "ai_service": {
        "url": "http://phi4-service:8001",
        "health": "/health",
        "status": "unknown"
    },
    "auth": {
        "url": "http://auth-service:8010",
        "health": "/health",
        "status": "unknown"
    },
    "monitoring": {
        "url": "http://monitoring-service:8020",
        "health": "/health",
        "status": "unknown"
    }
}

# Request tracking
request_stats = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "average_response_time": 0.0
}

class ServiceHealth(BaseModel):
    service: str
    status: str
    response_time: Optional[float] = None
    last_check: datetime

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log all requests and track metrics"""
    start_time = time.time()
    request_stats["total_requests"] += 1
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    try:
        response = await call_next(request)
        request_stats["successful_requests"] += 1
        
        # Calculate response time
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Update average response time
        request_stats["average_response_time"] = (
            request_stats["average_response_time"] * 0.9 + process_time * 0.1
        )
        
        logger.info(f"Response: {response.status_code} in {process_time:.3f}s")
        return response
        
    except Exception as e:
        request_stats["failed_requests"] += 1
        logger.error(f"Request failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )

async def check_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Simple authentication check (extend as needed)"""
    if not credentials:
        return {"user": "anonymous", "authenticated": False}
    
    # Here you would validate the token with your auth service
    # For now, we'll accept any token
    return {"user": "authenticated_user", "authenticated": True}

@app.get("/")
async def root():
    """Gateway information"""
    return {
        "service": "Enterprise AI Gateway",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "available_services": list(SERVICES.keys())
    }

@app.get("/health")
async def gateway_health():
    """Gateway health check"""
    return {
        "status": "healthy",
        "service": "api-gateway",
        "timestamp": datetime.now().isoformat(),
        "request_stats": request_stats
    }

@app.get("/services/health")
async def check_all_services():
    """Check health of all registered services"""
    health_checks = []
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for service_name, service_config in SERVICES.items():
            try:
                start_time = time.time()
                response = await client.get(f"{service_config['url']}{service_config['health']}")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    SERVICES[service_name]["status"] = "healthy"
                    status = "healthy"
                else:
                    SERVICES[service_name]["status"] = "unhealthy"
                    status = "unhealthy"
                    
            except Exception as e:
                SERVICES[service_name]["status"] = "unreachable"
                status = "unreachable"
                response_time = None
                logger.warning(f"Service {service_name} health check failed: {str(e)}")
            
            health_checks.append(ServiceHealth(
                service=service_name,
                status=status,
                response_time=response_time,
                last_check=datetime.now()
            ))
    
    return {
        "overall_status": "healthy" if all(s.status == "healthy" for s in health_checks) else "degraded",
        "services": health_checks
    }

# Orchestrator endpoints
@app.post("/api/v1/workflow/create")
async def create_workflow(request: Request, auth: dict = Depends(check_auth)):
    """Proxy to orchestrator workflow creation"""
    body = await request.body()
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{SERVICES['orchestrator']['url']}/workflow/create",
                content=body,
                headers={"content-type": "application/json"}
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Orchestrator service unavailable: {str(e)}")

@app.get("/api/v1/workflow/{workflow_id}")
async def get_workflow(workflow_id: str, auth: dict = Depends(check_auth)):
    """Get workflow status"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{SERVICES['orchestrator']['url']}/workflow/{workflow_id}"
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Orchestrator service unavailable: {str(e)}")

@app.get("/api/v1/workflows")
async def list_workflows(auth: dict = Depends(check_auth)):
    """List all workflows"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{SERVICES['orchestrator']['url']}/workflows"
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Orchestrator service unavailable: {str(e)}")

@app.post("/api/v1/workflow/sdlc")
async def create_sdlc_workflow(request: Request, auth: dict = Depends(check_auth)):
    """Create SDLC workflow"""
    body = await request.body()
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{SERVICES['orchestrator']['url']}/workflow/sdlc",
                content=body,
                headers={"content-type": "application/json"}
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Orchestrator service unavailable: {str(e)}")

@app.post("/api/test/workflow/sdlc")
async def create_sdlc_workflow_test(
    project_name: str,
    requirements: str
):
    """Create SDLC workflow (test endpoint without auth)"""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{SERVICES['orchestrator']['url']}/workflow/sdlc",
                params={
                    "project_name": project_name,
                    "requirements": requirements
                }
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Orchestrator service unavailable: {str(e)}")

@app.post("/api/test/workflow/sdlc-json")
async def create_sdlc_workflow_test_json(request: SDLCWorkflowRequest):
    """Create SDLC workflow (test endpoint with JSON body)"""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{SERVICES['orchestrator']['url']}/workflow/sdlc",
                params={
                    "project_name": request.project_name,
                    "requirements": request.requirements
                }
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Orchestrator service unavailable: {str(e)}")

# Phi-4 AI endpoints
@app.post("/api/v1/ai/generate")
async def generate_ai_response(request: Request, auth: dict = Depends(check_auth)):
    """Generate AI response using Phi-4"""
    body = await request.body()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{SERVICES['phi4']['url']}/agent/generate",
                content=body,
                headers={"content-type": "application/json"}
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

@app.post("/api/v1/ai/chat")
async def chat_with_ai(request: Request, auth: dict = Depends(check_auth)):
    """Chat with AI agent"""
    body = await request.body()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{SERVICES['phi4']['url']}/agent/chat",
                content=body,
                headers={"content-type": "application/json"}
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

@app.get("/api/v1/ai/agents")
async def get_agent_types(auth: dict = Depends(check_auth)):
    """Get available AI agent types"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{SERVICES['phi4']['url']}/agents/types"
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

@app.get("/api/v1/system/stats")
async def get_system_stats(auth: dict = Depends(check_auth)):
    """Get system statistics"""
    service_health = await check_all_services()
    
    return {
        "gateway_stats": request_stats,
        "service_health": service_health,
        "timestamp": datetime.now().isoformat()
    }

# Background task to check service health periodically
@app.on_event("startup")
async def startup_event():
    """Initialize gateway"""
    logger.info("API Gateway starting up...")
    
    # Start background health checking
    asyncio.create_task(periodic_health_check())

async def periodic_health_check():
    """Periodically check service health"""
    while True:
        try:
            await check_all_services()
            await asyncio.sleep(30)  # Check every 30 seconds
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)