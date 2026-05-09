# Quick Production Deployment Guide

## Prerequisites Checklist

- [ ] Heroku account created: https://heroku.com
- [ ] Vercel account created: https://vercel.com
- [ ] Neon account created: https://neon.tech
- [ ] Cloudinary account created: https://cloudinary.com
- [ ] Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli
- [ ] Vercel CLI installed: `npm i -g vercel`
- [ ] Git configured on your machine

## Your Credentials

```
Resend API Key:    re_45yq92f5_CChZs8Hhr9Jf6rvFuQiLtQbq
Resend Email:      noreply@clink.citsaucc.org
Email Provider:    Render (SMTP backup)
Database Provider: Neon (PostgreSQL)
Image Storage:     Cloudinary (CDN-backed)
```

## Quick Start (5 minutes)

### Step 1: Deploy Backend to Heroku

```bash
# Login to Heroku
heroku login

# Create app
cd server
heroku create employme-api  # Replace with unique name

# Get Neon connection string from: https://console.neon.tech

# Build backend
npm run build

# Deploy
git push heroku main

# Run migrations
heroku run "npx prisma migrate deploy"

# Get your backend URL
heroku open  # This will show: https://employme-api.herokuapp.com
```

### Step 2: Deploy Frontend to Vercel

```bash
# Login to Vercel
cd client-nextjs
vercel

# Follow prompts to connect GitHub

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://employme-api.herokuapp.com/api
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-value

# Deploy to production
vercel --prod
```

### Step 3: Test

```bash
# Test backend API
curl https://employme-api.herokuapp.com/api/health

# Test frontend
Visit https://your-app.vercel.app

# Test image upload in your app
# Should upload to Cloudinary (not local filesystem)

# Verify in Cloudinary dashboard
# Check Media Library for uploaded images
```

## Detailed Setup (with all credentials)

### Get Neon Connection String

1. Go to https://console.neon.tech
2. Create a new project
3. Click "Connection string"
4. Copy the string (format: `postgresql://...`)

### Get Cloudinary Credentials

1. Go to https://cloudinary.com/console
2. Cloud Name: visible on dashboard
3. Click "Settings" → "API Keys"
4. Copy API Key and API Secret

### Set Heroku Environment Variables

```bash
heroku config:set -a employme-api \
  DATABASE_URL="postgresql://..." \
  CLOUDINARY_CLOUD_NAME="your-value" \
  CLOUDINARY_API_KEY="your-value" \
  CLOUDINARY_API_SECRET="your-value" \
  RESEND_API_KEY="re_45yq92f5_CChZs8Hhr9Jf6rvFuQiLtQbq" \
  RESEND_FROM_EMAIL="noreply@clink.citsaucc.org" \
  FRONTEND_URL="https://your-app.vercel.app" \
  SOCKET_IO_CORS_ORIGIN="https://your-app.vercel.app"
```

## Testing Features

### Test User Registration

```bash
# Should send verification email
# Email appears in Resend logs
```

### Test Image Upload

```bash
# Upload image via app
# Check Cloudinary Media Library
# Image should appear in: employme/attachments folder
```

### Test Real-time Chat

```bash
# Open app in two browsers
# Send message between accounts
# Should appear in real-time
```

## Troubleshooting

### CORS Error from Frontend

```bash
# Update Heroku environment
heroku config:set FRONTEND_URL="https://correct-vercel-url" -a employme-api
heroku restart -a employme-api
```

### Image Upload Fails

```bash
# Verify Cloudinary is configured
heroku config -a employme-api | grep CLOUDINARY

# Check logs
heroku logs --tail -a employme-api

# Verify NODE_ENV is production
heroku config -a employme-api | grep NODE_ENV
```

### Database Connection Error

```bash
# Test Neon connection directly
psql "postgresql://user:pass@host/db?sslmode=require"

# Verify in Heroku
heroku config -a employme-api | grep DATABASE_URL
```

## Useful Commands

```bash
# View app logs
heroku logs --tail -a employme-api

# Restart app
heroku restart -a employme-api

# View all config variables
heroku config -a employme-api

# Run commands on Heroku
heroku run bash -a employme-api

# See deployment history
heroku releases -a employme-api

# Rollback to previous version
heroku rollback v123 -a employme-api
```

## Environment Variables Reference

### Backend (Heroku)

| Variable | Value | Source |
|----------|-------|--------|
| DATABASE_URL | postgresql://... | Neon |
| NODE_ENV | production | Set to production |
| JWT_SECRET | auto-generated | Generate 32-char random |
| SESSION_SECRET | auto-generated | Generate 32-char random |
| CLOUDINARY_CLOUD_NAME | your-value | Cloudinary dashboard |
| CLOUDINARY_API_KEY | your-value | Cloudinary settings |
| CLOUDINARY_API_SECRET | your-value | Cloudinary settings |
| RESEND_API_KEY | re_45yq92f5_... | Provided |
| RESEND_FROM_EMAIL | noreply@... | Provided |
| FRONTEND_URL | https://your-app... | Your Vercel URL |
| SOCKET_IO_CORS_ORIGIN | https://your-app... | Your Vercel URL |

### Frontend (Vercel)

| Variable | Value | Source |
|----------|-------|--------|
| NEXT_PUBLIC_API_URL | https://your-app.herokuapp.com/api | Your Heroku URL |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | your-value | Cloudinary |

## Support

- **Deployment Guide**: See `DEPLOYMENT.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Heroku Docs**: https://devcenter.heroku.com
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

**Ready to deploy? Start with `heroku login` and follow Step 1 above!** 🚀
