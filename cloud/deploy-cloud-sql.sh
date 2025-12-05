#!/bin/bash

# Deploy Cloud SQL instance for Doc Time
# This script creates a Cloud SQL PostgreSQL instance with cost-saving configurations

set -e

# Get project ID from gcloud config or environment variable
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set"
  echo "Set it with: export GCP_PROJECT_ID=your-actual-project-id"
  echo "Or set default project: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

INSTANCE_NAME="doctime-db"
DATABASE_NAME="doctime"
REGION="${GCP_REGION:-us-central1}"
TIER="db-f1-micro"  # Cost-effective tier (can be upgraded later)

echo "🚀 Deploying Cloud SQL instance for Doc Time..."

# Create Cloud SQL instance
gcloud sql instances create $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --database-version=POSTGRES_15 \
  --tier=$TIER \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 || echo "Instance may already exist"

# Create database
echo "📊 Creating database..."
gcloud sql databases create $DATABASE_NAME \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID || echo "Database may already exist"

# Create database user
DB_USER="${DB_USER:-doctime_user}"
# Hardcoded database password
DB_PASSWORD="${DB_PASSWORD:-DoctimeCloud2024Secure}"

echo "👤 Creating database user..."
gcloud sql users create $DB_USER \
  --instance=$INSTANCE_NAME \
  --password=$DB_PASSWORD \
  --project=$PROJECT_ID || echo "User may already exist"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --format="value(connectionName)")

echo ""
echo "✅ Cloud SQL instance deployed successfully!"
echo ""
echo "📋 Connection Details:"
echo "   Instance: $INSTANCE_NAME"
echo "   Database: $DATABASE_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo "   Connection Name: $CONNECTION_NAME"
echo ""
echo "🔗 Connection String (for Cloud Run/App Engine):"
echo "   postgresql://$DB_USER:$DB_PASSWORD@/$DATABASE_NAME?host=/cloudsql/$CONNECTION_NAME"
echo ""
echo "⚠️  Save the password securely! Add to your .env file:"
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/$DATABASE_NAME?host=/cloudsql/$CONNECTION_NAME"
echo ""

