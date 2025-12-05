#!/bin/bash

# Stop Doc Time services on Google Cloud
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

echo "🛑 Stopping Doc Time services..."

# Scale Cloud Run services to zero
echo "Scaling backend service to zero..."
gcloud run services update doctime-backend \
  --project=$PROJECT_ID \
  --region=$REGION \
  --min-instances=0 \
  --quiet || echo "Backend service may not exist"

# Stop Cloud SQL instance (optional - only if you want to save on database costs)
# WARNING: This will disconnect all clients. Use with caution.
# Uncomment the following lines if you want to stop the database:
# echo "Stopping Cloud SQL instance..."
# gcloud sql instances patch doctime-db \
#   --project=$PROJECT_ID \
#   --activation-policy=NEVER \
#   --quiet || echo "Cloud SQL instance may already be stopped"

echo "✅ Doc Time services stopped successfully!"
echo "⚠️  Note: Cloud SQL instance is still running (stopping it would disconnect all clients)"

