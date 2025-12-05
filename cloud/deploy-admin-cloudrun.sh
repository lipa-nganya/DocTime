#!/bin/bash

# Deploy Doc Time Admin to Cloud Run
# This provides better control and consistency with the backend

set -e

# Get project ID from gcloud config or environment variable
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-actual-project-id" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set"
  echo "Set it with: export GCP_PROJECT_ID=your-actual-project-id"
  exit 1
fi

SERVICE_NAME="${SERVICE_NAME:-doctime-admin}"
REGION="${GCP_REGION:-us-central1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying Doc Time Admin to Cloud Run..."

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use the correct backend URL
BACKEND_URL="${BACKEND_URL:-https://doctime-backend-910510650031.us-central1.run.app}"
# Remove /api suffix if present, then add it back (environment service expects /api)
BACKEND_URL="${BACKEND_URL%/api}"
BACKEND_URL="${BACKEND_URL%/}"
# Add /api since environment service expects URLs with /api
API_URL="${API_URL:-${BACKEND_URL}/api}"

echo "📦 Building Docker image with API URL: $API_URL..."

# Build Docker image for linux/amd64 (Cloud Run requirement)
cd "$PROJECT_ROOT"
docker build --platform linux/amd64 \
  --build-arg REACT_APP_API_URL="$API_URL" \
  -t $IMAGE_NAME:latest \
  -f cloud/Dockerfile.admin .

# Push to Container Registry
echo "📤 Pushing image to Container Registry..."
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:latest \
  --project=$PROJECT_ID \
  --region=$REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --port=8080 \
  --set-env-vars NODE_ENV=production \
  --quiet

# Get service URL - use the correct format with project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null)
SERVICE_URL="https://doctime-admin-${PROJECT_NUMBER}.${REGION}.run.app"

echo ""
echo "✅ Admin panel deployed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "💡 The admin panel is now running on Cloud Run with automatic scaling"

