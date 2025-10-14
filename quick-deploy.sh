#!/bin/bash

# Quick Deploy Script - Commits and pushes changes
# Usage: ./quick-deploy.sh "your commit message"

set -e

COMMIT_MSG=${1:-"Deploy Dangan app - $(date '+%Y-%m-%d %H:%M:%S')"}

echo "🚀 Quick deploy to Git..."
echo "Commit message: $COMMIT_MSG"

git add .
git commit -m "$COMMIT_MSG"
git push origin main

echo "✅ Deployed to Git! CapRover will build from repository."
