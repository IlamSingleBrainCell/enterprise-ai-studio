#!/bin/bash

# Enterprise AI Studio - Microservices Deployment Script
# This script builds and deploys the complete microservices architecture

set -e

echo "🚀 Enterprise AI Studio - Microservices Deployment"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_header "Checking Docker availability..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_header "Checking Docker Compose availability..."
    if ! docker-compose version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_status "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_header "Creating necessary directories..."
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/prometheus
    mkdir -p data/grafana
    mkdir -p data/elasticsearch
    print_status "Directories created"
}

# Build all services
build_services() {
    print_header "Building all microservices..."
    
    print_status "Building Phi-4 AI Service..."
    docker-compose -f docker-compose.microservices.yml build phi4-service
    
    print_status "Building Agent Orchestrator..."
    docker-compose -f docker-compose.microservices.yml build agent-orchestrator
    
    print_status "Building API Gateway..."
    docker-compose -f docker-compose.microservices.yml build api-gateway
    
    print_status "Building Frontend..."
    docker-compose -f docker-compose.microservices.yml build frontend
    
    print_status "All services built successfully"
}

# Start core services
start_core_services() {
    print_header "Starting core infrastructure services..."
    
    print_status "Starting Redis and PostgreSQL..."
    docker-compose -f docker-compose.microservices.yml up -d redis postgres
    
    print_status "Waiting for database to be ready..."
    sleep 30
    
    print_status "Starting Phi-4 AI Service..."
    docker-compose -f docker-compose.microservices.yml up -d phi4-service
    
    print_status "Waiting for AI service to initialize..."
    sleep 60
    
    print_status "Starting Agent Orchestrator..."
    docker-compose -f docker-compose.microservices.yml up -d agent-orchestrator
    
    print_status "Starting API Gateway..."
    docker-compose -f docker-compose.microservices.yml up -d api-gateway
    
    print_status "Starting Frontend..."
    docker-compose -f docker-compose.microservices.yml up -d frontend
    
    print_status "Core services started"
}

# Start monitoring services
start_monitoring() {
    print_header "Starting monitoring services..."
    
    print_status "Starting Prometheus and Grafana..."
    docker-compose -f docker-compose.microservices.yml --profile monitoring up -d prometheus grafana
    
    print_status "Monitoring services started"
}

# Start logging services
start_logging() {
    print_header "Starting logging services..."
    
    print_status "Starting Elasticsearch and Kibana..."
    docker-compose -f docker-compose.microservices.yml --profile logging up -d elasticsearch kibana
    
    print_status "Logging services started"
}

# Health check function
health_check() {
    print_header "Performing health checks..."
    
    local services=("frontend:80" "api-gateway:8080" "agent-orchestrator:8000" "phi4-service:8001")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        print_status "Checking $name on port $port..."
        
        for i in {1..10}; do
            if curl -s -f "http://localhost:$port/health" > /dev/null; then
                print_status "$name is healthy"
                break
            elif [ $i -eq 10 ]; then
                print_warning "$name health check failed after 10 attempts"
            else
                sleep 5
            fi
        done
    done
}

# Display service URLs
display_urls() {
    print_header "🎉 Deployment Complete!"
    echo ""
    echo "📊 Service URLs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Frontend Application:     http://localhost"
    echo "🚪 API Gateway:              http://localhost:8080"
    echo "🤖 Agent Orchestrator:       http://localhost:8000"
    echo "🧠 Phi-4 AI Service:         http://localhost:8001"
    echo "📊 Prometheus Metrics:       http://localhost:9090"
    echo "📈 Grafana Dashboards:       http://localhost:3000 (admin/admin123)"
    echo "📝 Kibana Logs:              http://localhost:5601"
    echo "🗄️  PostgreSQL:               localhost:5432"
    echo "💾 Redis:                    localhost:6379"
    echo ""
    echo "🔧 Management Commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "View logs:          docker-compose -f docker-compose.microservices.yml logs -f [service]"
    echo "Stop all:           docker-compose -f docker-compose.microservices.yml down"
    echo "Restart service:    docker-compose -f docker-compose.microservices.yml restart [service]"
    echo "Scale service:      docker-compose -f docker-compose.microservices.yml up -d --scale [service]=3"
    echo ""
    echo "🏗️  Architecture:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Frontend (Nginx) → API Gateway → Agent Orchestrator → Phi-4 AI Service"
    echo "                        ↓"
    echo "           Redis (Message Broker) + PostgreSQL (Database)"
    echo "                        ↓"
    echo "    Prometheus (Metrics) + Grafana (Dashboards) + ELK (Logs)"
    echo ""
}

# Main deployment function
deploy() {
    local mode=${1:-"core"}
    
    case $mode in
        "full")
            print_status "Deploying full microservices architecture with monitoring and logging..."
            check_docker
            check_docker_compose
            create_directories
            build_services
            start_core_services
            start_monitoring
            start_logging
            health_check
            display_urls
            ;;
        "monitoring")
            print_status "Deploying with monitoring services..."
            check_docker
            check_docker_compose
            create_directories
            build_services
            start_core_services
            start_monitoring
            health_check
            display_urls
            ;;
        "core")
            print_status "Deploying core services only..."
            check_docker
            check_docker_compose
            create_directories
            build_services
            start_core_services
            health_check
            display_urls
            ;;
        "quick")
            print_status "Quick deployment (pre-built images)..."
            check_docker
            check_docker_compose
            start_core_services
            health_check
            display_urls
            ;;
        *)
            print_error "Invalid deployment mode. Use: core, monitoring, full, or quick"
            exit 1
            ;;
    esac
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [core|monitoring|full|quick]"
    echo ""
    echo "Deployment modes:"
    echo "  core       - Core services only (default)"
    echo "  monitoring - Core services + Prometheus/Grafana"
    echo "  full       - All services including logging"
    echo "  quick      - Quick start with existing images"
    exit 1
fi

deploy $1