#!/bin/bash

# Deploy Doc Time Web App to Cloud Storage + Cloud CDN
# This provides a cost-effective way to host the React web app

set -e

# Get project ID from gcloud config or environment variable
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-actual-project-id" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set"
  echo "Set it with: export GCP_PROJECT_ID=your-actual-project-id"
  exit 1
fi
BUCKET_NAME="${BUCKET_NAME:-doctime-web-app}"
REGION="${GCP_REGION:-us-central1}"

echo "🚀 Deploying Doc Time Web App..."

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use the correct backend URL
BACKEND_URL="${BACKEND_URL:-https://doctime-backend-910510650031.us-central1.run.app}"
# Remove /api suffix if present (api.js will add it)
BACKEND_URL="${BACKEND_URL%/api}"
BACKEND_URL="${BACKEND_URL%/}"
API_URL="${API_URL:-${BACKEND_URL}}"

# Build the web app
echo "📦 Building web app with API URL: $API_URL..."
cd "$PROJECT_ROOT/web-app"

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
cd "$PROJECT_ROOT/web-app"
gcloud storage cp -r build/* gs://$BUCKET_NAME/ --project=$PROJECT_ID
cd "$PROJECT_ROOT"

# Enable uniform bucket-level access (required for IAM policies to work)
echo "🔧 Enabling uniform bucket-level access..."
gcloud storage buckets update gs://$BUCKET_NAME --uniform-bucket-level-access --project=$PROJECT_ID 2>&1 | grep -v "already enabled" || echo "Uniform bucket-level access enabled"

# Set public access for objects
echo "🔓 Setting public access..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member=allUsers --role=roles/storage.objectViewer --project=$PROJECT_ID 2>&1 | grep -v "already exists" || echo "Public access configured"

# Also grant legacy bucket reader for compatibility
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member=allUsers --role=roles/storage.legacyBucketReader --project=$PROJECT_ID 2>&1 | grep -v "already exists" || echo "Legacy bucket reader configured"

# Make all uploaded files publicly readable
echo "🔓 Making uploaded files publicly readable..."
gcloud storage objects update gs://$BUCKET_NAME/** --add-acl-grant=entity=allUsers,role=READER --project=$PROJECT_ID 2>&1 | head -5 || echo "Files are publicly readable"

# Get bucket URLs
BUCKET_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"
WEBSITE_URL="http://$BUCKET_NAME.storage.googleapis.com"

echo ""
echo "✅ Web app deployed successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Direct file access: $BUCKET_URL"
echo "   Website endpoint:  $WEBSITE_URL"
echo ""
echo "⚠️  Note: Use the direct file access URL for HTTPS access."
echo "   The website endpoint (HTTP only) may show XML errors when accessing the root."
echo ""
echo "💡 For production, consider:"
echo "   - Setting up Cloud Load Balancer with a custom domain"
echo "   - Using Cloud CDN for better performance"
echo "   - Configuring a custom domain with SSL certificate"

