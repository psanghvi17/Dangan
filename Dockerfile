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

# Copy committed prebuilt frontend directly
COPY frontend/build /var/www/html

# Remove any default nginx site/config to avoid conflicts, and write our config
RUN rm -f /etc/nginx/sites-enabled/default || true && \
    rm -f /etc/nginx/conf.d/default.conf || true && \
    echo 'server {' > /etc/nginx/conf.d/app.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/app.conf && \
    echo '    server_name _;' >> /etc/nginx/conf.d/app.conf && \
    echo '    root /var/www/html;' >> /etc/nginx/conf.d/app.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/app.conf && \
    echo '    location /api {' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_pass http://127.0.0.1:8000;' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/conf.d/app.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/conf.d/app.conf && \
    echo '    }' >> /etc/nginx/conf.d/app.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/app.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/app.conf && \
    echo '    }' >> /etc/nginx/conf.d/app.conf && \
    echo '}' >> /etc/nginx/conf.d/app.conf

# Create startup script (run nginx without init system)
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'set -euo pipefail' >> /start.sh && \
    echo 'mkdir -p /var/lib/nginx/body /var/cache/nginx /var/run/nginx' >> /start.sh && \
    echo 'chown -R www-data:www-data /var/lib/nginx /var/cache/nginx /var/run/nginx || true' >> /start.sh && \
    echo 'uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 &' >> /start.sh && \
    echo 'exec nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Run as root to allow nginx to bind to port 80 and manage its temp dirs

# Expose port
EXPOSE 80

# Start both services
CMD ["/start.sh"]
