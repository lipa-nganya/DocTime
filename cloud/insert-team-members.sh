#!/bin/bash
set -e

# Hardcoded Database Credentials
DB_USER="doctime_user"
DB_PASSWORD="DoctimeCloud2024Secure"
DATABASE_NAME="doctime"
INSTANCE_NAME="doctime-db"
PROJECT_ID="drink-suite"
REGION="us-central1"

echo "🚀 Inserting team members into Cloud SQL database..."
echo "------------------------------------------------"

# Get Cloud SQL instance IP address
echo "🔍 Fetching Cloud SQL instance IP for $INSTANCE_NAME..."
DB_HOST=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")

if [ -z "$DB_HOST" ]; then
  echo "❌ Error: Could not retrieve Cloud SQL instance IP. Ensure the instance is running and has a public IP."
  exit 1
fi

echo "✅ Cloud SQL instance IP: $DB_HOST"
echo ""

# Construct the connection string
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DATABASE_NAME}?sslmode=require"

echo "📝 Inserting team members..."
psql "$CONNECTION_STRING" -f "$(dirname "$0")/insert-team-members.sql"

echo "------------------------------------------------"
echo "✅ Team members inserted successfully!"
echo ""

