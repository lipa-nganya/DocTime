# Quick Start: Deploy Doc Time to Google Cloud

## Prerequisites

```bash
# Install Google Cloud SDK (if not already installed)
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
export GCP_PROJECT_ID="your-project-id"  # Same project as dial a drink
export GCP_REGION="us-central1"
```

## Step 1: Deploy Cloud SQL (One-time setup)

```bash
cd cloud
./deploy-cloud-sql.sh
```

**Save the output!** You'll need:
- Database connection string
- Database password

## Step 2: Update Environment Variables

1. Copy `env.production.template` to `env.production`
2. Update with actual values from Step 1
3. Add your JWT secret, SMS, and email credentials

## Step 3: Deploy Backend

```bash
./deploy-backend.sh
```

This will output the backend URL. Save it!

## Step 4: Deploy Web App

```bash
./deploy-web-app.sh
```

## Step 5: Deploy Admin Frontend

```bash
export API_URL="https://doctime-backend-xxxxx.run.app/api"  # From Step 3
./deploy-admin.sh
```

## Step 6: Integrate with Start/Stop Instances

### Option A: Automatic (if you have access to control instance scripts)

```bash
export CONTROL_START_SCRIPT="/path/to/start-all-services.sh"
export CONTROL_STOP_SCRIPT="/path/to/stop-all-services.sh"
./integrate-start-stop.sh
```

### Option B: Manual

Add to your existing start script:
```bash
# Start Doc Time
/path/to/doc-time/cloud/start-services.sh
```

Add to your existing stop script:
```bash
# Stop Doc Time
/path/to/doc-time/cloud/stop-services.sh
```

## Verify Deployment

```bash
# Check backend
gcloud run services list --filter="doctime-backend"

# Check Cloud SQL
gcloud sql instances list --filter="doctime-db"

# Check web app bucket
gsutil ls gs://doctime-web-app
```

## Update Frontend API URLs

After deployment, update:
- `web-app/src/services/api.js` - Set `REACT_APP_API_URL` to backend URL
- `admin-frontend/.env` - Set `REACT_APP_API_URL` to backend URL

Then redeploy frontends.

