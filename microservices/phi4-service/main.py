# Phi-4 Mini Instruct AI Service
# Enterprise-grade AI service using Microsoft's Phi-4-mini-instruct model

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import asyncio
import uvicorn
import logging
import json
import time
from datetime import datetime
import os
from contextlib import asynccontextmanager

# Import transformers components
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variables
tokenizer = None
model = None
text_generator = None

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None

class AgentRequest(BaseModel):
    agent_type: str
    task: str
    context: Optional[Dict[str, Any]] = {}
    messages: Optional[List[ChatMessage]] = []
    max_tokens: Optional[int] = 500
    temperature: Optional[float] = 0.7

class AgentResponse(BaseModel):
    agent_type: str
    response: str
    confidence: float
    processing_time: float
    model_info: Dict[str, str]
    metadata: Dict[str, Any] = {}

async def load_phi4_model():
    """Load Phi-4-mini-instruct model and tokenizer"""
    global tokenizer, model, text_generator
    
    try:
        logger.info("Loading Phi-4-mini-instruct model...")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            "microsoft/Phi-4-mini-instruct", 
            trust_remote_code=True
        )
        
        # Load model with GPU support if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = AutoModelForCausalLM.from_pretrained(
            "microsoft/Phi-4-mini-instruct",
            trust_remote_code=True,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None
        )
        
        # Create pipeline for high-level operations
        text_generator = pipeline(
            "text-generation",
            model="microsoft/Phi-4-mini-instruct",
            trust_remote_code=True,
            device=0 if device == "cuda" else -1
        )
        
        logger.info(f"Phi-4-mini-instruct model loaded successfully on {device}")
        
    except Exception as e:
        logger.error(f"Failed to load Phi-4 model: {str(e)}")
        raise e

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await load_phi4_model()
    yield
    # Shutdown
    logger.info("Shutting down Phi-4 service...")

# Initialize FastAPI app
app = FastAPI(
    title="Phi-4 Mini Instruct AI Service",
    description="Enterprise AI service powered by Microsoft Phi-4-mini-instruct",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent templates for specialized behaviors
AGENT_TEMPLATES = {
    "product_manager": {
        "system_prompt": """You are an expert Product Manager AI agent with deep expertise in product strategy, user experience, and market analysis. 
        Your role is to analyze requirements, define product specifications, create user stories, and guide product development decisions.
        Always provide actionable insights, clear requirements, and strategic recommendations.""",
        "expertise": ["Product Strategy", "User Research", "Requirements Analysis", "Roadmap Planning"]
    },
    
    "business_analyst": {
        "system_prompt": """You are a senior Business Analyst AI agent specialized in business process analysis, requirements gathering, and solution design.
        You excel at translating business needs into technical requirements, creating process flows, and identifying optimization opportunities.
        Provide detailed analysis, clear documentation, and practical recommendations.""",
        "expertise": ["Business Process Analysis", "Requirements Engineering", "Stakeholder Management", "Solution Design"]
    },
    
    "software_developer": {
        "system_prompt": """You are an expert Software Developer AI agent with mastery in multiple programming languages, software architecture, and best practices.
        You specialize in writing clean, efficient code, designing scalable systems, and implementing robust solutions.
        Provide code examples, architectural guidance, and technical implementation strategies.""",
        "expertise": ["Full-Stack Development", "System Architecture", "Code Optimization", "Technical Design"]
    },
    
    "qa_engineer": {
        "system_prompt": """You are a Quality Assurance Engineer AI agent focused on testing strategies, quality processes, and defect prevention.
        You excel at creating comprehensive test plans, identifying edge cases, and ensuring software quality and reliability.
        Provide testing frameworks, quality metrics, and validation strategies.""",
        "expertise": ["Test Strategy", "Automation Testing", "Quality Assurance", "Performance Testing"]
    },
    
    "devops_engineer": {
        "system_prompt": """You are a DevOps Engineer AI agent specialized in infrastructure, deployment pipelines, and operational excellence.
        You focus on automation, scalability, monitoring, and maintaining reliable systems in production environments.
        Provide infrastructure guidance, deployment strategies, and operational best practices.""",
        "expertise": ["Infrastructure as Code", "CI/CD Pipelines", "Container Orchestration", "Monitoring & Observability"]
    }
}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "phi4-ai-service",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": "microsoft/Phi-4-mini-instruct",
        "model_type": "Causal Language Model",
        "device": str(model.device) if model else "unknown",
        "parameters": model.num_parameters() if hasattr(model, 'num_parameters') else "unknown",
        "supported_agents": list(AGENT_TEMPLATES.keys())
    }

@app.post("/agent/generate", response_model=AgentResponse)
async def generate_agent_response(request: AgentRequest):
    """Generate AI response for specific agent type"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        # Get agent template
        agent_config = AGENT_TEMPLATES.get(request.agent_type)
        if not agent_config:
            raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")
        
        # Build conversation messages
        messages = []
        
        # Add system prompt
        messages.append({
            "role": "system",
            "content": agent_config["system_prompt"]
        })
        
        # Add context if provided
        if request.context:
            context_msg = f"Additional context: {json.dumps(request.context, indent=2)}"
            messages.append({
                "role": "system",
                "content": context_msg
            })
        
        # Add conversation history
        if request.messages:
            for msg in request.messages:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Add current task
        messages.append({
            "role": "user",
            "content": request.task
        })
        
        # Generate response using the model
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(model.device)
        
        # Generate with specified parameters
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode response
        response_text = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )
        
        processing_time = time.time() - start_time
        
        # Calculate confidence (simplified - could be more sophisticated)
        confidence = min(0.95, 0.7 + (len(response_text.split()) / 100) * 0.2)
        
        return AgentResponse(
            agent_type=request.agent_type,
            response=response_text.strip(),
            confidence=confidence,
            processing_time=processing_time,
            model_info={
                "model": "microsoft/Phi-4-mini-instruct",
                "device": str(model.device),
                "parameters_used": f"max_tokens={request.max_tokens}, temperature={request.temperature}"
            },
            metadata={
                "expertise": agent_config["expertise"],
                "message_count": len(messages),
                "context_provided": bool(request.context)
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/agent/chat")
async def chat_with_agent(request: AgentRequest):
    """Simplified chat interface using pipeline"""
    if text_generator is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        # Get agent template
        agent_config = AGENT_TEMPLATES.get(request.agent_type, AGENT_TEMPLATES["software_developer"])
        
        # Build conversation for pipeline
        messages = [
            {"role": "system", "content": agent_config["system_prompt"]},
            {"role": "user", "content": request.task}
        ]
        
        # Generate using pipeline
        result = text_generator(
            messages,
            max_new_tokens=request.max_tokens,
            temperature=request.temperature,
            do_sample=True
        )
        
        processing_time = time.time() - start_time
        
        return {
            "agent_type": request.agent_type,
            "response": result[0]["generated_text"][-1]["content"],
            "processing_time": processing_time,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/agents/types")
async def get_agent_types():
    """Get available agent types and their capabilities"""
    return {
        "available_agents": {
            agent_type: {
                "expertise": config["expertise"],
                "description": config["system_prompt"][:100] + "..."
            }
            for agent_type, config in AGENT_TEMPLATES.items()
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Disable for production
        log_level="info"
    )