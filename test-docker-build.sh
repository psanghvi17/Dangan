#!/bin/bash

echo "🐳 Testing Docker build locally..."
echo "================================"

# Build the Docker image
echo "Building Docker image..."
docker build -t dangan-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo ""
    echo "🚀 To run the container locally:"
    echo "docker run -p 8080:80 -e DATABASE_URL=your_db_url -e SECRET_KEY=your_secret_key dangan-test"
    echo ""
    echo "Then visit: http://localhost:8080"
else
    echo "❌ Docker build failed!"
    echo "Check the error messages above."
fi
