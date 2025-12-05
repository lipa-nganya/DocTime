#!/bin/bash
# Direct migration script - executes SQL file on Cloud SQL
# This uses the Cloud SQL connection via gcloud

set -e

PROJECT_ID="drink-suite"
INSTANCE_NAME="doctime-db"
SQL_FILE="/tmp/complete-migration.sql"

echo "📋 Migrating data to Cloud SQL..."
echo "   Instance: $INSTANCE_NAME"
echo "   SQL File: $SQL_FILE"
echo ""

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: SQL file not found at $SQL_FILE"
  exit 1
fi

# Count statements
STATEMENT_COUNT=$(grep -c "INSERT INTO" "$SQL_FILE" || echo "0")
echo "   Found $STATEMENT_COUNT INSERT statements"
echo ""

# Execute via Cloud SQL using gcloud sql operations
echo "🚀 Executing migration..."
echo "   Note: This requires Cloud SQL Admin API to be enabled"
echo ""

# Use gcloud sql connect with a here-document
gcloud sql connect "$INSTANCE_NAME" \
  --project="$PROJECT_ID" \
  --user=postgres \
  --database=doctime <<EOF
$(cat "$SQL_FILE")
EOF

echo ""
echo "✅ Migration completed!"

