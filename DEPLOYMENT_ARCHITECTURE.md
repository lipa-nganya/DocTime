# Doc Time Deployment Architecture

## Current Setup

### Backend
- **Single Backend (Production)**: Cloud Run
  - URL: `https://doctime-backend-910510650031.us-central1.run.app`
  - **Serves ALL environments** (local, Cloud Run frontends, Netlify frontends)
  - Database: Cloud SQL (PostgreSQL)

### Frontends

#### 1. **Local Development**
- **Web App**: `http://localhost:3000` (or similar)
- **Admin**: `http://localhost:3001` (or similar)
- **Backend**: Points to Cloud Run backend (or local backend if running)

#### 2. **Cloud Run (Staging/Dev)**
- **Web App**: `https://doctime-web-app-910510650031.us-central1.run.app`
- **Admin**: `https://doctime-admin-910510650031.us-central1.run.app`
- **Backend**: Same Cloud Run backend (shared)

#### 3. **Netlify (Production)**
- **Web App**: `https://doctime-app.thewolfgang.tech`
- **Admin**: `https://doctime-admin.thewolfgang.tech`
- **Backend**: Same Cloud Run backend (shared)

## Key Points

✅ **Backend is shared** - All frontends (local, Cloud Run, Netlify) use the same backend
✅ **Frontends are separate** - Each environment has its own frontend deployment
✅ **Netlify = Production** - Custom domains for end users
✅ **Cloud Run = Staging/Dev** - For testing before production

## Environment Variables

### Frontend API URLs
- **Local**: Uses `REACT_APP_API_URL` or environment service (can switch between local/cloud)
- **Cloud Run**: Built with `REACT_APP_API_URL=https://doctime-backend-910510650031.us-central1.run.app/api`
- **Netlify**: Should be built with `REACT_APP_API_URL=https://doctime-backend-910510650031.us-central1.run.app/api`

## Deployment Workflow

1. **Local Development** → Test changes locally
2. **Deploy to Cloud Run** → Test in staging environment
3. **Deploy to Netlify** → Push to production

All three environments use the **same backend** on Cloud Run.
