#!/bin/bash

# Simple build and push script for Docker Hub
# Usage: ./build-for-dockerhub.sh your-dockerhub-username

set -e

DOCKERHUB_USERNAME=$1
IMAGE_NAME="dangan-app"
TAG="latest"

if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo "❌ Please provide your Docker Hub username"
    echo "Usage: ./build-for-dockerhub.sh your-dockerhub-username"
    exit 1
fi

echo "🐳 Building Docker image..."
docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG} .

echo "📤 Pushing to Docker Hub..."
docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}

echo "✅ Image pushed successfully!"
echo "📋 Update captain-definition with:"
echo "   \"imageName\": \"${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}\""
