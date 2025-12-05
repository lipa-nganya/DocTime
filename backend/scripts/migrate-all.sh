#!/bin/bash

# Helper script to migrate all data (team members, facilities, payers) from local to cloud
# This script prompts for the Cloud SQL password and runs all migrations

set -e

echo "🚀 Doc Time - Complete Data Migration"
echo "====================================="
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

# Get password from environment variable or prompt
if [ -z "$CLOUD_SQL_PASSWORD" ]; then
  read -sp "Enter Cloud SQL password for $CLOUD_DB_USER: " CLOUD_DB_PASSWORD
  echo ""
  
  if [ -z "$CLOUD_DB_PASSWORD" ]; then
    echo "❌ Error: Password is required"
    echo "Set it with: export CLOUD_SQL_PASSWORD='your_password'"
    exit 1
  fi
else
  CLOUD_DB_PASSWORD="$CLOUD_SQL_PASSWORD"
  echo "✅ Using password from CLOUD_SQL_PASSWORD environment variable"
fi

# Construct cloud database URL
CLOUD_DB_URL="postgresql://${CLOUD_DB_USER}:${CLOUD_DB_PASSWORD}@${CLOUD_DB_HOST}:${CLOUD_DB_PORT}/${CLOUD_DB_NAME}?sslmode=require"

echo ""
echo "🔄 Starting migrations..."
echo ""

# Export environment variables
export LOCAL_DATABASE_URL="$LOCAL_DB_URL"
export CLOUD_DATABASE_URL="$CLOUD_DB_URL"

# Run migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Migrating Facilities..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node migrate-facilities.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Migrating Payers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node migrate-payers.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Migrating Team Members..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node migrate-team-members.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All migrations completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

