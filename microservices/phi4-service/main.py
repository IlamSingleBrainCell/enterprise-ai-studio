"""
Production Phi-4 AI Service
Optimized Microsoft Phi-4-mini-instruct integration with caching and memory management
"""

import logging
import asyncio
import os
import gc
import time
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import redis.asyncio as redis
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    pipeline,
    BitsAndBytesConfig
)
from datetime import datetime
import json
import psutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model management
tokenizer = None
model = None
text_generator = None
redis_client = None

app = FastAPI(
    title="Phi-4 AI Service",
    description="Production Microsoft Phi-4-mini-instruct service for Enterprise AI Studio",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_NAME = "microsoft/Phi-4-mini-instruct"
MAX_NEW_TOKENS = 512
TEMPERATURE = 0.7
USE_4BIT = True  # Enable 4-bit quantization for memory efficiency
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Pydantic models
class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = MAX_NEW_TOKENS
    temperature: float = TEMPERATURE
    agent_type: str = "general"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: int = MAX_NEW_TOKENS
    temperature: float = TEMPERATURE
    model: str = MODEL_NAME

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
    memory_usage: Dict[str, Any]
    device: str

class ModelInfo(BaseModel):
    model_name: str
    device: str
    quantization: str
    memory_usage: Dict[str, Any]
    capabilities: List[str]

async def get_memory_usage():
    """Get current memory usage statistics"""
    memory = psutil.virtual_memory()
    gpu_memory = {}
    
    if torch.cuda.is_available():
        gpu_memory = {
            "allocated": torch.cuda.memory_allocated() / 1024**3,  # GB
            "reserved": torch.cuda.memory_reserved() / 1024**3,    # GB
            "total": torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
        }
    
    return {
        "system": {
            "total": memory.total / 1024**3,
            "available": memory.available / 1024**3,
            "used": memory.used / 1024**3,
            "percent": memory.percent
        },
        "gpu": gpu_memory
    }

async def load_phi4_model():
    """Load Phi-4 model with optimizations"""
    global tokenizer, model, text_generator
    
    try:
        logger.info(f"🚀 Loading Phi-4 model: {MODEL_NAME}")
        logger.info(f"📍 Device: {DEVICE}")
        logger.info(f"🔧 4-bit quantization: {USE_4BIT}")
        
        # Configure quantization for memory efficiency
        quantization_config = None
        if USE_4BIT and torch.cuda.is_available():
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )
            logger.info("✅ Enabled 4-bit quantization")
        
        # Load tokenizer
        logger.info("📝 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            cache_dir="/app/.cache"
        )
        
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model
        logger.info("🧠 Loading model...")
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=quantization_config,
            device_map="auto" if torch.cuda.is_available() else None,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            trust_remote_code=True,
            cache_dir="/app/.cache",
            low_cpu_mem_usage=True
        )
        
        # Create pipeline
        logger.info("🔗 Creating text generation pipeline...")
        text_generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device=0 if torch.cuda.is_available() else -1,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )
        
        # Memory cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        memory_info = await get_memory_usage()
        logger.info(f"✅ Phi-4 model loaded successfully!")
        logger.info(f"💾 Memory usage: {memory_info}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load Phi-4 model: {e}")
        return False

async def generate_response(prompt: str, max_tokens: int = MAX_NEW_TOKENS, temperature: float = TEMPERATURE) -> str:
    """Generate response using Phi-4 model"""
    global text_generator
    
    if text_generator is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Generate response
        start_time = time.time()
        
        outputs = text_generator(
            prompt,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id,
            return_full_text=False
        )
        
        response_text = outputs[0]['generated_text'].strip()
        generation_time = time.time() - start_time
        
        logger.info(f"⚡ Generated response in {generation_time:.2f}s")
        return response_text
        
    except Exception as e:
        logger.error(f"❌ Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

def build_agent_prompt(agent_type: str, prompt: str) -> str:
    """Build specialized prompts for different agent types"""
    
    agent_prompts = {
        "product_manager": f"""You are an expert Product Manager with 10+ years of experience in software development and product strategy.

User Request: {prompt}

As a Product Manager, please provide a comprehensive response covering:
1. Product Strategy & Vision
2. Market Analysis & User Needs
3. Feature Prioritization & Roadmap
4. Success Metrics & KPIs
5. Stakeholder Communication

Response:""",

        "business_analyst": f"""You are a senior Business Analyst specializing in requirements gathering and process optimization.

User Request: {prompt}

As a Business Analyst, please provide detailed analysis including:
1. Business Requirements & Objectives
2. Functional & Non-functional Requirements
3. Process Mapping & Workflow Analysis
4. Risk Assessment & Mitigation
5. Implementation Recommendations

Response:""",

        "software_developer": f"""You are a senior Software Developer with expertise in modern development practices and architecture.

User Request: {prompt}

As a Software Developer, please provide technical guidance covering:
1. Technical Architecture & Design
2. Technology Stack Recommendations
3. Implementation Approach & Best Practices
4. Code Structure & Patterns
5. Performance & Scalability Considerations

Response:""",

        "qa_engineer": f"""You are an experienced QA Engineer specializing in comprehensive testing strategies.

User Request: {prompt}

As a QA Engineer, please provide a complete testing approach including:
1. Test Strategy & Planning
2. Test Case Design & Automation
3. Quality Metrics & Reporting
4. Risk-based Testing Approach
5. Continuous Testing Integration

Response:""",

        "devops_engineer": f"""You are a DevOps Engineer expert in modern deployment and infrastructure practices.

User Request: {prompt}

As a DevOps Engineer, please provide infrastructure guidance covering:
1. CI/CD Pipeline Design
2. Infrastructure as Code
3. Containerization & Orchestration
4. Monitoring & Observability
5. Security & Compliance

Response:"""
    }
    
    return agent_prompts.get(agent_type, f"User Request: {prompt}\n\nResponse:")

@app.on_event("startup")
async def startup_event():
    """Initialize the service"""
    global redis_client
    
    logger.info("🚀 Starting Phi-4 AI Service...")
    
    try:
        # Initialize Redis
        redis_url = os.getenv("REDIS_URL", "redis://enterprise_ai_redis:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("✅ Connected to Redis")
        
        # Load model in background
        asyncio.create_task(load_model_async())
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")

async def load_model_async():
    """Load model asynchronously"""
    success = await load_phi4_model()
    if success:
        logger.info("🎉 Phi-4 service ready!")
    else:
        logger.error("💥 Failed to initialize Phi-4 service")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check"""
    global model, tokenizer
    
    model_loaded = model is not None and tokenizer is not None
    memory_usage = await get_memory_usage()
    
    return HealthResponse(
        status="healthy" if model_loaded else "loading",
        timestamp=datetime.utcnow().isoformat(),
        model_loaded=model_loaded,
        memory_usage=memory_usage,
        device=DEVICE
    )

@app.get("/model/info", response_model=ModelInfo)
async def get_model_info():
    """Get model information"""
    global model
    
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    memory_usage = await get_memory_usage()
    
    return ModelInfo(
        model_name=MODEL_NAME,
        device=DEVICE,
        quantization="4-bit" if USE_4BIT else "none",
        memory_usage=memory_usage,
        capabilities=[
            "text-generation",
            "agent-specialization", 
            "sdlc-workflows",
            "multi-turn-chat"
        ]
    )

@app.post("/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using Phi-4"""
    
    if text_generator is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Build specialized prompt
        enhanced_prompt = build_agent_prompt(request.agent_type, request.prompt)
        
        # Generate response
        response_text = await generate_response(
            enhanced_prompt,
            request.max_tokens,
            request.temperature
        )
        
        # Store interaction in Redis
        if redis_client:
            interaction_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "agent_type": request.agent_type,
                "prompt": request.prompt,
                "response": response_text,
                "tokens": len(response_text.split())
            }
            await redis_client.lpush("phi4_interactions", json.dumps(interaction_data))
            await redis_client.ltrim("phi4_interactions", 0, 999)
        
        return {
            "response": response_text,
            "agent_type": request.agent_type,
            "model": MODEL_NAME,
            "tokens_generated": len(response_text.split())
        }
        
    except Exception as e:
        logger.error(f"❌ Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/chat/completions", response_model=ChatResponse)
async def chat_completions(request: ChatRequest):
    """OpenAI-compatible chat completions endpoint"""
    
    if text_generator is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Build conversation prompt
        conversation = ""
        for message in request.messages:
            role = message.role
            content = message.content
            conversation += f"{role.title()}: {content}\n"
        
        conversation += "Assistant:"
        
        # Generate response
        response_text = await generate_response(
            conversation,
            request.max_tokens,
            request.temperature
        )
        
        # Build OpenAI-compatible response
        response = ChatResponse(
            id=f"chatcmpl-{int(time.time())}",
            created=int(time.time()),
            model=request.model,
            choices=[{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text
                },
                "finish_reason": "stop"
            }],
            usage={
                "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
                "completion_tokens": len(response_text.split()),
                "total_tokens": sum(len(msg.content.split()) for msg in request.messages) + len(response_text.split())
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/generate")
async def agent_generate(request: Dict[str, Any]):
    """Agent-specific generation endpoint for orchestrator"""
    
    agent_type = request.get("agent_type", "general")
    task = request.get("task", "")
    context = request.get("context", {})
    
    # Build enhanced prompt with context
    enhanced_prompt = build_agent_prompt(agent_type, task)
    
    if context:
        enhanced_prompt += f"\n\nAdditional Context:\n{json.dumps(context, indent=2)}\n\nResponse:"
    
    response_text = await generate_response(
        enhanced_prompt,
        request.get("max_tokens", MAX_NEW_TOKENS),
        request.get("temperature", TEMPERATURE)
    )
    
    return {
        "response": response_text,
        "confidence": 0.9,  # Static confidence for now
        "agent_type": agent_type,
        "model": MODEL_NAME
    }

@app.get("/metrics")
async def get_metrics():
    """Get service metrics"""
    global redis_client
    
    try:
        memory_usage = await get_memory_usage()
        
        interactions_count = 0
        if redis_client:
            interactions_count = await redis_client.llen("phi4_interactions")
        
        return {
            "model_loaded": model is not None,
            "total_interactions": interactions_count,
            "memory_usage": memory_usage,
            "device": DEVICE,
            "quantization": "4-bit" if USE_4BIT else "none"
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")