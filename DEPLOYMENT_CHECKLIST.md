# Production Deployment Checklist

## Pre-Deployment

### Credentials Preparation
- [ ] Neon PostgreSQL database created
- [ ] Neon connection string copied
- [ ] Cloudinary account created
- [ ] Cloudinary Cloud Name obtained
- [ ] Cloudinary API Key obtained
- [ ] Cloudinary API Secret obtained
- [ ] Resend credentials verified
- [ ] Render SMTP credentials (if needed)

### Code Preparation
- [ ] All code committed to Git
- [ ] No uncommitted changes
- [ ] `.gitignore` includes `.env*` files
- [ ] No sensitive data in code
- [ ] Tests passing (if applicable)
- [ ] Linting passes

### Service Account Setup
- [ ] Heroku account created & authenticated
- [ ] Vercel account created & authenticated
- [ ] Heroku CLI installed
- [ ] Vercel CLI installed

## Backend Deployment (Heroku)

### Setup
- [ ] Create Heroku app: `heroku create [name]`
- [ ] Verify Procfile exists
- [ ] Verify `npm start` script in package.json
- [ ] Verify TypeScript build works: `npm run build`

### Environment Variables
- [ ] Set DATABASE_URL (Neon)
- [ ] Set NODE_ENV=production
- [ ] Set JWT_SECRET (auto-generated)
- [ ] Set SESSION_SECRET (auto-generated)
- [ ] Set CLOUDINARY_CLOUD_NAME
- [ ] Set CLOUDINARY_API_KEY
- [ ] Set CLOUDINARY_API_SECRET
- [ ] Set RESEND_API_KEY
- [ ] Set RESEND_FROM_EMAIL
- [ ] Set FRONTEND_URL (Vercel domain)
- [ ] Set SOCKET_IO_CORS_ORIGIN (Vercel domain)
- [ ] Set COOKIE_DOMAIN
- [ ] Set PORT=5000

### Deployment
- [ ] Build TypeScript: `npm run build`
- [ ] Push to Heroku: `git push heroku main`
- [ ] Monitor build: `heroku logs --tail`
- [ ] Run migrations: `heroku run "npx prisma migrate deploy"`
- [ ] Verify app: `curl https://[app].herokuapp.com/health`

## Frontend Deployment (Vercel)

### Setup
- [ ] Vercel project created
- [ ] GitHub connected
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### Environment Variables
- [ ] Set NEXT_PUBLIC_API_URL (Heroku backend)
- [ ] Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

### Deployment
- [ ] Push to main branch
- [ ] Vercel auto-deploys
- [ ] Verify frontend loads
- [ ] Verify API calls work
- [ ] Check Network tab for CORS errors

## Feature Testing

### Authentication
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works

### Jobs & Application
- [ ] Job search works
- [ ] Job filtering works
- [ ] Application submission works
- [ ] Status updates work

### Images
- [ ] Image upload works
- [ ] Images display correctly
- [ ] Images persist after reload
- [ ] Verify in Cloudinary dashboard

### Real-Time
- [ ] Chat works
- [ ] Online status works
- [ ] Notifications work

### Email
- [ ] Verification emails sent
- [ ] Password reset emails sent
- [ ] Application notifications sent

## Post-Deployment (24-hour check)

### Validation
- [ ] No critical errors in logs
- [ ] Performance metrics normal
- [ ] Database connections stable
- [ ] File uploads working

### Optimization
- [ ] Review slow queries
- [ ] Check Cloudinary usage
- [ ] Check Vercel bandwidth

### Monitoring
- [ ] Heroku error alerts configured
- [ ] Vercel logs accessible
- [ ] Neon monitoring enabled

## Success Criteria

✅ All items above checked  
✅ Backend responding on Heroku  
✅ Frontend running on Vercel  
✅ All features working  
✅ No critical errors  
✅ Team notified

---

## Sign-Off

- Deployed by: _________________
- Date: _________________
- Issues encountered: _________________
