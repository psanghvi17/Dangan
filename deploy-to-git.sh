#!/bin/bash

# Git Deployment Script for Dangan App
# This script commits changes and pushes to Git repository for CapRover deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Dangan app to Git...${NC}"
echo "=================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a Git repository. Please initialize Git first:${NC}"
    echo "   git init"
    echo "   git remote add origin your-repository-url"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}📝 Found uncommitted changes. Adding all files...${NC}"
    git add .
    
    # Get commit message
    read -p "Enter commit message (or press Enter for default): " commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Deploy Dangan app - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    echo -e "${YELLOW}💾 Committing changes...${NC}"
    git commit -m "$commit_message"
else
    echo -e "${GREEN}✅ No uncommitted changes found.${NC}"
fi

# Check if remote is configured
if ! git remote get-url origin > /dev/null 2>&1; then
    echo -e "${RED}❌ No remote origin configured. Please add your repository:${NC}"
    echo "   git remote add origin your-repository-url"
    exit 1
fi

# Push to remote repository
echo -e "${YELLOW}📤 Pushing to Git repository...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to Git repository!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Go to your CapRover dashboard"
    echo "2. Create a new app (if not already created)"
    echo "3. Connect your Git repository to CapRover"
    echo "4. Set up environment variables"
    echo "5. Deploy!"
    echo ""
    echo -e "${BLUE}💡 CapRover will now build from your Git repository${NC}"
else
    echo -e "${RED}❌ Failed to push to Git repository!${NC}"
    echo "Please check your Git configuration and try again."
    exit 1
fi
