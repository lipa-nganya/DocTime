#!/bin/bash

# Start Doc Time services on Google Cloud
# This script is designed to be called by the start/stop control instances
# that manage multiple services (including dial a drink)

set -e

# Get project ID from gcloud config or environment variable
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set"
  exit 1
fi
REGION="${GCP_REGION:-us-central1}"

echo "🚀 Starting Doc Time services..."

# Start Cloud Run services
echo "Starting backend service..."
gcloud run services update doctime-backend \
  --project=$PROJECT_ID \
  --region=$REGION \
  --min-instances=1 \
  --quiet || echo "Backend service may not exist yet"

# Start Cloud SQL instance (if stopped)
echo "Starting Cloud SQL instance..."
gcloud sql instances patch doctime-db \
  --project=$PROJECT_ID \
  --activation-policy=ALWAYS \
  --quiet || echo "Cloud SQL instance may already be running"

echo "✅ Doc Time services started successfully!"

