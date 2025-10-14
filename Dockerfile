# Multi-stage build for both frontend and backend
FROM node:18-alpine as frontend-build

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ .

# Debug: Check what files we have
RUN echo "=== Listing /app directory ===" && ls -la /app
RUN echo "=== Listing /app/public directory ===" && ls -la /app/public
RUN echo "=== Checking if index.html exists ===" && test -f /app/public/index.html && echo "index.html exists" || echo "index.html NOT found"

# Build frontend
RUN npm run build

# Backend stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Copy built frontend from frontend-build stage
COPY --from=frontend-build /app/build /var/www/html

# Create nginx configuration for serving frontend and proxying API
RUN echo 'server {' > /etc/nginx/sites-available/default && \
    echo '    listen 80;' >> /etc/nginx/sites-available/default && \
    echo '    server_name localhost;' >> /etc/nginx/sites-available/default && \
    echo '    root /var/www/html;' >> /etc/nginx/sites-available/default && \
    echo '    index index.html;' >> /etc/nginx/sites-available/default && \
    echo '    location /api {' >> /etc/nginx/sites-available/default && \
    echo '        proxy_pass http://localhost:8000;' >> /etc/nginx/sites-available/default && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/sites-available/default && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/sites-available/default && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/sites-available/default && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/sites-available/default && \
    echo '    }' >> /etc/nginx/sites-available/default && \
    echo '    location / {' >> /etc/nginx/sites-available/default && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/sites-available/default && \
    echo '    }' >> /etc/nginx/sites-available/default && \
    echo '}' >> /etc/nginx/sites-available/default

# Create startup script
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'service nginx start' >> /start.sh && \
    echo 'uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 &' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose port
EXPOSE 80

# Start both services
CMD ["/start.sh"]
