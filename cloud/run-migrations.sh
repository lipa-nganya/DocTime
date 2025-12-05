#!/bin/bash
# Script to create tables and seed data in Cloud SQL database
# Uses hardcoded database credentials

set -e

# Database credentials (hardcoded)
DB_USER="doctime_user"
DB_PASSWORD="DoctimeCloud2024Secure"
DB_NAME="doctime"
PROJECT_ID="drink-suite"
REGION="us-central1"
INSTANCE_NAME="doctime-db"

# Get Cloud SQL instance IP
echo "🔍 Getting Cloud SQL instance IP..."
DB_HOST=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)" 2>/dev/null)

if [ -z "$DB_HOST" ]; then
    echo "❌ Error: Could not get Cloud SQL instance IP"
    echo "   Make sure the instance exists and you have permissions"
    exit 1
fi

echo "✅ Found Cloud SQL instance at: $DB_HOST"
echo ""

# Connection string
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📋 Step 1: Creating tables..."
echo "   Running: create-tables.sql"
psql "$CONNECTION_STRING" -f "$SCRIPT_DIR/create-tables.sql"

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully!"
    echo ""
else
    echo "❌ Error creating tables"
    exit 1
fi

echo "📋 Step 2: Seeding initial data..."
echo "   Running: seed-database.sql"
psql "$CONNECTION_STRING" -f "$SCRIPT_DIR/seed-database.sql"

if [ $? -eq 0 ]; then
    echo "✅ Data seeded successfully!"
    echo ""
else
    echo "❌ Error seeding data"
    exit 1
fi

echo "🎉 Database setup complete!"
echo ""
echo "📊 Summary:"
echo "   ✅ All tables created"
echo "   ✅ Initial data inserted"
echo ""
echo "💡 You can now connect to the database using:"
echo "   psql \"$CONNECTION_STRING\""

