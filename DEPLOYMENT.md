# Telenor Maritime LTE Reception Tracker - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Google Maps API key with Maps JavaScript API enabled
- Domain name (for production deployment)

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```bash
# Required: Get this from Google Cloud Console
GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Optional: Server configuration
PORT=3000
NODE_ENV=production

# Required for production: Your domain(s)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Maps JavaScript API"
4. Create credentials > API key
5. **Important**: Restrict your API key:
   - HTTP referrers: Add your domain(s)
   - API restrictions: Select "Maps JavaScript API"

## Development Deployment

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Access at: http://localhost:3000

## Production Deployment with Docker

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up -d

# Check logs
docker-compose logs -f telenor-maritime

# Stop the service
docker-compose down
```

### Using Docker directly

```bash
# Build the image
docker build -t telenor-maritime .

# Run the container
docker run -d \
  --name telenor-maritime \
  -p 3000:3000 \
  -e GOOGLE_MAPS_API_KEY=your_key_here \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  --restart unless-stopped \
  telenor-maritime
```

## Cloud Deployment

### AWS ECS/Fargate
1. Push image to ECR
2. Create ECS task definition with environment variables
3. Deploy with Application Load Balancer
4. Configure Route 53 for domain

### Google Cloud Run
```bash
# Deploy to Cloud Run
gcloud run deploy telenor-maritime \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars="GOOGLE_MAPS_API_KEY=your_key,NODE_ENV=production"
```

### Azure Container Instances
```bash
# Deploy to ACI
az container create \
  --resource-group myResourceGroup \
  --name telenor-maritime \
  --image your-registry/telenor-maritime \
  --ports 3000 \
  --environment-variables GOOGLE_MAPS_API_KEY=your_key NODE_ENV=production
```

## Health Monitoring

The service includes health check endpoints:

- **Health Check**: `GET /api/health`
- **Config Check**: `GET /api/config` (verifies API key is loaded)

### Monitoring Setup

```bash
# Check service health
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "telenor-maritime-lte"
}
```

## SSL/HTTPS Setup

### Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Using Traefik (Docker)

```yaml
version: '3.8'
services:
  telenor-maritime:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.telenor.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.telenor.tls.certresolver=letsencrypt"
    environment:
      - NODE_ENV=production
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - ALLOWED_ORIGINS=https://yourdomain.com
```

## Security Considerations

### API Key Security
- ✅ API key is server-side only
- ✅ Restrict API key to your domain in Google Cloud Console
- ✅ Use HTTPS in production
- ✅ Configure CORS for your domain

### Production Checklist
- [ ] GOOGLE_MAPS_API_KEY configured with domain restrictions
- [ ] ALLOWED_ORIGINS set to your domain(s)
- [ ] HTTPS/SSL configured
- [ ] Health monitoring setup
- [ ] Log aggregation configured
- [ ] Backup strategy for configuration

## Troubleshooting

### Common Issues

**Maps not loading:**
- Check browser console for API key errors
- Verify GOOGLE_MAPS_API_KEY is set
- Ensure Maps JavaScript API is enabled
- Check API key domain restrictions

**CORS errors:**
- Set ALLOWED_ORIGINS environment variable
- Verify your domain matches exactly (including protocol)

**Health check failures:**
- Check server logs: `docker-compose logs telenor-maritime`
- Verify port 3000 is accessible
- Test manually: `curl http://localhost:3000/api/health`

### Logs

```bash
# Docker Compose logs
docker-compose logs -f

# Container logs
docker logs telenor-maritime

# Follow logs in real-time
docker logs -f telenor-maritime
```

## Performance Optimization

### Caching Strategy
- Consider adding Redis for API response caching
- Enable gzip compression in reverse proxy
- Implement CDN for static assets

### Scaling
- Use horizontal scaling with load balancer
- Consider database for storing user sessions
- Implement rate limiting for API endpoints

## Support

For deployment issues:
1. Check logs for error messages
2. Verify all environment variables are set
3. Test API endpoints manually
4. Check Google Maps API quotas and billing