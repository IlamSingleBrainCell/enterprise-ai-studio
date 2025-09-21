# Enterprise AI Studio - Database Deployment Guide

## 🗄️ Database Integration Options

This guide covers deploying Enterprise AI Studio with persistent database authentication using Bitnami PostgreSQL.

### **Option 1: Frontend Only (Current)**
```bash
# Current deployment - no database
docker-compose up -d
```

### **Option 2: Full Stack with Database (New)**
```bash
# Deploy with PostgreSQL database
docker-compose -f docker-compose.with-db.yml up -d
```

---

## 🚀 **Quick Start with Database**

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (important!)
nano .env
```

**Required Environment Variables:**
```env
# Database passwords (change these!)
DB_ROOT_PASSWORD=your_secure_root_password
DB_PASSWORD=your_secure_user_password
DB_REPLICATION_PASSWORD=your_replication_password

# JWT secret for authentication (change this!)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# API keys
GEMINI_API_KEY=your_gemini_api_key
```

### **2. Deploy Full Stack**
```bash
# Deploy all services
docker-compose -f docker-compose.with-db.yml up -d

# Check service status
docker-compose -f docker-compose.with-db.yml ps

# View logs
docker-compose -f docker-compose.with-db.yml logs -f
```

### **3. Access the Application**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432 (internal only)

---

## 🏗️ **Architecture Overview**

### **Services Included:**
1. **Frontend** (enterprise_ai_studio_app)
   - Nginx serving the React/Vite application
   - Port: 8080
   - Contains all the Agent UI and Education features

2. **Backend API** (enterprise_ai_backend)
   - Node.js/Express REST API
   - Port: 3001
   - Handles authentication, user management, workspaces

3. **Database** (enterprise_ai_db)
   - Bitnami PostgreSQL 15
   - Port: 5432 (internal)
   - Persistent user data, sessions, workspaces

4. **Redis Cache** (enterprise_ai_redis) - Optional
   - Session storage and caching
   - Port: 6379 (internal)
   - Use profile: `--profile full`

### **Database Schema:**
- **users**: User accounts and profiles
- **user_sessions**: JWT session management
- **workspaces**: Team collaboration spaces
- **workspace_members**: Team membership
- **projects**: AI agent projects
- **workflows**: Workflow execution history
- **workflow_phases**: Detailed phase tracking
- **agent_configurations**: Custom agent settings
- **api_usage**: Usage analytics
- **audit_logs**: Security and compliance logs

---

## 🔧 **Configuration**

### **Database Configuration**
The Bitnami PostgreSQL image provides enhanced security and production features:

```yaml
environment:
  POSTGRESQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
  POSTGRESQL_DATABASE: enterprise_ai_studio
  POSTGRESQL_USERNAME: aiuser
  POSTGRESQL_PASSWORD: ${DB_PASSWORD}
  POSTGRESQL_REPLICATION_MODE: master
  POSTGRESQL_REPLICATION_USER: replicator
  POSTGRESQL_REPLICATION_PASSWORD: ${DB_REPLICATION_PASSWORD}
```

### **Backend API Configuration**
```yaml
environment:
  NODE_ENV: production
  DATABASE_URL: postgresql://aiuser:${DB_PASSWORD}@postgres:5432/enterprise_ai_studio
  JWT_SECRET: ${JWT_SECRET}
  GEMINI_API_KEY: ${GEMINI_API_KEY}
```

---

## 🔐 **Authentication Features**

### **Available Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user
- `GET /api/workspaces` - Get user workspaces
- `POST /api/workspaces` - Create workspace

### **Default Admin Account:**
- **Email**: admin@enterprise-ai-studio.com
- **Username**: admin
- **Password**: admin123
- **Role**: admin
- **Subscription**: enterprise

### **Security Features:**
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- Session management
- Input validation
- SQL injection protection
- CORS security

---

## 🐳 **Deployment Commands**

### **Development**
```bash
# Start with database
docker-compose -f docker-compose.with-db.yml up

# Start specific services
docker-compose -f docker-compose.with-db.yml up postgres backend

# Rebuild and start
docker-compose -f docker-compose.with-db.yml up --build
```

### **Production**
```bash
# Deploy full stack in background
docker-compose -f docker-compose.with-db.yml up -d

# Deploy with Redis cache
docker-compose -f docker-compose.with-db.yml --profile full up -d

# Scale backend (multiple instances)
docker-compose -f docker-compose.with-db.yml up -d --scale backend=3
```

### **Maintenance**
```bash
# Stop all services
docker-compose -f docker-compose.with-db.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.with-db.yml down -v

# View logs for specific service
docker-compose -f docker-compose.with-db.yml logs -f postgres
docker-compose -f docker-compose.with-db.yml logs -f backend

# Execute SQL commands
docker-compose -f docker-compose.with-db.yml exec postgres psql -U aiuser -d enterprise_ai_studio
```

---

## 📊 **Monitoring & Health Checks**

### **Health Check Endpoints:**
- **Frontend**: http://localhost:8080/health
- **Backend**: http://localhost:3001/health
- **Database**: Built-in PostgreSQL health checks

### **Monitoring Commands:**
```bash
# Check all service status
docker-compose -f docker-compose.with-db.yml ps

# View resource usage
docker stats

# Check database connection
docker-compose -f docker-compose.with-db.yml exec postgres pg_isready -U aiuser

# Monitor logs in real-time
docker-compose -f docker-compose.with-db.yml logs -f --tail=100
```

---

## 🔄 **Data Persistence**

### **Volumes:**
- `postgres_data`: Database files (persistent)
- `redis_data`: Cache data (optional)
- `./logs`: Nginx logs (optional)

### **Backup & Restore:**
```bash
# Backup database
docker-compose -f docker-compose.with-db.yml exec postgres pg_dump -U aiuser enterprise_ai_studio > backup.sql

# Restore database
docker-compose -f docker-compose.with-db.yml exec -T postgres psql -U aiuser enterprise_ai_studio < backup.sql

# Backup volumes
docker run --rm -v enterprise_ai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## 🚀 **Frontend Integration**

### **API Integration in Frontend:**
The frontend can now make authenticated API calls:

```javascript
// Login example
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);

// Authenticated requests
const profileResponse = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 🔧 **Customization**

### **Environment Profiles:**
- **Default**: Frontend + Backend + PostgreSQL
- **Full**: Adds Redis cache (`--profile full`)
- **Production**: Includes reverse proxy (`--profile production`)

### **Scaling Options:**
```bash
# Horizontal scaling
docker-compose -f docker-compose.with-db.yml up -d --scale backend=3

# Load balancer (add to docker-compose)
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx-lb.conf:/etc/nginx/nginx.conf
  depends_on:
    - backend
```

### **Custom Backend Extensions:**
Add these directories to extend functionality:
- `backend/routes/` - Additional API routes
- `backend/middleware/` - Custom middleware
- `backend/models/` - Database models
- `backend/services/` - Business logic services

---

## 🛡️ **Security Considerations**

### **Production Security:**
1. **Change Default Passwords**: Update all passwords in `.env`
2. **JWT Secret**: Use a strong, unique JWT secret
3. **Database Access**: Restrict database ports in production
4. **HTTPS**: Use SSL certificates for production
5. **Rate Limiting**: Configured for API protection
6. **Input Validation**: All inputs validated and sanitized

### **Network Security:**
```yaml
# Production network isolation
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

---

## 📈 **Performance Optimization**

### **Database Performance:**
- Connection pooling (max 20 connections)
- Indexed queries for common operations
- Prepared statements for security and performance

### **API Performance:**
- Compression middleware
- Rate limiting
- Response caching
- Efficient query patterns

### **Monitoring:**
- Health checks for all services
- Graceful shutdown handling
- Resource limits and requests
- Automated restart policies

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**Database Connection Failed:**
```bash
# Check database status
docker-compose -f docker-compose.with-db.yml ps postgres

# View database logs
docker-compose -f docker-compose.with-db.yml logs postgres

# Test connection
docker-compose -f docker-compose.with-db.yml exec postgres pg_isready -U aiuser
```

**Backend API Not Responding:**
```bash
# Check backend status
docker-compose -f docker-compose.with-db.yml ps backend

# Test health endpoint
curl http://localhost:3001/health

# View backend logs
docker-compose -f docker-compose.with-db.yml logs backend
```

**Authentication Issues:**
```bash
# Check JWT secret is set
docker-compose -f docker-compose.with-db.yml exec backend env | grep JWT

# Verify database tables exist
docker-compose -f docker-compose.with-db.yml exec postgres psql -U aiuser -d enterprise_ai_studio -c "\dt"
```

---

**🎉 Your Enterprise AI Studio is now ready with full database authentication!**

Access the platform at http://localhost:8080 and create your account or login with the admin credentials.