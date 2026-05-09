# Production Deployment Guide

## Overview

Deploy Employ.me to production using:
- **Backend**: Heroku (Node.js/Express)
- **Frontend**: Vercel (Next.js)
- **Database**: Neon (PostgreSQL)
- **Images**: Cloudinary (CDN-backed storage)
- **Email**: Resend API + Render SMTP

## Prerequisites

1. Heroku account & CLI installed
2. Vercel account & CLI installed
3. Neon database created
4. Cloudinary account with API credentials
5. Resend API key: `re_45yq92f5_CChZs8Hhr9Jf6rvFuQiLtQbq`
6. Resend email: `noreply@clink.citsaucc.org`

## Backend Deployment (Heroku)

### Step 1: Create Heroku App

```bash
cd server
heroku login
heroku create employme-api  # Replace with unique name
```

### Step 2: Set Environment Variables

```bash
# Get your Neon connection string from https://console.neon.tech
# Format: postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Get Cloudinary credentials from https://cloudinary.com/console

# Set all variables at once:
heroku config:set -a employme-api \
  DATABASE_URL="postgresql://user:password@host/db?sslmode=require" \
  NODE_ENV="production" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  SESSION_SECRET="$(openssl rand -base64 32)" \
  CLOUDINARY_CLOUD_NAME="your-cloud-name" \
  CLOUDINARY_API_KEY="your-api-key" \
  CLOUDINARY_API_SECRET="your-api-secret" \
  RESEND_API_KEY="re_45yq92f5_CChZs8Hhr9Jf6rvFuQiLtQbq" \
  RESEND_FROM_EMAIL="noreply@clink.citsaucc.org" \
  FRONTEND_URL="https://employme.vercel.app" \
  SOCKET_IO_CORS_ORIGIN="https://employme.vercel.app" \
  COOKIE_DOMAIN=".herokuapp.com" \
  PORT="5000"
```

### Step 3: Build & Deploy

```bash
npm run build
git push heroku main
```

### Step 4: Run Migrations

```bash
heroku run "npx prisma migrate deploy" -a employme-api
heroku run "npx prisma db seed" -a employme-api  # If you have seeds
```

### Step 5: Verify

```bash
heroku logs --tail -a employme-api
heroku open -a employme-api
```

## Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

```bash
cd client-nextjs
vercel
# Follow prompts to connect GitHub repository
```

### Step 2: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://employme-api.herokuapp.com/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Step 3: Deploy

```bash
vercel --prod
# Or push to main/production branch for auto-deploy
git push origin main
```

## Image Upload Flow

### How It Works

**Development**:
- Images stored in `server/uploads/` directory
- URLs stored as `/uploads/filename` in database

**Production**:
- Images uploaded to Cloudinary
- URLs stored as Cloudinary secure URLs in database
- Public IDs stored for tracking/deletion
- Automatic CDN delivery

### Testing Image Upload

```bash
# Create test image
echo "test" > test.txt

# Upload via API
curl -X POST https://employme-api.herokuapp.com/api/attachments/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test.txt"

# Verify in Cloudinary dashboard
# Should see file in Media Library → employme/attachments folder
```

## Database Setup (Neon)

### Connection String Format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Get from Neon

1. Log in to [https://console.neon.tech](https://console.neon.tech)
2. Select your project
3. Click "Connection string"
4. Copy the connection string
5. Replace in `DATABASE_URL` on Heroku

### Verify Connection

```bash
# Test locally first
psql "postgresql://user:password@host/db?sslmode=require"

# Then set on Heroku
heroku config:set DATABASE_URL="..." -a employme-api
```

## Email Service (Resend + Render)

### Resend Configuration

Already configured in code:
- API Key: `re_45yq92f5_CChZs8Hhr9Jf6rvFuQiLtQbq`
- From Email: `noreply@clink.citsaucc.org`

### Render SMTP (Backup)

If using Render for email:
1. Set up Render PostgreSQL connection
2. Add Render SMTP credentials to `.env`
3. Email service will automatically use Resend (primary) or Render (backup)

### Test Email

```bash
# Trigger password reset or verification email
# Check inbox for confirmation
```

## Cloudinary Setup

### 1. Get Credentials

1. Sign up at [https://cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Folder Structure

In Cloudinary Dashboard → Settings → Upload:
1. Allowed file types: images, documents, PDFs
2. Folder: Set default to `employme/attachments`

### 3. Test Upload

Use the verification script or manual curl command (see above)

## Monitoring

### Heroku Logs

```bash
# Tail logs
heroku logs --tail -a employme-api

# Specific logs
heroku logs --dyno=web -a employme-api
heroku logs --dyno=router -a employme-api

# App metrics
heroku metrics -a employme-api
```

### Vercel Analytics

- Dashboard → Analytics for performance metrics
- Dashboar → Deployments for deployment history
- Dashboard → Function Logs for API route logs

### Neon Monitoring

- Console → Monitoring tab for query analytics
- Check connection pool status
- Monitor storage usage

## Troubleshooting

### CORS Errors

```bash
# Verify FRONTEND_URL matches your Vercel domain
heroku config -a employme-api | grep FRONTEND_URL

# Update if needed
heroku config:set FRONTEND_URL="https://your-vercel-domain.vercel.app" -a employme-api

# Restart
heroku restart -a employme-api
```

### Image Upload Fails

```bash
# Check Cloudinary config
heroku config -a employme-api | grep CLOUDINARY

# Verify NODE_ENV is "production"
heroku config -a employme-api | grep NODE_ENV

# Restart if changed
heroku restart -a employme-api

# Check logs
heroku logs --tail -a employme-api | grep -i cloudinary
```

### Database Connection Failed

```bash
# Test Neon connection directly
psql "your-neon-connection-string"

# Check Heroku config
heroku config -a employme-api | grep DATABASE_URL

# Check IP whitelist in Neon dashboard
# (Should be open to all IPs or include Heroku's IPs)
```

### Socket.io Issues

```bash
# Verify SOCKET_IO_CORS_ORIGIN
heroku config -a employme-api | grep SOCKET_IO_CORS_ORIGIN

# Update if needed
heroku config:set SOCKET_IO_CORS_ORIGIN="https://your-domain" -a employme-api

# Check browser console for WebSocket errors
# Check backend logs
heroku logs --tail -a employme-api | grep -i socket
```

## Scaling & Performance

### Heroku Dyno Types

```bash
# View current dyno
heroku ps -a employme-api

# Upgrade to Standard-1X (for production)
heroku ps:scale web=1:standard-1x -a employme-api

# Scale multiple dynos
heroku ps:scale web=2:standard-1x -a employme-api
```

### Add Redis Cache

```bash
heroku addons:create heroku-redis:premium-0 -a employme-api
```

### Database Performance

- Monitor slow queries in Neon dashboard
- Add indexes for frequently searched fields
- Use pagination for large datasets

## Rollback Procedure

### Heroku Rollback

```bash
# View releases
heroku releases -a employme-api

# Rollback to previous release
heroku rollback v123 -a employme-api  # Replace v123
```

### Vercel Rollback

1. Vercel Dashboard → Deployments
2. Click on previous deployment
3. Click "Promote to Production"

## Backup & Recovery

### Database Backups

```bash
# Automatic backups enabled in Neon (free tier: 7 days)
# Manual backup via Neon console

# Test restoration in staging environment
```

### Code Backup

```bash
# Ensure all code committed to Git
git push origin main
git push heroku main  # Backup to Heroku
```

## Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations ran successfully
- [ ] Backend responding at Heroku URL
- [ ] Frontend loading at Vercel URL
- [ ] Images uploading to Cloudinary
- [ ] Emails sending successfully
- [ ] No critical errors in logs (24hr check)
- [ ] Performance metrics normal
- [ ] Chat/real-time features working

## Support

- Heroku: https://devcenter.heroku.com
- Vercel: https://vercel.com/docs
- Neon: https://neon.tech/docs
- Cloudinary: https://cloudinary.com/documentation
- Resend: https://resend.com/docs
