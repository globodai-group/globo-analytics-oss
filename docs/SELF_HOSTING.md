# Self-Hosting Guide

This guide covers everything you need to deploy GloboAnalytics on your own infrastructure.

## Table of Contents

- [Requirements](#requirements)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Database Setup](#database-setup)
- [Scaling](#scaling)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### Minimum Specifications

| Resource   | Minimum | Recommended |
| ---------- | ------- | ----------- |
| CPU        | 1 core  | 2+ cores    |
| RAM        | 1 GB    | 2+ GB       |
| Storage    | 10 GB   | 50+ GB      |
| PostgreSQL | 15+     | 16+         |

### Software Requirements

- Docker 24+ and Docker Compose 2+ (for Docker deployment)
- Node.js 20+ (for manual deployment)
- PostgreSQL 15+
- Redis 7+ (optional, recommended)

---

## Docker Deployment

### Quick Start

```bash
# Clone the repository
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss

# Copy environment file
cp .env.example .env

# Generate secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 48)" >> .env

# Edit configuration
nano .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f app
```

### Production Docker Compose

For production, use this enhanced configuration:

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    image: globoanalytics/oss:v1.0.0 # Pin version
    restart: always
    environment:
      - DATABASE_URL=postgresql://globoanalytics:${DB_PASSWORD}@postgres:5432/globoanalytics
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - LICENSE_KEY=${LICENSE_KEY:-}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_USER=globoanalytics
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=globoanalytics
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U globoanalytics"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  postgres_data:
  redis_data:
```

### Building Custom Image

If you need to customize the image:

```bash
# Build with your modifications
docker build -t my-globo-analytics:latest -f docker/Dockerfile .

# Use in docker-compose.yml
# image: my-globo-analytics:latest
```

---

## Manual Deployment

### Step 1: Install Dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server

# Install pnpm
npm install -g pnpm
```

### Step 2: Clone and Setup

```bash
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss
pnpm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env

# Edit with your settings
nano .env
```

Key settings:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/globoanalytics"
NEXTAUTH_SECRET="$(openssl rand -base64 48)"
NEXTAUTH_URL="https://analytics.yourdomain.com"
```

### Step 4: Database Setup

```bash
# Create database
sudo -u postgres createdb globoanalytics

# Run migrations
pnpm db:migrate
```

### Step 5: Build and Start

```bash
# Build for production
pnpm build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start npm --name "globo-analytics" -- start
pm2 save
pm2 startup
```

---

## Reverse Proxy Setup

### Nginx

```nginx
# /etc/nginx/sites-available/globo-analytics
server {
    listen 80;
    server_name analytics.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name analytics.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/analytics.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/analytics.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Tracker script - aggressive caching
    location /tracker.js {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

### Caddy

```caddy
# Caddyfile
analytics.yourdomain.com {
    reverse_proxy localhost:3000

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    @static path /_next/static/*
    header @static Cache-Control "public, max-age=31536000, immutable"
}
```

### Traefik (Docker)

```yaml
# docker-compose.yml addition
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.globo.rule=Host(`analytics.yourdomain.com`)"
  - "traefik.http.routers.globo.tls=true"
  - "traefik.http.routers.globo.tls.certresolver=letsencrypt"
```

---

## SSL/TLS Configuration

### Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d analytics.yourdomain.com

# Auto-renewal is configured automatically
```

### Self-Signed (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/analytics.key \
  -out /etc/ssl/certs/analytics.crt
```

---

## Database Setup

### PostgreSQL Configuration

For production, tune these settings in `postgresql.conf`:

```ini
# /etc/postgresql/16/main/postgresql.conf

# Memory
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 768MB        # 75% of RAM
work_mem = 16MB
maintenance_work_mem = 64MB

# Connections
max_connections = 100

# Write Ahead Log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

### Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -U globoanalytics globoanalytics | gzip > /backups/globo_$DATE.sql.gz

# Keep last 30 days
find /backups -name "globo_*.sql.gz" -mtime +30 -delete
```

Add to crontab:

```bash
0 3 * * * /path/to/backup.sh
```

---

## Scaling

### Horizontal Scaling

For high traffic, run multiple app instances behind a load balancer:

```yaml
# docker-compose.scale.yml
services:
  app:
    deploy:
      replicas: 3
    # Ensure sticky sessions or use Redis for sessions
```

### Database Scaling

- **Read replicas**: For read-heavy workloads
- **Connection pooling**: Use PgBouncer
- **Partitioning**: For large event tables

### Redis Configuration

```bash
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
```

---

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
# Returns: {"status":"ok","version":"1.0.0"}
```

### Prometheus Metrics

Coming soon: `/api/metrics` endpoint for Prometheus scraping.

### Recommended Stack

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Loki**: Log aggregation
- **Alertmanager**: Alerting

---

## Troubleshooting

### Common Issues

#### App won't start

```bash
# Check logs
docker-compose logs app

# Common causes:
# - DATABASE_URL incorrect
# - NEXTAUTH_SECRET not set
# - Port 3000 already in use
```

#### Database connection errors

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL is running
sudo systemctl status postgresql
```

#### Memory issues

```bash
# Increase container memory
deploy:
  resources:
    limits:
      memory: 2G
```

#### Tracker not loading

```bash
# Check CORS headers
# Ensure NEXTAUTH_URL matches your domain
```

### Getting Help

- [GitHub Discussions](https://github.com/globodai-group/globo-analytics-oss/discussions)
- [Discord Community](https://discord.gg/globoanalytics)

---

## Next Steps

- [Configure environment variables](./CONFIGURATION.md)
- [Set up the tracking script](./TRACKER.md)
- [API documentation](./API.md)
