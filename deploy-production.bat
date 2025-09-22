@echo off
REM Enterprise AI Studio - Production Deployment Script for Windows
REM Deploy with Microsoft Phi-4 Mini Instruct for Client

echo.
echo 🚀 Starting Enterprise AI Studio Production Deployment...
echo ==================================
echo.

REM Check system requirements
echo 📋 Checking system requirements...

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available. Please ensure Docker Desktop includes Compose.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are available.
echo.

REM Stop any existing services
echo 🛑 Stopping existing services...
docker-compose -f docker-compose.production.yml down --remove-orphans 2>nul
docker-compose -f docker-compose.microservices.yml down --remove-orphans 2>nul

REM Ask about cleanup
set /p cleanup="🧹 Do you want to clean up old Docker containers and images? (y/N): "
if /i "%cleanup%"=="y" (
    echo 🧹 Cleaning up old containers and images...
    docker system prune -f
    docker volume prune -f
)

REM Build services
echo 🔨 Building Enterprise AI Studio services...
docker-compose -f docker-compose.production.yml build

REM Start infrastructure services first
echo 🏗️  Starting infrastructure services...
docker-compose -f docker-compose.production.yml up -d redis postgres

REM Wait for infrastructure to be ready
echo ⏳ Waiting for infrastructure services to be ready...
timeout /t 30 /nobreak >nul

REM Start AI services
echo 🤖 Starting Phi-4 AI service...
echo    ⚠️  Note: Phi-4 model loading may take 5-10 minutes on first startup
docker-compose -f docker-compose.production.yml up -d phi4-service

REM Start orchestration services
echo 🎯 Starting orchestration services...
docker-compose -f docker-compose.production.yml up -d agent-orchestrator api-gateway

REM Start frontend
echo 🌐 Starting frontend...
docker-compose -f docker-compose.production.yml up -d frontend

REM Ask about monitoring
set /p monitoring="📊 Do you want to enable monitoring (Prometheus)? (y/N): "
if /i "%monitoring%"=="y" (
    echo 📊 Starting monitoring services...
    docker-compose -f docker-compose.production.yml --profile monitoring up -d
)

echo.
echo 🎉 Enterprise AI Studio deployment completed!
echo ==================================
echo.
echo 📍 Service Access Points:
echo    🌐 Frontend:          http://localhost
echo    🚪 API Gateway:       http://localhost:8080
echo    🤖 Phi-4 AI Service:  http://localhost:8001
echo    🎯 Orchestrator:      http://localhost:8002
echo    📊 Prometheus:        http://localhost:9090 (if enabled)
echo.
echo 📊 Service Status:
docker-compose -f docker-compose.production.yml ps

echo.
echo 🔍 To check service health:
echo    curl http://localhost:8080/health
echo.
echo 📋 To view logs:
echo    docker-compose -f docker-compose.production.yml logs -f [service-name]
echo.
echo ⚠️  Important Notes:
echo    - Phi-4 model download and loading may take 5-10 minutes on first startup
echo    - Monitor memory usage: docker stats
echo    - For production use, consider setting up SSL/TLS and proper authentication
echo.
echo ✅ Deployment completed successfully!
echo.
pause