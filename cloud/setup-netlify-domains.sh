#!/bin/bash

# Netlify Domain Setup Script for Doc Time
# This script helps set up custom domains for Doc Time services

echo "🚀 Setting up Netlify domains for Doc Time"
echo ""
echo "This script will help you set up:"
echo "  - doctime-app.thewolfgang.tech"
echo "  - doctime-admin.thewolfgang.tech"
echo ""
echo "Note: doctime-backend.thewolfgang.tech needs to be configured in Google Cloud Run"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if logged in
if ! netlify status &> /dev/null; then
    echo "🔐 Please login to Netlify..."
    netlify login
fi

echo ""
echo "📦 Setting up doctime-app..."
cd ../web-app

# Build the app
echo "Building web-app..."
npm run build

# Initialize Netlify site (interactive)
echo ""
echo "Initializing Netlify site for web-app..."
echo "When prompted:"
echo "  - Select: Create & configure a new project"
echo "  - Team: Beta Start"
echo "  - Site name: doctime-app"
echo "  - Build command: npm run build"
echo "  - Publish directory: build"
echo ""
netlify init

# Deploy
echo ""
echo "Deploying to production..."
netlify deploy --prod

# Add custom domain
echo ""
echo "Adding custom domain: doctime-app.thewolfgang.tech"
netlify domains:add doctime-app.thewolfgang.tech

echo ""
echo "✅ doctime-app setup complete!"
echo ""

# Setup admin
echo "📦 Setting up doctime-admin..."
cd ../admin-frontend

# Build the admin
echo "Building admin-frontend..."
npm run build

# Initialize Netlify site (interactive)
echo ""
echo "Initializing Netlify site for admin..."
echo "When prompted:"
echo "  - Select: Create & configure a new project"
echo "  - Team: Beta Start"
echo "  - Site name: doctime-admin"
echo "  - Build command: npm run build"
echo "  - Publish directory: build"
echo ""
netlify init

# Deploy
echo ""
echo "Deploying to production..."
netlify deploy --prod

# Add custom domain
echo ""
echo "Adding custom domain: doctime-admin.thewolfgang.tech"
netlify domains:add doctime-admin.thewolfgang.tech

echo ""
echo "✅ doctime-admin setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Netlify dashboard and verify the domains are added"
echo "2. Follow DNS instructions to add CNAME records for:"
echo "   - doctime-app.thewolfgang.tech"
echo "   - doctime-admin.thewolfgang.tech"
echo "3. For doctime-backend.thewolfgang.tech, configure in Google Cloud Run:"
echo "   - Go to Cloud Run > doctime-backend > Custom domains"
echo "   - Add mapping: doctime-backend.thewolfgang.tech"
echo ""

