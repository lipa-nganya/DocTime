#!/bin/bash
# Script to execute migration SQL on Cloud SQL
# This uses gcloud sql execute-sql command

set -e

PROJECT_ID="drink-suite"
INSTANCE_NAME="doctime-db"
SQL_FILE="/tmp/complete-migration.sql"

echo "📋 Executing migration SQL on Cloud SQL..."
echo "   Project: $PROJECT_ID"
echo "   Instance: $INSTANCE_NAME"
echo "   SQL File: $SQL_FILE"
echo ""

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: SQL file not found at $SQL_FILE"
  exit 1
fi

echo "🚀 Executing SQL statements..."
gcloud sql execute-sql "$INSTANCE_NAME" \
  --project="$PROJECT_ID" \
  --database=doctime \
  --file="$SQL_FILE" \
  --quiet

echo ""
echo "✅ Migration SQL executed successfully!"

