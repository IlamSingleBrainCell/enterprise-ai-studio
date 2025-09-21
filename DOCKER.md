# Enterprise AI Studio - Docker Deployment Guide

## 🐳 Docker Deployment

This guide covers how to build, run, and deploy the Enterprise AI Studio (Agent as a Service Platform) using Docker.

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- 2GB+ RAM available
- Docker Hub account (for pushing images)

### Quick Start

#### 1. Local Development
```bash
# Build and run locally
docker-compose up --build

# Access the application
open http://localhost:8080
```

#### 2. Production Build
```bash
# Build production image
docker build -t enterprise_ai_studio:latest .

# Run production container
docker run -d -p 8080:80 --name enterprise_ai_studio enterprise_ai_studio:latest
```

### Docker Hub Deployment

#### Build and Push to Docker Hub
```bash
# Login to Docker Hub
docker login

# Build with proper tag
docker build -t singlebraincell/enterprise_ai_studio:latest .

# Push to Docker Hub
docker push singlebraincell/enterprise_ai_studio:latest

# Optional: Tag specific version
docker tag singlebraincell/enterprise_ai_studio:latest singlebraincell/enterprise_ai_studio:v1.0.0
docker push singlebraincell/enterprise_ai_studio:v1.0.0
```

#### Pull and Run from Docker Hub
```bash
# Pull latest image
docker pull singlebraincell/enterprise_ai_studio:latest

# Run the container
docker run -d \
  --name enterprise_ai_studio \
  -p 8080:80 \
  --restart unless-stopped \
  singlebraincell/enterprise_ai_studio:latest
```

### Container Configuration

#### Environment Variables
- `NODE_ENV`: Set to `production` for production builds
- `NGINX_HOST`: Hostname for nginx (default: localhost)
- `NGINX_PORT`: Port for nginx (default: 80)

#### Volumes
- `/var/log/nginx`: Nginx logs
- `/usr/share/nginx/html`: Static files (read-only)

#### Health Check
The container includes a health check endpoint at `/health` that returns:
- `200 OK`: Container is healthy
- `503 Service Unavailable`: Container is unhealthy

### Production Deployment Options

#### 1. Simple Single Container
```bash
docker run -d \
  --name enterprise_ai_studio \
  -p 80:80 \
  --restart unless-stopped \
  --memory="1g" \
  --cpus="0.5" \
  singlebraincell/enterprise_ai_studio:latest
```

#### 2. Docker Compose with Proxy
```bash
# Use production profile with reverse proxy
docker-compose --profile production up -d
```

#### 3. Docker Swarm (Multi-node)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml enterprise_ai_studio
```

#### 4. Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enterprise_ai_studio
spec:
  replicas: 3
  selector:
    matchLabels:
      app: enterprise_ai_studio
  template:
    metadata:
      labels:
        app: enterprise_ai_studio
    spec:
      containers:
      - name: enterprise_ai_studio
        image: singlebraincell/enterprise_ai_studio:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: enterprise_ai_studio_service
spec:
  selector:
    app: enterprise_ai_studio
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

### Monitoring & Logging

#### View Logs
```bash
# Container logs
docker logs enterprise_ai_studio

# Follow logs
docker logs -f enterprise_ai_studio

# Nginx access logs
docker exec enterprise_ai_studio tail -f /var/log/nginx/access.log
```

#### Health Monitoring
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' enterprise_ai_studio

# Manual health check
curl http://localhost:8080/health
```

### Troubleshooting

#### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 8080
   lsof -i :8080
   # Kill process or use different port
   docker run -p 8081:80 singlebraincell/enterprise_ai_studio:latest
   ```

2. **Build Failures**
   ```bash
   # Clean build with no cache
   docker build --no-cache -t enterprise_ai_studio:latest .
   ```

3. **Container Won't Start**
   ```bash
   # Check logs
   docker logs enterprise_ai_studio
   # Run interactively for debugging
   docker run -it --rm enterprise_ai_studio:latest sh
   ```

4. **Memory Issues**
   ```bash
   # Increase memory limit
   docker run --memory="2g" singlebraincell/enterprise_ai_studio:latest
   ```

### Security Best Practices

1. **Run as Non-root User** (already configured)
2. **Use Official Base Images** (nginx:alpine)
3. **Minimal Attack Surface** (multi-stage build)
4. **Security Headers** (configured in nginx.conf)
5. **Regular Updates**
   ```bash
   # Update base images regularly
   docker pull nginx:alpine
   docker build --pull -t enterprise_ai_studio:latest .
   ```

### Performance Optimization

1. **Multi-stage Build**: Reduces final image size
2. **Gzip Compression**: Enabled in nginx
3. **Static Asset Caching**: 1-year cache for static files
4. **Resource Limits**: Configure appropriate CPU/memory limits

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Build and Push Docker Image
on:
  push:
    branches: [main]
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: singlebraincell/enterprise_ai_studio:latest
```

### Support

For issues with Docker deployment:
1. Check container logs: `docker logs enterprise_ai_studio`
2. Verify health status: `curl http://localhost:8080/health`
3. Test API connectivity: Access application and check browser console
4. Review nginx configuration: `docker exec enterprise_ai_studio cat /etc/nginx/nginx.conf`

---

**Enterprise AI Studio** - Agent as a Service Platform  
Version: 1.0.0  
Docker Hub: https://hub.docker.com/r/singlebraincell/enterprise_ai_studio