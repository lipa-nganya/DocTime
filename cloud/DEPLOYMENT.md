# Doc Time Cloud Deployment Guide

This guide covers deploying Doc Time services to Google Cloud Platform with cost-saving mechanisms.

## Prerequisites

1. Google Cloud SDK installed and configured
2. Docker installed (for building images)
3. Access to the GCP project where "dial a drink" is deployed
4. Cloud SQL API enabled
5. Cloud Run API enabled
6. Cloud Storage API enabled

## Quick Start

### 1. Set Environment Variables

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export DB_USER="doctime_user"
export DB_PASSWORD="your-secure-password"
```

### 2. Deploy Cloud SQL

```bash
cd cloud
./deploy-cloud-sql.sh
```

This will:
- Create a Cloud SQL PostgreSQL instance
- Create the database
- Create a database user
- Output connection details

**Save the connection details!** You'll need them for the next steps.

### 3. Update Environment Variables

Update `cloud/.env.production.example` with:
- Cloud SQL connection string
- JWT secret
- SMS/Email credentials
- Other required variables

Then set them in Cloud Run:

```bash
gcloud run services update doctime-backend \
  --update-env-vars-file=cloud/.env.production \
  --region=$GCP_REGION
```

### 4. Deploy Backend

```bash
./deploy-backend.sh
```

This will:
- Build Docker image
- Push to Container Registry
- Deploy to Cloud Run with cost-saving settings:
  - Min instances: 0 (scale to zero)
  - Max instances: 2
  - Memory: 512Mi
  - CPU: 1

### 5. Deploy Web App

```bash
./deploy-web-app.sh
```

This will:
- Build React app
- Upload to Cloud Storage
- Enable static website hosting

### 6. Deploy Admin Frontend

```bash
# First, get your backend URL
BACKEND_URL=$(gcloud run services describe doctime-backend \
  --format="value(status.url)")

export API_URL="$BACKEND_URL/api"
./deploy-admin.sh
```

## Integration with Start/Stop Control Instances

### Option 1: Automatic Integration

```bash
export CONTROL_START_SCRIPT="/path/to/your/start-all-services.sh"
export CONTROL_STOP_SCRIPT="/path/to/your/stop-all-services.sh"
./integrate-start-stop.sh
```

### Option 2: Manual Integration

Add to your existing start script:
```bash
# Start Doc Time services
/path/to/doc-time/cloud/start-services.sh
```

Add to your existing stop script:
```bash
# Stop Doc Time services
/path/to/doc-time/cloud/stop-services.sh
```

## Cost-Saving Features Enabled

1. **Cloud Run**: Scales to zero when not in use
2. **Cloud SQL**: Uses db-f1-micro tier (can be upgraded)
3. **Response Compression**: ~70% bandwidth reduction
4. **Connection Pooling**: Optimized for 3 max connections
5. **Production Logging**: Only errors logged (saves on Cloud Logging)
6. **Temp File Cleanup**: Automatic cleanup every hour
7. **Response Caching**: 5-minute cache for static data
8. **Rate Limiting**: 100 requests per 15 minutes per IP

## Environment Variables

### Required for Backend

```bash
DATABASE_URL=postgresql://user:pass@/doctime?host=/cloudsql/PROJECT:REGION:INSTANCE
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=8080
```

### Optional (with defaults)

```bash
DB_POOL_MAX=3
DB_POOL_MIN=1
RATE_LIMIT_MAX=100
ENABLE_SMS=true
```

## Monitoring

### View Logs

```bash
gcloud run services logs read doctime-backend --region=$GCP_REGION
```

### Check Service Status

```bash
gcloud run services describe doctime-backend --region=$GCP_REGION
```

### Monitor Costs

1. Go to GCP Console > Billing
2. Filter by project
3. View Cloud Run, Cloud SQL, and Cloud Storage costs

## Troubleshooting

### Backend won't start

1. Check Cloud SQL connection:
   ```bash
   gcloud sql instances describe doctime-db
   ```

2. Check environment variables:
   ```bash
   gcloud run services describe doctime-backend --format="value(spec.template.spec.containers[0].env)"
   ```

3. Check logs:
   ```bash
   gcloud run services logs read doctime-backend --limit=50
   ```

### Database connection errors

1. Ensure Cloud SQL instance is running
2. Verify connection name format: `PROJECT:REGION:INSTANCE`
3. Check that Cloud Run has Cloud SQL connection permission

## Cost Optimization Tips

1. **Use Cloud Scheduler** to start/stop services during off-hours
2. **Monitor usage** and adjust min/max instances based on traffic
3. **Use Cloud CDN** for web app to reduce Cloud Storage egress costs
4. **Set up billing alerts** to monitor costs
5. **Review logs retention** - reduce retention period if not needed

## Estimated Monthly Costs (Low Traffic)

- Cloud SQL (db-f1-micro): ~$7-10/month
- Cloud Run (scale to zero): ~$0-5/month (pay per use)
- Cloud Storage: ~$0.02/GB/month
- **Total**: ~$10-20/month for low traffic

## Next Steps

1. Set up custom domain for web app
2. Configure Cloud CDN for better performance
3. Set up monitoring and alerts
4. Configure backup schedules for Cloud SQL
5. Set up CI/CD pipeline for automated deployments

