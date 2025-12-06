# Netlify Setup Instructions

## For doctime-app.thewolfgang.tech and doctime-admin.thewolfgang.tech

Since Netlify CLI requires interactive prompts, please follow these steps:

### Option 1: Via Netlify Web UI (Recommended)

1. Go to https://app.netlify.com
2. Click "Add new site" > "Import an existing project"
3. For each site (doctime-app and doctime-admin):
   - Connect to GitHub repository: lipa-nganya/DocTime
   - Base directory: `web-app` or `admin-frontend`
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Deploy site"

4. After deployment, go to Site settings > Domain management
5. Add custom domain:
   - For web-app: `doctime-app.thewolfgang.tech`
   - For admin: `doctime-admin.thewolfgang.tech`
6. Follow DNS instructions to add CNAME records

### Option 2: Via Netlify CLI (Interactive)

Run these commands and follow the prompts:

```bash
# For web-app
cd web-app
netlify init
# Select: Create & configure a new project
# Team: Beta Start
# Site name: doctime-app
# Build command: npm run build
# Publish directory: build

# Deploy
netlify deploy --prod

# Add custom domain
netlify domains:add doctime-app.thewolfgang.tech

# For admin
cd ../admin-frontend
netlify init
# Select: Create & configure a new project
# Team: Beta Start
# Site name: doctime-admin
# Build command: npm run build
# Publish directory: build

# Deploy
netlify deploy --prod

# Add custom domain
netlify domains:add doctime-admin.thewolfgang.tech
```

## For doctime-backend.thewolfgang.tech

The backend runs on Google Cloud Run, not Netlify. To set up the custom domain:

1. Go to Google Cloud Console > Cloud Run
2. Select the `doctime-backend` service
3. Go to "Custom domains" tab
4. Click "Add mapping"
5. Enter: `doctime-backend.thewolfgang.tech`
6. Follow instructions to add DNS records (usually a CNAME pointing to Cloud Run)

Alternatively, you can use Netlify's proxy feature:
- Create a new Netlify site for the backend
- Use `netlify.toml` with a proxy redirect to the Cloud Run URL
