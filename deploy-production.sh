#!/bin/bash

# Enterprise AI Studio - Production Deployment Script
# Deploy with Microsoft Phi-4 Mini Instruct for Client

set -e

echo "🚀 Starting Enterprise AI Studio Production Deployment..."
echo "=================================="

# Check system requirements
echo "📋 Checking system requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check available memory (minimum 8GB recommended)
MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
if [ "$MEMORY_GB" -lt 8 ]; then
    echo "⚠️  Warning: System has ${MEMORY_GB}GB RAM. Recommended minimum is 8GB for Phi-4 model."
    echo "   Consider enabling swap or upgrading system memory."
fi

# Check disk space (minimum 20GB for model cache)
DISK_GB=$(df -BG . | awk 'NR==2{gsub(/G/, "", $4); print $4}')
if [ "$DISK_GB" -lt 20 ]; then
    echo "⚠️  Warning: Available disk space is ${DISK_GB}GB. Recommended minimum is 20GB."
fi

echo "✅ System requirements check completed."
echo ""

# Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true
docker-compose -f docker-compose.microservices.yml down --remove-orphans || true

# Clean up old containers and images (optional)
read -p "🧹 Do you want to clean up old Docker containers and images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up old containers and images..."
    docker system prune -f
    docker volume prune -f
fi

# Build services
echo "🔨 Building Enterprise AI Studio services..."
docker-compose -f docker-compose.production.yml build --parallel

# Start infrastructure services first
echo "🏗️  Starting infrastructure services..."
docker-compose -f docker-compose.production.yml up -d redis postgres

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 30

# Start AI services
echo "🤖 Starting Phi-4 AI service..."
echo "   ⚠️  Note: Phi-4 model loading may take 5-10 minutes on first startup"
docker-compose -f docker-compose.production.yml up -d phi4-service

# Start orchestration services
echo "🎯 Starting orchestration services..."
docker-compose -f docker-compose.production.yml up -d agent-orchestrator api-gateway

# Start frontend
echo "🌐 Starting frontend..."
docker-compose -f docker-compose.production.yml up -d frontend

# Optional: Start monitoring
read -p "📊 Do you want to enable monitoring (Prometheus)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Starting monitoring services..."
    docker-compose -f docker-compose.production.yml --profile monitoring up -d
fi

echo ""
echo "🎉 Enterprise AI Studio deployment completed!"
echo "=================================="
echo ""
echo "📍 Service Access Points:"
echo "   🌐 Frontend:          http://localhost"
echo "   🚪 API Gateway:       http://localhost:8080"
echo "   🤖 Phi-4 AI Service:  http://localhost:8001"
echo "   🎯 Orchestrator:      http://localhost:8002"
echo "   📊 Prometheus:        http://localhost:9090 (if enabled)"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🔍 To check service health:"
echo "   curl http://localhost:8080/health"
echo ""
echo "📋 To view logs:"
echo "   docker-compose -f docker-compose.production.yml logs -f [service-name]"
echo ""
echo "⚠️  Important Notes:"
echo "   - Phi-4 model download and loading may take 5-10 minutes on first startup"
echo "   - Monitor memory usage: docker stats"
echo "   - For production use, consider setting up SSL/TLS and proper authentication"
echo ""
echo "✅ Deployment completed successfully!"