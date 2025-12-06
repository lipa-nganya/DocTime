# Netlify Domain Setup for Doc Time

## ✅ Completed Steps

1. **Netlify CLI installed and logged in**
2. **Sites created:**
   - doctime-app: `b567d042-282e-4f71-af17-714f83899aa2`
     - URL: https://animated-stardust-7b8ad9.netlify.app
     - Deployed to production ✅
   - doctime-admin: `66e90371-1c05-413d-a1a3-015567c00367`
     - URL: https://willowy-arithmetic-38f58c.netlify.app
     - Deployed to production ✅

3. **netlify.toml files created** for both projects with proper build configuration

## 📋 Remaining Steps

### 1. Add Custom Domains via Netlify Dashboard

**For doctime-app.thewolfgang.tech:**
1. Go to https://app.netlify.com/projects/animated-stardust-7b8ad9
2. Navigate to: **Site settings** > **Domain management**
3. Click **Add custom domain**
4. Enter: `doctime-app.thewolfgang.tech`
5. Follow the DNS instructions to add a CNAME record

**For doctime-admin.thewolfgang.tech:**
1. Go to https://app.netlify.com/projects/willowy-arithmetic-38f58c
2. Navigate to: **Site settings** > **Domain management**
3. Click **Add custom domain**
4. Enter: `doctime-admin.thewolfgang.tech`
5. Follow the DNS instructions to add a CNAME record

### 2. Optional: Rename Sites

You can rename the sites in the Netlify dashboard:
- **Site settings** > **General** > **Site name**
- Change to: `doctime-app` and `doctime-admin`

### 3. Configure Backend Domain (doctime-backend.thewolfgang.tech)

The backend runs on Google Cloud Run, not Netlify. To set up the custom domain:

**Option A: Google Cloud Run Custom Domain**
1. Go to [Google Cloud Console](https://console.cloud.google.com/run)
2. Select the `doctime-backend` service
3. Click **Manage custom domains**
4. Click **Add mapping**
5. Enter: `doctime-backend.thewolfgang.tech`
6. Follow instructions to add DNS records (usually a CNAME)

**Option B: Netlify Proxy (Alternative)**
If you prefer to manage all domains through Netlify:
1. Create a new Netlify site for the backend
2. Create a `netlify.toml` with proxy configuration:
```toml
[[redirects]]
  from = "/*"
  to = "https://doctime-backend-910510650031.us-central1.run.app/:splat"
  status = 200
  force = true
```
3. Deploy and add the custom domain

## 🔄 Continuous Deployment

Both sites are linked to the local directories. To enable automatic deployments:

1. Go to each site's **Site settings** > **Build & deploy**
2. Connect to GitHub repository: `lipa-nganya/DocTime`
3. Set:
   - **Base directory**: `web-app` or `admin-frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

## 📝 Environment Variables

If needed, add environment variables in Netlify:
- **Site settings** > **Environment variables**
- For web-app: `REACT_APP_API_URL=https://doctime-backend.thewolfgang.tech/api`
- For admin: `REACT_APP_API_URL=https://doctime-backend.thewolfgang.tech/api`

## 🔗 Site URLs

- **doctime-app**: https://animated-stardust-7b8ad9.netlify.app
- **doctime-admin**: https://willowy-arithmetic-38f58c.netlify.app
- **doctime-backend**: https://doctime-backend-910510650031.us-central1.run.app

After DNS propagation (usually 24-48 hours), the custom domains will be active:
- https://doctime-app.thewolfgang.tech
- https://doctime-admin.thewolfgang.tech
- https://doctime-backend.thewolfgang.tech

