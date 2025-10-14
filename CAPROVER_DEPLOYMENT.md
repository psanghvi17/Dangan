# CapRover Deployment Guide

This guide explains how to deploy the Dangan application using CapRover with Git-based deployment.

## Prerequisites

1. CapRover server set up and running
2. Domain name configured for your application
3. Database (PostgreSQL) accessible from your CapRover server
4. Git repository (GitHub, GitLab, or any Git hosting service)
5. Git configured locally

## Deployment Steps

### 1. Database Setup

First, you need to set up a PostgreSQL database. You can either:
- Use CapRover's one-click apps to deploy PostgreSQL
- Use an external PostgreSQL service
- Use CapRover's built-in database management

### 2. Push Code to Git Repository

**Option A: Using the interactive script**
```bash
# Navigate to the project directory
cd /path/to/your/dangan/project

# Run the Git deployment script
./deploy-to-git.sh
```

**Option B: Quick deploy**
```bash
# Quick commit and push
./quick-deploy.sh "Your commit message"
```

**Option C: Manual Git commands**
```bash
# Add all changes
git add .

# Commit changes
git commit -m "Deploy Dangan app - $(date)"

# Push to repository
git push origin main
```

### 3. Configure CapRover App

1. **Create a new app in CapRover dashboard:**
   - App name: `dangan-app` (or your preferred name)
   - Enable HTTPS and set up your domain

2. **Connect Git Repository:**
   - Go to App Configs → Source Code
   - Select "Git Repository"
   - Enter your repository URL
   - Set branch to `main` (or your default branch)

3. **Configure Build Settings:**
   - CapRover will automatically detect the `captain-definition` file
   - It will use the `Dockerfile` to build your application

### 4. Deploy to CapRover

1. **Deploy the application:**
   - In CapRover dashboard, go to your app
   - Click "Deploy" or "One-Click Deploy"
   - CapRover will pull from your Git repository and build the Docker image

2. **Configure environment variables in CapRover dashboard:**
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: A secure secret key for JWT tokens
   - `ALGORITHM`: HS256 (default)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: 30 (default)
   - `REACT_APP_API_URL`: Your backend API URL (e.g., `https://yourdomain.com/api`)

### 3. Database Migration

After deploying the application, you need to run database migrations:

1. **Access the backend container:**
   - Go to CapRover dashboard → Apps → dangan-app → App Configs
   - Enable "Enable Terminal Access"

2. **Run migrations:**
   ```bash
   # Access the container terminal
   docker exec -it <backend-container-name> alembic upgrade head
   ```

### 4. CORS Configuration

Make sure your backend allows requests from your frontend domain by updating the CORS settings in your FastAPI app.

## Environment Variables

### Backend Environment Variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

### Frontend Environment Variables:
- `REACT_APP_API_URL`: Backend API URL

## Production Considerations

1. **Security:**
   - Use strong, unique secret keys
   - Enable HTTPS for both frontend and backend
   - Configure proper CORS settings

2. **Performance:**
   - The backend is configured with 4 workers
   - Frontend is served via nginx for better performance
   - Static assets are cached for 1 year

3. **Monitoring:**
   - Monitor your applications through CapRover dashboard
   - Set up log monitoring
   - Configure health checks

## Troubleshooting

1. **Database Connection Issues:**
   - Verify DATABASE_URL is correct
   - Check if database is accessible from CapRover server
   - Ensure database user has proper permissions

2. **Frontend API Connection Issues:**
   - Verify REACT_APP_API_URL is correct
   - Check CORS configuration in backend
   - Ensure backend is accessible from frontend

3. **Build Issues:**
   - Check Dockerfile syntax
   - Verify all dependencies are included
   - Check build logs in CapRover dashboard

## File Structure

The following files have been added/modified for CapRover deployment:

```
├── captain-definition (root - uses Dockerfile)
├── Dockerfile (root - multi-stage build)
├── deploy-to-git.sh (interactive Git deployment script)
├── quick-deploy.sh (quick Git commit and push)
├── docker-compose.yml (updated)
├── backend/
│   └── Dockerfile (updated)
├── frontend/
│   ├── Dockerfile (updated)
│   └── nginx.conf
└── CAPROVER_DEPLOYMENT.md
```

## Architecture

The application uses a Git-based deployment approach:
- **Git Repository**: Code is stored in Git (GitHub, GitLab, etc.)
- **CapRover Build**: CapRover pulls from Git and builds Docker image on server
- **Single Container**: Both frontend and backend run in the same container
- **Nginx Proxy**: Serves frontend on port 80 and proxies `/api` requests to backend

## Benefits of Git-based Deployment

✅ **No Docker Registry Needed**: No need for Docker Hub or other registries  
✅ **Version Control**: Full Git history and easy rollbacks  
✅ **Simple Workflow**: Just commit and push to deploy  
✅ **Cost Effective**: No registry fees or storage costs  
✅ **Easy Collaboration**: Standard Git workflow for team development

## Next Steps

1. Set up your CapRover server
2. Configure your domain
3. Push code to Git repository
4. Connect Git repository to CapRover
5. Deploy to CapRover (builds from Git)
6. Run database migrations
7. Test the complete application
8. Configure monitoring and backups

## Quick Start Commands

```bash
# 1. Push code to Git repository
./quick-deploy.sh "Deploy Dangan app"

# 2. In CapRover dashboard:
#    - Create new app
#    - Connect Git repository
#    - Deploy!

# 3. Set environment variables in CapRover dashboard
```

## Workflow Summary

1. **Develop locally** → Make changes to your code
2. **Commit and push** → `./quick-deploy.sh "Your changes"`
3. **Deploy on CapRover** → Click deploy in dashboard
4. **CapRover builds** → Pulls from Git and builds Docker image
5. **App runs** → Your application is live!
