#!/bin/bash

# Script to run migrations via API (requires backend to be running locally)
# This works because the backend can access both local and cloud databases

set -e

API_URL="${API_URL:-http://localhost:5001/api}"
AUTH_TOKEN="${AUTH_TOKEN}"

echo "🚀 Running migrations via API..."
echo "📋 API URL: $API_URL"
echo ""

if [ -z "$AUTH_TOKEN" ]; then
  echo "⚠️  AUTH_TOKEN not set. You need to authenticate first."
  echo ""
  echo "To get a token:"
  echo "1. Log in to the admin panel or web app"
  echo "2. Get the auth token from localStorage or browser dev tools"
  echo "3. Set it: export AUTH_TOKEN='your_token_here'"
  echo ""
  echo "Or run the backend locally and use a test token"
  exit 1
fi

echo "🔄 Migrating facilities..."
curl -X POST "${API_URL}/migration/facilities" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "Failed to migrate facilities"

echo ""
echo "🔄 Migrating payers..."
curl -X POST "${API_URL}/migration/payers" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "Failed to migrate payers"

echo ""
echo "🔄 Migrating team members..."
curl -X POST "${API_URL}/migration/team-members" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "Failed to migrate team members"

echo ""
echo "✅ Migration complete!"

