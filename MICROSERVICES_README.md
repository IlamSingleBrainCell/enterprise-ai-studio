# 🏗️ Enterprise AI Studio - Microservices Architecture

## 🚀 **Advanced Multi-Agent AI Platform with Phi-4 Mini Instruct**

A production-ready microservices architecture implementing the complete AI Agent Orchestration System with Microsoft's Phi-4-mini-instruct model, featuring distributed agent coordination, real-time processing, and enterprise-grade scalability.

## 📋 **Table of Contents**

- [Architecture Overview](#architecture-overview)
- [Services](#services)
- [Features](#features)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [API Documentation](#api-documentation)
- [Monitoring & Observability](#monitoring--observability)
- [Development](#development)
- [Production Deployment](#production-deployment)

## 🏛️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │    Frontend     │    │   API Gateway   │
│    (HAProxy)    │────│    (Nginx)      │────│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 │                                 │
               ┌─────────────────┐            ┌─────────────────┐              ┌─────────────────┐
               │ Agent           │            │ Phi-4 AI       │              │ Message Broker  │
               │ Orchestrator    │────────────│ Service         │              │ (Redis)         │
               │ (FastAPI)       │            │ (FastAPI)       │              └─────────────────┘
               └─────────────────┘            └─────────────────┘                        │
                       │                              │                                  │
               ┌─────────────────┐            ┌─────────────────┐              ┌─────────────────┐
               │ PostgreSQL      │            │ Monitoring      │              │ Logging         │
               │ Database        │            │ (Prometheus)    │              │ (ELK Stack)     │
               └─────────────────┘            └─────────────────┘              └─────────────────┘
```

## 🔧 **Services**

### **Core Services**

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Frontend** | 80 | Nginx + HTML5 | User interface and static content |
| **API Gateway** | 8080 | FastAPI | Central entry point, routing, authentication |
| **Agent Orchestrator** | 8000 | FastAPI | Multi-agent workflow coordination |
| **Phi-4 AI Service** | 8001 | FastAPI + Transformers | Microsoft Phi-4-mini-instruct AI engine |
| **PostgreSQL** | 5432 | PostgreSQL 15 | Persistent data storage |
| **Redis** | 6379 | Redis 7 | Message broker and caching |

### **Monitoring & Observability**

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Prometheus** | 9090 | Prometheus | Metrics collection and alerting |
| **Grafana** | 3000 | Grafana | Dashboards and visualization |
| **Elasticsearch** | 9200 | Elasticsearch | Log storage and search |
| **Kibana** | 5601 | Kibana | Log visualization and analysis |

## ✨ **Features**

### **🤖 AI Agent System**
- **Microsoft Phi-4-mini-instruct** integration for advanced language processing
- **5 Specialized Agents**: Product Manager, Business Analyst, Software Developer, QA Engineer, DevOps Engineer
- **Multi-agent workflows** with dependency management
- **Real-time collaboration** between agents
- **Context-aware responses** with conversation history

### **🏗️ Microservices Architecture**
- **Service discovery** and load balancing
- **Health checks** and monitoring
- **Horizontal scaling** capabilities
- **Fault tolerance** and circuit breakers
- **API versioning** and rate limiting

### **📊 Enterprise Features**
- **Comprehensive monitoring** with Prometheus and Grafana
- **Centralized logging** with ELK stack
- **Security** with JWT authentication
- **Performance optimization** with caching
- **Docker containerization** for easy deployment

### **🔄 SDLC Automation**
- **Complete SDLC workflows** from requirements to deployment
- **Automated task orchestration** with dependency resolution
- **Progress tracking** and real-time updates
- **Result aggregation** and reporting

## 🚀 **Quick Start**

### **Prerequisites**
- Docker Engine 24.0+
- Docker Compose 2.0+
- 8GB+ RAM (for Phi-4 model)
- 20GB+ disk space

### **1. Clone Repository**
```bash
git clone https://github.com/IlamSingleBrainCell/enterprise-ai-studio.git
cd enterprise-ai-studio
```

### **2. Deploy Core Services**
```bash
# Linux/Mac
chmod +x deploy-microservices.sh
./deploy-microservices.sh core

# Windows
docker-compose -f docker-compose.microservices.yml up -d redis postgres phi4-service agent-orchestrator api-gateway frontend
```

### **3. Access Application**
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8080
- **Phi-4 Service**: http://localhost:8001

## 🎛️ **Deployment Options**

### **Core Services Only**
```bash
./deploy-microservices.sh core
```
Deploys essential services: Frontend, API Gateway, Orchestrator, AI Service, Database, Redis

### **With Monitoring**
```bash
./deploy-microservices.sh monitoring
```
Adds Prometheus and Grafana for metrics and dashboards

### **Full Stack**
```bash
./deploy-microservices.sh full
```
Complete deployment including logging (ELK stack) and monitoring

### **Quick Start**
```bash
./deploy-microservices.sh quick
```
Fast deployment using pre-built images

## 📡 **API Documentation**

### **Agent Orchestrator API**

#### **Create SDLC Workflow**
```http
POST /api/v1/workflow/sdlc
Content-Type: application/json

{
  "project_name": "My Project",
  "requirements": "Build a web application with user authentication"
}
```

#### **Get Workflow Status**
```http
GET /api/v1/workflow/{workflow_id}
```

#### **List All Workflows**
```http
GET /api/v1/workflows
```

### **Phi-4 AI Service API**

#### **Generate AI Response**
```http
POST /api/v1/ai/generate
Content-Type: application/json

{
  "agent_type": "software_developer",
  "task": "Design a REST API for user management",
  "max_tokens": 500,
  "temperature": 0.7
}
```

#### **Chat with Agent**
```http
POST /api/v1/ai/chat
Content-Type: application/json

{
  "agent_type": "product_manager",
  "task": "What are the key features for an e-commerce platform?"
}
```

#### **Get Available Agents**
```http
GET /api/v1/ai/agents
```

### **System Monitoring API**

#### **Service Health**
```http
GET /services/health
```

#### **System Statistics**
```http
GET /api/v1/system/stats
```

## 📊 **Monitoring & Observability**

### **Prometheus Metrics**
Access metrics at http://localhost:9090

**Key Metrics:**
- Request rates and latencies
- Service health status
- Resource utilization
- AI model performance
- Workflow completion rates

### **Grafana Dashboards**
Access dashboards at http://localhost:3000 (admin/admin123)

**Available Dashboards:**
- System Overview
- Service Performance
- AI Model Metrics
- Workflow Analytics
- Infrastructure Health

### **Logging with ELK**
Access logs at http://localhost:5601

**Log Categories:**
- Application logs
- Access logs
- Error logs
- Performance logs
- Audit logs

## 🛠️ **Development**

### **Local Development Setup**
```bash
# Start dependencies only
docker-compose -f docker-compose.microservices.yml up -d redis postgres

# Run services locally for development
cd microservices/phi4-service
pip install -r requirements.txt
python main.py

cd ../agent-orchestrator
pip install -r requirements.txt
python main.py

cd ../api-gateway
pip install -r requirements.txt
python main.py
```

### **Testing**
```bash
# Run health checks
curl http://localhost:8080/health
curl http://localhost:8000/health
curl http://localhost:8001/health

# Test AI generation
curl -X POST http://localhost:8080/api/v1/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"agent_type": "software_developer", "task": "Hello, world!"}'

# Test workflow creation
curl -X POST "http://localhost:8080/api/v1/workflow/sdlc?project_name=Test&requirements=Simple%20test"
```

### **Adding New Agents**
1. Add agent configuration to `phi4-service/main.py` in `AGENT_TEMPLATES`
2. Update UI in `microservices/enterprise-ui.html`
3. Rebuild and redeploy services

## 🏭 **Production Deployment**

### **Environment Variables**
```env
# Database
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=your_grafana_password

# AI Service
TRANSFORMERS_CACHE=/app/.cache
HF_HOME=/app/.cache

# Security
JWT_SECRET=your_jwt_secret
```

### **Scaling Services**
```bash
# Scale orchestrator service
docker-compose -f docker-compose.microservices.yml up -d --scale agent-orchestrator=3

# Scale API gateway
docker-compose -f docker-compose.microservices.yml up -d --scale api-gateway=2
```

### **Load Balancing**
```bash
# Deploy with HAProxy load balancer
docker-compose -f docker-compose.microservices.yml --profile production up -d load-balancer
```

### **SSL/TLS Configuration**
1. Place certificates in `microservices/loadbalancer/certs/`
2. Update `haproxy.cfg` configuration
3. Deploy load balancer with SSL termination

## 🔒 **Security**

### **Authentication**
- JWT-based authentication
- API rate limiting
- CORS configuration
- Security headers

### **Network Security**
- Service isolation with Docker networks
- Internal service communication
- Firewall rules for external access

### **Data Security**
- Database encryption at rest
- Secure inter-service communication
- Audit logging

## 📈 **Performance**

### **Optimization**
- Redis caching for frequent requests
- Connection pooling for databases
- Async/await for non-blocking operations
- Resource limits and reservations

### **Monitoring**
- Response time tracking
- Resource utilization alerts
- Capacity planning metrics
- Performance bottleneck identification

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [Wiki](https://github.com/IlamSingleBrainCell/enterprise-ai-studio/wiki)
- **Issues**: [GitHub Issues](https://github.com/IlamSingleBrainCell/enterprise-ai-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/IlamSingleBrainCell/enterprise-ai-studio/discussions)

## 🙏 **Acknowledgments**

- **Microsoft** for the Phi-4-mini-instruct model
- **FastAPI** for the excellent web framework
- **Docker** for containerization platform
- **OpenAI** for inspiration in AI development

---

**🚀 Built with ❤️ for Enterprise AI Excellence**