"""
Simple AI Service - A lightweight alternative to Phi-4 for microservices demo
Uses OpenAI-compatible API format
"""

import logging
import asyncio
import os
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis.asyncio as redis
import httpx
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Simple AI Service",
    description="Lightweight AI service for microservices demo",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
redis_client: Optional[redis.Redis] = None

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "simple-ai"
    max_tokens: int = 150
    temperature: float = 0.7

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict]
    usage: Dict[str, int]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    model_loaded: bool
    redis_connected: bool

@app.on_event("startup")
async def startup_event():
    """Initialize connections and services"""
    global redis_client
    
    try:
        # Initialize Redis connection
        redis_url = os.getenv("REDIS_URL", "redis://enterprise_ai_redis:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("✅ Connected to Redis")
        
        logger.info("🚀 Simple AI Service started successfully")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections"""
    global redis_client
    
    if redis_client:
        await redis_client.close()
        logger.info("✅ Redis connection closed")

async def get_redis_client() -> redis.Redis:
    """Dependency to get Redis client"""
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis not available")
    return redis_client

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    redis_connected = False
    
    try:
        if redis_client:
            await redis_client.ping()
            redis_connected = True
    except Exception:
        pass
    
    return HealthResponse(
        status="healthy" if redis_connected else "degraded",
        timestamp=datetime.utcnow().isoformat(),
        model_loaded=True,  # Always true for simple service
        redis_connected=redis_connected
    )

@app.post("/v1/chat/completions", response_model=ChatResponse)
async def create_chat_completion(
    request: ChatRequest,
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Create a chat completion using simple AI logic
    Compatible with OpenAI API format
    """
    try:
        logger.info(f"Received chat request: {len(request.messages)} messages")
        
        # Get the last user message
        user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_message = msg.content
                break
        
        # Simple AI response logic (could be enhanced with actual AI model)
        ai_response = await generate_simple_response(user_message)
        
        # Store interaction in Redis for analytics
        interaction_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_message": user_message,
            "ai_response": ai_response,
            "model": request.model,
            "tokens_used": len(ai_response.split())
        }
        
        await redis_client.lpush(
            "ai_interactions", 
            json.dumps(interaction_data)
        )
        await redis_client.ltrim("ai_interactions", 0, 999)  # Keep last 1000
        
        # Build response in OpenAI format
        response = ChatResponse(
            id=f"chatcmpl-{datetime.utcnow().timestamp()}",
            created=int(datetime.utcnow().timestamp()),
            model=request.model,
            choices=[{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": ai_response
                },
                "finish_reason": "stop"
            }],
            usage={
                "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
                "completion_tokens": len(ai_response.split()),
                "total_tokens": sum(len(msg.content.split()) for msg in request.messages) + len(ai_response.split())
            }
        )
        
        logger.info(f"Generated response: {len(ai_response)} characters")
        return response
        
    except Exception as e:
        logger.error(f"Error in chat completion: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

async def generate_simple_response(user_message: str) -> str:
    """
    Generate a simple AI response based on keywords and patterns
    This could be replaced with actual AI model inference
    """
    user_message_lower = user_message.lower()
    
    # SDLC-related responses
    if any(keyword in user_message_lower for keyword in ["requirements", "user story", "functional"]):
        return """I'll help you with requirements analysis. Here are key considerations:

1. **Functional Requirements**: Define what the system should do
2. **Non-functional Requirements**: Performance, security, usability
3. **User Stories**: As a [user], I want [goal] so that [benefit]
4. **Acceptance Criteria**: Clear, testable conditions

Would you like me to help create specific user stories or requirements for your project?"""

    elif any(keyword in user_message_lower for keyword in ["design", "architecture", "system"]):
        return """For system design and architecture, I recommend:

1. **High-Level Architecture**: Define major components and their interactions
2. **Data Flow**: Map how information moves through the system
3. **Technology Stack**: Choose appropriate technologies
4. **Scalability**: Plan for growth and performance
5. **Security**: Implement security by design

What specific aspect of the design would you like to explore?"""

    elif any(keyword in user_message_lower for keyword in ["development", "coding", "implementation"]):
        return """Development best practices include:

1. **Code Quality**: Follow coding standards and conventions
2. **Version Control**: Use Git with meaningful commit messages
3. **Testing**: Write unit tests, integration tests
4. **Documentation**: Comment code and maintain README
5. **Code Review**: Peer review before merging

What development challenges can I help you with?"""

    elif any(keyword in user_message_lower for keyword in ["testing", "qa", "quality"]):
        return """Quality assurance and testing strategy:

1. **Unit Testing**: Test individual components
2. **Integration Testing**: Test component interactions
3. **System Testing**: End-to-end functionality
4. **User Acceptance Testing**: Validate with stakeholders
5. **Performance Testing**: Load and stress testing

Which testing phase needs attention?"""

    elif any(keyword in user_message_lower for keyword in ["deployment", "release", "production"]):
        return """Deployment and release management:

1. **CI/CD Pipeline**: Automated build, test, deploy
2. **Environment Management**: Dev, staging, production
3. **Release Planning**: Feature flags, rollback strategies
4. **Monitoring**: Application and infrastructure monitoring
5. **Maintenance**: Updates, patches, support

What deployment challenges are you facing?"""

    elif any(keyword in user_message_lower for keyword in ["agile", "scrum", "sprint"]):
        return """Agile methodology guidance:

1. **Sprint Planning**: Define sprint goals and backlog
2. **Daily Standups**: Track progress and blockers
3. **Sprint Review**: Demonstrate completed work
4. **Retrospective**: Continuous improvement
5. **Backlog Management**: Prioritize and refine stories

How can I help with your agile process?"""

    elif any(keyword in user_message_lower for keyword in ["help", "assist", "support"]):
        return """I'm here to help with your software development lifecycle! I can assist with:

• Requirements Analysis & User Stories
• System Design & Architecture
• Development Best Practices
• Quality Assurance & Testing
• Deployment & Release Management
• Agile Methodology & Project Management

What specific area would you like to explore?"""

    else:
        # Default response
        return f"""I understand you're asking about: "{user_message}"

As an AI assistant for software development, I can help you with various SDLC phases:

**Planning & Analysis**: Requirements gathering, user stories, project planning
**Design**: System architecture, database design, UI/UX planning  
**Development**: Coding best practices, frameworks, code review
**Testing**: QA strategies, test planning, automation
**Deployment**: CI/CD, release management, monitoring

What specific aspect would you like to dive deeper into?"""

@app.get("/v1/models")
async def list_models():
    """List available models"""
    return {
        "object": "list",
        "data": [
            {
                "id": "simple-ai",
                "object": "model",
                "created": int(datetime.utcnow().timestamp()),
                "owned_by": "enterprise-ai"
            }
        ]
    }

@app.get("/metrics")
async def get_metrics(redis_client: redis.Redis = Depends(get_redis_client)):
    """Get service metrics"""
    try:
        interactions_count = await redis_client.llen("ai_interactions")
        recent_interactions = await redis_client.lrange("ai_interactions", 0, 9)
        
        return {
            "total_interactions": interactions_count,
            "recent_interactions": [
                json.loads(interaction) for interaction in recent_interactions
            ],
            "service_status": "healthy",
            "uptime_seconds": int(datetime.utcnow().timestamp())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")