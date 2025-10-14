# CapRover Deployment Guide

This guide explains how to deploy the Dangan application using CapRover with a single captain-definition file.

## Prerequisites

1. CapRover server set up and running
2. Domain name configured for your application
3. Database (PostgreSQL) accessible from your CapRover server

## Deployment Steps

### 1. Database Setup

First, you need to set up a PostgreSQL database. You can either:
- Use CapRover's one-click apps to deploy PostgreSQL
- Use an external PostgreSQL service
- Use CapRover's built-in database management

### 2. Single App Deployment

1. **Create a new app in CapRover dashboard:**
   - App name: `dangan-app` (or your preferred name)
   - Enable HTTPS and set up your domain

2. **Deploy both services together:**
   ```bash
   # Navigate to the root directory
   cd /path/to/your/dangan/project
   
   # Deploy using CapRover CLI
   caprover deploy
   ```

3. **Configure environment variables in CapRover dashboard:**
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: A secure secret key for JWT tokens
   - `ALGORITHM`: HS256 (default)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: 30 (default)
   - `REACT_APP_API_URL`: Your backend API URL (e.g., `https://yourdomain.com:8000`)

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
├── captain-definition (root)
├── docker-compose.yml (updated)
├── backend/
│   └── Dockerfile (updated)
├── frontend/
│   ├── Dockerfile (updated)
│   └── nginx.conf
└── CAPROVER_DEPLOYMENT.md
```

## Next Steps

1. Set up your CapRover server
2. Configure your domain
3. Deploy the application (both services together)
4. Run database migrations
5. Test the complete application
6. Configure monitoring and backups
