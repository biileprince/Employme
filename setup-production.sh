#!/bin/bash

# Employ.me Production Deployment Setup Script
# This script helps set up your production environment on Heroku and Vercel

set -e

echo "🚀 Employ.me Production Deployment Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Install from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Run: npm i -g vercel"
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Get app name
echo "📝 Configuration"
echo "---------------"
read -p "Enter Heroku app name (e.g., employme-api): " HEROKU_APP

if [ -z "$HEROKU_APP" ]; then
    echo "❌ App name cannot be empty"
    exit 1
fi

# Get database URL
echo ""
echo "Get your Neon connection string from: https://console.neon.tech"
read -p "Enter DATABASE_URL: " DATABASE_URL

# Get Cloudinary credentials
echo ""
echo "Get your Cloudinary credentials from: https://cloudinary.com/console"
read -p "Enter CLOUDINARY_CLOUD_NAME: " CLOUDINARY_CLOUD_NAME
read -p "Enter CLOUDINARY_API_KEY: " CLOUDINARY_API_KEY
read -p "Enter CLOUDINARY_API_SECRET: " CLOUDINARY_API_SECRET

# Get frontend URL
echo ""
echo "You'll get a Vercel URL after deploying the frontend"
read -p "Enter FRONTEND_URL (or press Enter for later): " FRONTEND_URL

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://your-app.vercel.app"
fi

echo ""
echo "🔧 Setting up Heroku app..."
echo "----"

# Login to Heroku
echo "Logging in to Heroku..."
heroku login

# Create app
echo "Creating Heroku app: $HEROKU_APP"
heroku create "$HEROKU_APP" || echo "App may already exist"

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Set environment variables
echo "Setting environment variables..."
heroku config:set -a "$HEROKU_APP" \
  DATABASE_URL="$DATABASE_URL" \
  NODE_ENV="production" \
  PORT="5000" \
  JWT_SECRET="$JWT_SECRET" \
  SESSION_SECRET="$SESSION_SECRET" \
  CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME" \
  CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY" \
  CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET" \
  RESEND_API_KEY="re_45yq92f5_CChZs8Hhr9Jf6rvFuQiLtQbq" \
  RESEND_FROM_EMAIL="noreply@clink.citsaucc.org" \
  FRONTEND_URL="$FRONTEND_URL" \
  SOCKET_IO_CORS_ORIGIN="$FRONTEND_URL"

echo "✅ Environment variables set"

# Build and deploy
echo ""
echo "📦 Building and deploying backend..."
echo "----"

cd server
npm run build

echo "Pushing to Heroku..."
git push heroku main

echo ""
echo "🗄️  Running database migrations..."
heroku run "npx prisma migrate deploy" -a "$HEROKU_APP"

echo ""
echo "✅ Deployment Complete!"
echo "===================="
echo ""
echo "🌐 Backend URL: https://$HEROKU_APP.herokuapp.com"
echo ""
echo "Next steps:"
echo "1. Deploy frontend to Vercel with:"
echo "   cd client-nextjs"
echo "   vercel --prod"
echo ""
echo "2. Set Vercel environment variables:"
echo "   NEXT_PUBLIC_API_URL=https://$HEROKU_APP.herokuapp.com/api"
echo "   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME"
echo ""
echo "3. Test your deployment:"
echo "   curl https://$HEROKU_APP.herokuapp.com/api/health"
echo ""
echo "📊 Monitor logs: heroku logs --tail -a $HEROKU_APP"
