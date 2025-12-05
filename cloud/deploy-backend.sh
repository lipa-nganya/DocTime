#!/bin/bash

# Deploy Doc Time Backend to Cloud Run
# This script builds and deploys the backend with cost-saving configurations

set -e

# Get project ID from gcloud config or environment variable
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set"
  echo "Set it with: export GCP_PROJECT_ID=your-actual-project-id"
  exit 1
fi
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="doctime-backend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying Doc Time Backend to Cloud Run..."

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Build Docker image for linux/amd64 (Cloud Run requirement)
echo "📦 Building Docker image for linux/amd64..."
cd "$PROJECT_ROOT"
IMAGE_TAG="v$(date +%s)"
docker build --platform linux/amd64 -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest -f cloud/Dockerfile .

# Push to Container Registry
echo "📤 Pushing image to Container Registry..."
docker push $IMAGE_NAME:$IMAGE_TAG
docker push $IMAGE_NAME:latest

# Get database connection details
# Use Unix socket connection via Cloud SQL Proxy (recommended for Cloud Run)
CONNECTION_NAME=$(gcloud sql instances describe doctime-db --project=$PROJECT_ID --format="value(connectionName)" 2>&1)

# Hardcoded database password
DB_PASSWORD="DoctimeCloud2024Secure"

# Use Unix socket connection (Cloud SQL Proxy)
# Format: postgresql://user:password@/database?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
# This format works with Sequelize when properly parsed
DATABASE_URL="postgresql://doctime_user:${DB_PASSWORD}@/doctime?host=/cloudsql/${CONNECTION_NAME}"
JWT_SECRET="RNfWzy5JvlwIHgKg2KtZMbYmtwG4iHY6GMa5J6AcCDA="

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:$IMAGE_TAG \
  --project=$PROJECT_ID \
  --region=$REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --port=8080 \
  --update-env-vars "DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,NODE_ENV=production" \
  --add-cloudsql-instances $PROJECT_ID:$REGION:doctime-db \
  --quiet

# Get service URL - use the correct format with project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null)
SERVICE_URL="https://doctime-backend-${PROJECT_NUMBER}.${REGION}.run.app"

echo ""
echo "✅ Backend deployed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Update your frontend API URL to: $SERVICE_URL/api"

