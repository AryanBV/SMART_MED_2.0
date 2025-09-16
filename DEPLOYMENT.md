# Deployment Guide for SMART_MED_2.0

## Overview
This project uses a full-stack Vercel deployment strategy:
- **Frontend**: Vercel (React app)
- **Backend**: Vercel Serverless Functions (Node.js API)
- **Database**: Supabase (Already configured)

## Full-Stack Deployment (Vercel)

### 1. Connect to Vercel
- Go to [vercel.com](https://vercel.com)
- Connect your GitHub repository
- Select "SMART_MED_2.0" repository
- Vercel will automatically detect the configuration from `vercel.json`

### 2. Set Environment Variables in Vercel Dashboard
```
NODE_ENV=production
JWT_SECRET=smartmed2_secret_key_2024_secure
REFRESH_TOKEN_SECRET=smartmed2_refresh_token_key_2024
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
SUPABASE_URL=https://xlcnkzfbqvzpouywzwkm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY25remZicXZ6cG91eXd6d2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODU2MDksImV4cCI6MjA3Mjk2MTYwOX0.A5ayj68fRKa88T04SnGYqVEDJLUn3c5YJIQyeViFTAA
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY25remZicXZ6cG91eXd6d2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4NTYwOSwiZXhwIjoyMDcyOTYxNjA5fQ.9r2ci4AM3SfC8ExVPnd6tze4NGF5ZchcG3z_L-4qnGQ
VITE_API_URL=/api
VITE_SUPABASE_URL=https://xlcnkzfbqvzpouywzwkm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY25remZicXZ6cG91eXd6d2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODU2MDksImV4cCI6MjA3Mjk2MTYwOX0.A5ayj68fRKa88T04SnGYqVEDJLUn3c5YJIQyeViFTAA
```

### 3. Deploy
- Click "Deploy" 
- Vercel will automatically build both frontend and backend
- Your app will be available at `https://your-app.vercel.app`

## Post-Deployment Steps

### 1. Update URLs
After deployment, update the following:

**In Railway Environment Variables:**
- Update `FRONTEND_URL` with your actual Vercel domain

**In Vercel Environment Variables:**
- Update `VITE_API_URL` with your actual Railway domain

### 2. Test the Deployment
- Test authentication flow
- Test document upload
- Test family tree functionality
- Verify API connectivity

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in Railway
2. **Build Failures**: Check that all dependencies are in `package.json`
3. **API Not Found**: Verify `VITE_API_URL` points to Railway domain

### Health Checks:
- Railway: `https://your-app.railway.app/`
- Vercel: `https://your-app.vercel.app/`
- API Test: `https://your-app.railway.app/api/test`

## Cost
Both services offer generous free tiers:
- **Railway**: 500 hours/month free
- **Vercel**: Unlimited static deployments
- **Supabase**: 2 databases, 500MB storage free

Total monthly cost: **$0**