#!/bin/bash

# Build and Push Script for Dangan App
# This script builds the Docker image locally and pushes it to a registry

set -e  # Exit on any error

# Configuration
IMAGE_NAME="dangan-app"
TAG="latest"
REGISTRY_URL=""  # Set this to your Docker registry URL (e.g., "your-registry.com" or leave empty for Docker Hub)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Building and pushing Dangan app...${NC}"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Build the image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

# Ask user for registry choice
echo ""
echo -e "${BLUE}📤 Where would you like to push the image?${NC}"
echo "1) Docker Hub (docker.io)"
echo "2) Custom registry"
echo "3) Skip push (image will be available locally)"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        # Docker Hub
        echo -e "${YELLOW}📤 Pushing to Docker Hub...${NC}"
        echo "Please enter your Docker Hub credentials:"
        docker login
        docker tag ${IMAGE_NAME}:${TAG} ${IMAGE_NAME}:${TAG}
        docker push ${IMAGE_NAME}:${TAG}
        echo -e "${GREEN}✅ Image pushed to Docker Hub!${NC}"
        echo -e "${BLUE}💡 Update captain-definition with: \"imageName\": \"${IMAGE_NAME}:${TAG}\"${NC}"
        ;;
    2)
        # Custom registry
        read -p "Enter your registry URL (e.g., your-registry.com): " REGISTRY_URL
        if [ -z "$REGISTRY_URL" ]; then
            echo -e "${RED}❌ Registry URL cannot be empty!${NC}"
            exit 1
        fi
        echo -e "${YELLOW}📤 Pushing to ${REGISTRY_URL}...${NC}"
        docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY_URL}/${IMAGE_NAME}:${TAG}
        docker push ${REGISTRY_URL}/${IMAGE_NAME}:${TAG}
        echo -e "${GREEN}✅ Image pushed to ${REGISTRY_URL}!${NC}"
        echo -e "${BLUE}💡 Update captain-definition with: \"imageName\": \"${REGISTRY_URL}/${IMAGE_NAME}:${TAG}\"${NC}"
        ;;
    3)
        echo -e "${YELLOW}⏭️  Skipping push. Image is available locally as ${IMAGE_NAME}:${TAG}${NC}"
        echo -e "${BLUE}💡 For local testing, run:${NC}"
        echo -e "${BLUE}   docker run -p 8080:80 -e DATABASE_URL=your_db_url -e SECRET_KEY=your_secret_key ${IMAGE_NAME}:${TAG}${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Build process completed!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update captain-definition with the correct imageName"
echo "2. Deploy to CapRover using: caprover deploy"
echo "3. Set environment variables in CapRover dashboard"
