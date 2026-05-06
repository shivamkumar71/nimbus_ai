# 🚀 Deployment Guide

This guide will help you deploy Nimbus Weather to production.

## Prerequisites

- Docker and Docker Compose installed (for local VPS deployment)
- A cloud provider (Render for backend, Netlify for frontend)
- Domain name (optional)
- Git repository (GitHub, GitLab, etc.)

## Deployment Options

### Option 1: Split Deployment (Recommended) - Backend on Render + Frontend on Netlify

This approach separates your backend API and frontend, allowing independent scaling and faster frontend deployments.

#### Benefits:
- ⚡ Faster frontend deployments (Netlify CDN)
- 🔄 Independent backend updates
- 🌍 Global frontend delivery via Netlify CDN
- 💰 Cost-effective (Render free tier + Netlify free tier)

#### Step 1: Deploy Backend to Render

1. **Prepare Your Repository**
   ```bash
   git add .
   git commit -m "Setup split deployment"
   git push origin main
   ```

2. **Deploy Backend**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will detect `render.yaml` (backend-only)
   - Click **"Apply"** to deploy

3. **Your Backend URL**
   - Backend will be available at: `https://nimbus-weather-api.onrender.com/api/`
   - Save this URL for the frontend configuration

#### Step 2: Deploy Frontend to Netlify

1. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **GitHub** and choose your repository

2. **Configure Build Settings**
   - **Base directory**: `.` (root)
   - **Build command**: `pnpm install --frozen-lockfile && cd artifacts/weather-app && pnpm run build`
   - **Publish directory**: `artifacts/weather-app/dist`
   - **Environment variables**:
     - `VITE_API_URL`: `https://nimbus-weather-api.onrender.com/api`
     - `NODE_VERSION`: `20`

3. **Deploy**
   - Click **"Deploy"**
   - Netlify will build and deploy your frontend

4. **Access Your Application**
   - Frontend: `https://your-site.netlify.app`
   - Backend API: `https://nimbus-weather-api.onrender.com/api/`

#### Updating After Deployment

- **Backend updates**: Push to `main` → Render auto-rebuilds
- **Frontend updates**: Push to `main` → Netlify auto-rebuilds
- **API URL changes**: Update environment variable `VITE_API_URL` in Netlify dashboard

---

### Option 2: Docker Compose (For Self-Hosted VPS)

#### 1. Build the Frontend

```bash
cd artifacts/weather-app
pnpm install
pnpm run build
```

#### 2. Deploy with Docker Compose

```bash
# From project root
docker-compose up -d --build
```

This will:
- Build and start the Python backend on port 8080
- Serve the frontend with nginx on port 80
- Configure nginx to proxy API requests to the backend

#### 3. Access Your Application

- Frontend: http://your-server-ip
- Backend API: http://your-server-ip/api/

---

### Option 3: Render Blueprint (Monolithic - Not Recommended)

For deployments where both frontend and backend run on the same server:

1. Edit `render.yaml` to include frontend build command
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository
5. Click **"Apply"** to deploy

**Note**: This approach is slower for frontend-only changes. Use Option 1 for better performance.

If you want to deploy frontend and backend separately:

1. Build the frontend:
   ```bash
   cd artifacts/weather-app
   pnpm install
   pnpm run build
   ```
2. Deploy the `dist/public` folder to Vercel/Netlify
3. Update `src/lib/weatherApi.ts` to point to your backend URL:
   ```typescript
   const API_BASE = "https://your-backend-url.onrender.com/api";
   ```
4. Redeploy the frontend

### Option 3: Traditional VPS Deployment

#### Backend Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Install Python and dependencies
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Clone your repository
git clone https://github.com/yourusername/nimbus-weather.git
cd nimbus-weather/artifacts/api-server/python

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install and configure gunicorn
pip install gunicorn
```

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/nimbus-backend.service
```

Add the following content:

```ini
[Unit]
Description=Nimbus Weather Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/nimbus-weather/artifacts/api-server/python
Environment="PATH=/path/to/nimbus-weather/artifacts/api-server/python/venv/bin"
ExecStart=/path/to/nimbus-weather/artifacts/api-server/python/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8080
Restart=always

[Install]
WantedBy=multi-user.target
```

Start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl start nimbus-backend
sudo systemctl enable nimbus-backend
```

#### Frontend Setup with Nginx

```bash
# Install nginx
sudo apt install nginx

# Build frontend locally and upload dist/public folder
# Or build on server:
cd /path/to/nimbus-weather/artifacts/weather-app
pnpm install
pnpm run build

# Copy to nginx
sudo cp -r dist/public/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/nimbus
```

Add nginx configuration (see nginx.conf in this repo).

```bash
sudo ln -s /etc/nginx/sites-available/nimbus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Variables

For production, you may want to set these environment variables:

### Backend
- `PYTHONUNBUFFERED=1` - For better logging
- `LOG_LEVEL=INFO` - Set logging level

### Frontend
- `VITE_API_URL` - Your backend API URL (if deploying separately)

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Automatic Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

## Monitoring

### Check Backend Health

```bash
curl http://localhost:8080/api/healthz
```

### View Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Systemd logs
sudo journalctl -u nimbus-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Performance Optimization

### Enable Caching

The nginx configuration includes caching headers. Adjust as needed.

### Database Caching (Future)

Consider adding Redis for caching weather data to reduce API calls.

### CDN for Static Assets

For high-traffic deployments, serve static assets through a CDN like Cloudflare.

## Security Checklist

- [ ] Change default passwords/keys
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall (ufw)
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Rate limiting on API endpoints
- [ ] CORS configuration

## Troubleshooting

### Backend not starting

```bash
# Check if port 8080 is in use
sudo lsof -i :8080

# Check backend logs
docker-compose logs backend
```

### Frontend not loading

```bash
# Check nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### API calls failing

- Verify backend is running on port 8080
- Check nginx proxy configuration
- Verify CORS settings in backend

## Scaling

### Horizontal Scaling

For high traffic, consider:
- Load balancer (nginx, HAProxy)
- Multiple backend instances
- Database for caching (Redis)

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable compression

## Backup Strategy

- Regular database backups (if using database)
- Backup configuration files
- Backup SSL certificates
- Document your deployment setup

## Support

For deployment issues, check:
- GitHub Issues
- Documentation
- Community forums

---

**Deployment Checklist:**

- [ ] Frontend built successfully
- [ ] Backend dependencies installed
- [ ] Docker images built (if using Docker)
- [ ] Services running and healthy
- [ ] SSL/HTTPS configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Security measures implemented
