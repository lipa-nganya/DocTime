#!/bin/bash

# Helper script to migrate team members from local to cloud
# This script prompts for the Cloud SQL password and runs the migration

set -e

echo "🚀 Doc Time - Team Members Migration"
echo "===================================="
echo ""

# Get local database URL (from .env or default)
if [ -f "../.env" ]; then
  source ../.env
fi

LOCAL_DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-postgresql://postgres:password@localhost:5432/doctime}}"

echo "📋 Local Database: $LOCAL_DB_URL"
echo ""

# Cloud SQL details
CLOUD_DB_USER="doctime_user"
CLOUD_DB_HOST="34.27.171.24"
CLOUD_DB_NAME="doctime"
CLOUD_DB_PORT="5432"

echo "📋 Cloud Database: $CLOUD_DB_USER@$CLOUD_DB_HOST:$CLOUD_DB_PORT/$CLOUD_DB_NAME"
echo ""

# Prompt for password
read -sp "Enter Cloud SQL password for $CLOUD_DB_USER: " CLOUD_DB_PASSWORD
echo ""

if [ -z "$CLOUD_DB_PASSWORD" ]; then
  echo "❌ Error: Password is required"
  exit 1
fi

# Construct cloud database URL
CLOUD_DB_URL="postgresql://${CLOUD_DB_USER}:${CLOUD_DB_PASSWORD}@${CLOUD_DB_HOST}:${CLOUD_DB_PORT}/${CLOUD_DB_NAME}?sslmode=require"

echo ""
echo "🔄 Starting migration..."
echo ""

# Run the migration script
LOCAL_DATABASE_URL="$LOCAL_DB_URL" \
CLOUD_DATABASE_URL="$CLOUD_DB_URL" \
node migrate-team-members.js

echo ""
echo "✅ Migration complete!"

