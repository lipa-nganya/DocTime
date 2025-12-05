#!/bin/bash

# Deploy Doc Time Admin Frontend to Cloud Storage
# This provides a cost-effective way to host the admin panel

set -e

# Get project ID from gcloud config or environment variable
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-actual-project-id" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set"
  echo "Set it with: export GCP_PROJECT_ID=your-actual-project-id"
  exit 1
fi
BUCKET_NAME="${BUCKET_NAME:-doctime-admin}"
REGION="${GCP_REGION:-us-central1}"

# Use the correct backend URL
if [ -z "$API_URL" ]; then
  BACKEND_URL="${BACKEND_URL:-https://doctime-backend-910510650031.us-central1.run.app}"
  API_URL="${BACKEND_URL}/api"
fi

echo "🚀 Deploying Doc Time Admin Frontend..."

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Build the admin app with production API URL
echo "📦 Building admin app..."
cd "$PROJECT_ROOT/admin-frontend"

# Create .env.production
cat > .env.production << EOF
REACT_APP_API_URL=$API_URL
EOF

npm install
npm run build
cd ..

# Create bucket if it doesn't exist
echo "🪣 Creating storage bucket..."
gcloud storage buckets create gs://$BUCKET_NAME --project=$PROJECT_ID --location=$REGION 2>&1 | grep -v "already exists" || echo "Bucket exists or created"

# Enable static website hosting
echo "🌐 Configuring static website hosting..."
gcloud storage buckets update gs://$BUCKET_NAME --web-main-page-suffix=index.html --web-error-page=index.html --project=$PROJECT_ID

# Upload files
echo "📤 Uploading files..."
cd "$PROJECT_ROOT/admin-frontend"
gcloud storage cp -r build/* gs://$BUCKET_NAME/ --project=$PROJECT_ID

# Set public access (or restrict to admin IPs)
echo "🔓 Setting public access..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member=allUsers --role=roles/storage.objectViewer --project=$PROJECT_ID

# Get bucket URL
BUCKET_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"

echo ""
echo "✅ Admin frontend deployed successfully!"
echo "🌐 Admin URL: $BUCKET_URL"
echo ""
echo "⚠️  Consider restricting access to admin IPs for security"

