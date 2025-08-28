#!/bin/bash

# FieldWire Deployment Script
# Simple deployment without Nginx

set -e  # Exit on any error

echo "🚀 Starting FieldWire deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from git..."
git pull origin main

# Install dependencies
print_status "Installing dependencies..."
npm install

# Run type checking
print_status "Running type check..."
npm run type-check

# Run linting
print_status "Running linting..."
npm run lint

# Build application
print_status "Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed! dist directory not found."
    exit 1
fi

# Restart PM2 process if it exists
if pm2 list | grep -q "fieldwire"; then
    print_status "Restarting PM2 process..."
    pm2 restart fieldwire
else
    print_status "Starting PM2 process for the first time..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
fi

print_status "✅ Deployment completed successfully!"

# Show PM2 status
if pm2 list | grep -q "fieldwire"; then
    echo ""
    print_status "PM2 Status:"
    pm2 show fieldwire
fi

echo ""
print_status "Application is running on port 3000"
print_status "Deployment finished at $(date)"
