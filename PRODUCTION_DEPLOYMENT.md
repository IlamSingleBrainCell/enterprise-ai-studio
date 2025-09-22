# Enterprise AI Studio - Production Deployment Guide

## 🚀 Overview

Enterprise AI Studio is a complete microservices-based AI platform featuring **Microsoft Phi-4-mini-instruct** for advanced software development lifecycle (SDLC) automation. This production-ready implementation provides multi-agent workflows for Product Management, Business Analysis, Software Development, QA Engineering, and DevOps operations.

## 🎯 Key Features

### 🤖 **Real AI Integration**
- **Microsoft Phi-4-mini-instruct** - Production-grade large language model
- **4-bit Quantization** - Optimized memory usage for deployment
- **Specialized Agent Prompts** - Role-specific AI responses for PM, BA, Dev, QA, DevOps
- **OpenAI-Compatible API** - Standard chat completions interface

### 🏗️ **Microservices Architecture**
- **API Gateway** - Central routing and authentication
- **Agent Orchestrator** - Multi-agent workflow management  
- **Phi-4 AI Service** - Core AI inference engine
- **Redis** - Message broker and caching
- **PostgreSQL** - Database backend
- **Nginx Frontend** - Web interface

### 🔄 **SDLC Workflows**
- **Automated Workflows** - Complete software development lifecycle
- **Multi-Agent Coordination** - Sequential task execution with context passing
- **Real-time Progress** - Live workflow monitoring and status updates
- **Results Analytics** - Comprehensive output analysis and storage

## 📋 System Requirements

### Minimum Requirements
- **CPU**: 4 cores (8 cores recommended)
- **RAM**: 8GB (16GB recommended for optimal performance)
- **Storage**: 20GB free space (for model cache and data)
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

### Recommended Production Setup
- **CPU**: 8+ cores with AVX2 support
- **RAM**: 16GB+ (32GB for heavy workloads)
- **Storage**: SSD with 50GB+ free space
- **GPU**: NVIDIA GPU with CUDA support (optional, significantly improves performance)
- **Network**: Stable internet connection for initial model download (~3GB)

## 🚀 Quick Start Deployment

### Option 1: Automated Deployment (Recommended)

#### Windows
```bash
# Clone repository
git clone https://github.com/IlamSingleBrainCell/enterprise-ai-studio.git
cd enterprise-ai-studio

# Run automated deployment
deploy-production.bat
```

#### Linux/macOS
```bash
# Clone repository
git clone https://github.com/IlamSingleBrainCell/enterprise-ai-studio.git
cd enterprise-ai-studio

# Make script executable
chmod +x deploy-production.sh

# Run automated deployment
./deploy-production.sh
```

### Option 2: Manual Deployment

```bash
# 1. Stop existing services
docker-compose -f docker-compose.production.yml down --remove-orphans

# 2. Build all services
docker-compose -f docker-compose.production.yml build

# 3. Start infrastructure
docker-compose -f docker-compose.production.yml up -d redis postgres

# 4. Start AI services (model loading takes 5-10 minutes)
docker-compose -f docker-compose.production.yml up -d phi4-service

# 5. Start application services
docker-compose -f docker-compose.production.yml up -d agent-orchestrator api-gateway frontend

# 6. Optional: Enable monitoring
docker-compose -f docker-compose.production.yml --profile monitoring up -d
```

## 🌐 Service Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost | Main web interface |
| **API Gateway** | http://localhost:8080 | RESTful API endpoints |
| **Phi-4 AI Service** | http://localhost:8001 | Direct AI model access |
| **Agent Orchestrator** | http://localhost:8002 | Workflow management |
| **Prometheus** | http://localhost:9090 | Monitoring (optional) |

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
# Database Configuration
DB_ROOT_PASSWORD=your_secure_root_password
DB_PASSWORD=your_secure_user_password

# AI Model Configuration
MODEL_CACHE_DIR=/app/.cache
USE_4BIT_QUANTIZATION=true
MAX_MODEL_MEMORY=8G

# Performance Tuning
WORKERS=1
MAX_CONCURRENT_REQUESTS=10
MODEL_TIMEOUT=300

# Security (Production)
JWT_SECRET=your-super-secret-jwt-key
API_RATE_LIMIT=100
CORS_ORIGINS=http://localhost,https://yourdomain.com
```

### Resource Limits
Update `docker-compose.production.yml` for your hardware:

```yaml
phi4-service:
  deploy:
    resources:
      limits:
        memory: 16G        # Adjust based on available RAM
        cpus: '8.0'        # Adjust based on CPU cores
      reservations:
        memory: 8G
        cpus: '4.0'
```

## 🔍 Health Checks & Monitoring

### Service Health
```bash
# Check all services
curl http://localhost:8080/health

# Check individual services
curl http://localhost:8001/health  # Phi-4 AI Service
curl http://localhost:8002/health  # Agent Orchestrator
```

### System Monitoring
```bash
# View service status
docker-compose -f docker-compose.production.yml ps

# Monitor resource usage
docker stats

# View logs
docker-compose -f docker-compose.production.yml logs -f phi4-service
```

### Performance Metrics
Access Prometheus metrics (if enabled):
- **Phi-4 Model**: http://localhost:8001/metrics
- **Orchestrator**: http://localhost:8002/metrics
- **API Gateway**: http://localhost:8080/metrics

## 📝 API Usage Examples

### SDLC Workflow Creation
```bash
# Create new SDLC workflow
curl -X POST "http://localhost:8080/api/test/workflow/sdlc" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "E-commerce Platform",
    "requirements": "Build a scalable e-commerce platform with user authentication, product catalog, shopping cart, and payment processing"
  }'
```

### Check Workflow Status
```bash
# Get workflow status (replace {workflow_id} with actual ID)
curl http://localhost:8080/api/v1/workflow/{workflow_id}
```

### Direct AI Interaction
```bash
# Direct Phi-4 model interaction
curl -X POST "http://localhost:8001/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Design a microservices architecture for an e-commerce platform",
    "agent_type": "software_developer",
    "max_tokens": 500,
    "temperature": 0.7
  }'
```

## 🔒 Security Considerations

### Production Deployment
1. **Enable Authentication**: Configure JWT tokens in API Gateway
2. **SSL/TLS**: Set up reverse proxy with SSL certificates
3. **Network Security**: Use Docker networks and firewalls
4. **Resource Limits**: Set appropriate memory and CPU limits
5. **Access Control**: Implement role-based access control

### Recommended Security Setup
```yaml
# docker-compose.override.yml for production
services:
  api-gateway:
    environment:
      - ENABLE_AUTH=true
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${ALLOWED_ORIGINS}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.tls=true"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Phi-4 Model Loading Fails
**Problem**: Model download or loading timeout
**Solution**:
```bash
# Check available memory
free -h

# Increase timeout and memory
docker-compose -f docker-compose.production.yml up -d phi4-service
docker logs enterprise_ai_phi4 -f
```

#### 2. Out of Memory Errors
**Problem**: System runs out of memory during model loading
**Solution**:
```bash
# Enable 4-bit quantization (default)
# Add swap space
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Or reduce model memory in docker-compose.yml
```

#### 3. Frontend Not Loading
**Problem**: Web interface shows connection errors
**Solution**:
```bash
# Check API Gateway status
curl http://localhost:8080/health

# Verify frontend container
docker logs enterprise_ai_frontend

# Check service dependencies
docker-compose -f docker-compose.production.yml ps
```

#### 4. Workflow Creation Fails
**Problem**: SDLC workflow returns 422 or 500 errors
**Solution**:
```bash
# Check orchestrator logs
docker logs enterprise_ai_orchestrator -f

# Verify Phi-4 service health
curl http://localhost:8001/health

# Test direct AI endpoint
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "agent_type": "general"}'
```

### Log Analysis
```bash
# View all service logs
docker-compose -f docker-compose.production.yml logs

# Filter specific service logs
docker-compose -f docker-compose.production.yml logs phi4-service | grep "ERROR"

# Real-time log monitoring
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

## 📈 Performance Optimization

### Model Performance
- **GPU Acceleration**: Enable CUDA if available
- **Quantization**: Use 4-bit quantization (enabled by default)
- **Batch Size**: Adjust based on available memory
- **Context Length**: Optimize prompt length for better performance

### System Performance
- **Memory**: Allocate sufficient RAM for model caching
- **Storage**: Use SSD for faster model loading
- **Network**: Ensure stable connection for model downloads
- **CPU**: Use multi-core processors with AVX2 support

## 🔄 Updates & Maintenance

### Updating the System
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Backup & Recovery
```bash
# Backup data volumes
docker run --rm -v enterprise_ai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
docker run --rm -v enterprise_ai_phi4_cache:/data -v $(pwd):/backup alpine tar czf /backup/phi4_cache_backup.tar.gz /data

# Restore data volumes
docker run --rm -v enterprise_ai_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## 📞 Support & Documentation

### Additional Resources
- **API Documentation**: http://localhost:8080/docs (when running)
- **Model Documentation**: [Microsoft Phi-4 Documentation](https://huggingface.co/microsoft/Phi-4-mini-instruct)
- **Docker Documentation**: [Docker Compose Reference](https://docs.docker.com/compose/)

### Performance Monitoring
- Monitor system resources with `docker stats`
- Use Prometheus metrics for detailed analysis
- Check application logs for performance insights

---

## 🎉 Success Metrics

Your Enterprise AI Studio deployment is successful when:

✅ **All services are healthy**: `docker-compose ps` shows all services as "Up"  
✅ **Frontend loads**: http://localhost displays the Enterprise AI Studio interface  
✅ **API responds**: http://localhost:8080/health returns healthy status  
✅ **Phi-4 model loaded**: http://localhost:8001/health shows model_loaded: true  
✅ **Workflows execute**: SDLC workflow creation returns workflow ID  
✅ **AI responses**: Generated content appears in workflow results  

**🎯 The system is now ready for production use with real Microsoft Phi-4 AI capabilities!**