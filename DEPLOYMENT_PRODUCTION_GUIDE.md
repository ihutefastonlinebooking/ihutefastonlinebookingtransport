# HuteFast - Complete Production Deployment Guide

## Project Overview

HuteFast is a fully-featured, production-ready transport booking platform with support for:
- Long-distance trip bookings
- Short city trip bookings
- Digital iHute Card system
- QR-based ticket validation
- Real-time GPS tracking
- Admin dashboard with complete management
- Multi-language support
- MoMo payment integration
- SMS confirmations

## Technology Stack

### Frontend
- React 18.2.0
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- i18next (internationalization)
- Leaflet (maps)
- Socket.io-client (real-time)
- Zustand (state management)

### Backend
- Node.js + Express.js
- PostgreSQL (Supabase)
- Socket.io (real-time)
- JWT authentication
- Redis (optional caching)

### Hosting
- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase (PostgreSQL)

---

## PHASE 1: LOCAL DEVELOPMENT SETUP

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (local or Supabase)
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Install Node modules
npm install

# Start development server
npm run dev
```

**Backend .env Configuration:**
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=hutefast
JWT_SECRET=your_secret_key
MOMO_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
FRONTEND_URL=http://localhost:3000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env.local

# Edit .env.local
nano .env.local

# Start development server
npm run dev
```

**Frontend .env.local:**
```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=HuteFast
VITE_DEFAULT_LANGUAGE=en
```

---

## PHASE 2: DATABASE SETUP

### Option A: Local PostgreSQL

```bash
# Create database
createdb hutefast

# Connect to database
psql -U postgres -d hutefast

# Import schema (from backend/src/db/schema.js)
# Run the SQL from schema.js in the database
```

### Option B: Supabase (Recommended)

1. Go to https://supabase.com
2. Create a new project
3. Copy connection string
4. Update backend .env with connection details

```
DB_HOST=your-project.supabase.co
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
```

---

## PHASE 3: BEFORE DEPLOYMENT TESTING

### Backend Testing
```bash
cd backend

# Test health endpoint
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe","phone":"+250123456","role":"client"}'

# Test API endpoints
npm test  # if tests are configured
```

### Frontend Testing
```bash
cd frontend

# Build for production
npm run build

# Preview build
npm run preview

# Run linter
npm run lint

# Check console for errors (should be clear)
```

### Manual Checklist

- [ ] User registration works
- [ ] Login works
- [ ] Booking creation works
- [ ] Payment flow works (use test credentials)
- [ ] QR code generation works
- [ ] Map displays correctly
- [ ] Mobile responsive layout works
- [ ] All pages load without console errors
- [ ] Admin dashboard functions properly
- [ ] SMS notifications send (if configured)
- [ ] Email confirmations send (if configured)

---

## PHASE 4: DEPLOYMENT TO PRODUCTION

### Backend Deployment (Render.com)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `/backend` as root directory
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (copy from .env):
     ```
     NODE_ENV=production
     PORT=5000
     DB_HOST=your-supabase-host
     DB_USER=postgres
     DB_PASSWORD=***
     DB_NAME=postgres
     JWT_SECRET=***
     MOMO_API_KEY=***
     MOMO_API_SECRET=***
     FRONTEND_URL=https://your-frontend-domain.com
     ```
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Copy the deployed URL

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "Add New..." → "Project"
   - Import the GitHub repository
   - Set as Monorepo with `frontend` root directory
   - Framework: Vite (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add Environment Variables:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     VITE_WS_URL=https://your-backend-url.onrender.com
     VITE_APP_NAME=HuteFast
     ```
   - Click "Deploy"
   - Wait for deployment

3. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS settings with provided records

### Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for project initialization

2. **Initialize Schema**
   - Go to SQL Editor
   - Create new query
   - Paste SQL from `backend/src/db/schema.js`
   - Execute to create all tables

3. **Configure Backups**
   - Go to Settings → Backups
   - Enable daily backups

---

## PHASE 5: POST-DEPLOYMENT VERIFICATION

### Health Checks

```bash
# Check backend health
curl https://your-backend-url.onrender.com/health

# Check frontend loads
curl https://your-frontend-domain.com

# Test API connection
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend-url.onrender.com/api/users/profile
```

### Production Monitoring

1. **Backend Monitoring (Render)**
   - Check "Logs" tab for errors
   - Monitor memory/CPU usage

2. **Frontend Monitoring (Vercel)**
   - Check "Deployments" for build status
   - Check Analytics for traffic

3. **Database Monitoring (Supabase)**
   - Check "Database" → "Logs" for queries
   - Monitor connection count

---

## PHASE 6: PRODUCTION HARDENING

### Security Configuration

1. **Backend**
   ```
   - Enable HTTPS only
   - Set secure JWT secret (32+ characters)
   - Enable rate limiting
   - Configure CORS properly
   - Set appropriate headers with Helmet
   ```

2. **Frontend**
   ```
   - Enable HTTPS
   - Set secure CSP headers
   - Remove source maps on production
   - Enable caching headers
   ```

3. **Database**
   ```
   - Enable SSL connections
   - Set strong password (30+ chars)
   - Enable backup encryption
   - Configure IP whitelist if needed
   ```

### Environment Variables Security

**Backend Production .env:**
```
NODE_ENV=production
PORT=5000
DB_HOST=secure-host
DB_USER=secure-user
DB_PASSWORD=very-long-secure-password-min-32-chars
DB_NAME=hutefast
JWT_SECRET=another-very-long-secure-key-min-32-chars
REFRESH_TOKEN_SECRET=yet-another-secure-key
MOMO_API_KEY=live-key-not-sandbox
MOMO_API_SECRET=live-secret
TWILIO_ACCOUNT_SID=production-sid
TWILIO_AUTH_TOKEN=production-token
EMAIL_USER=noreply@hutefast.com
EMAIL_PASSWORD=secure-app-password
ENCRYPTION_KEY=32-character-encryption-key-min
FRONTEND_URL=https://your-production-frontend.com
```

---

## PHASE 7: CONTINUOUS DEPLOYMENT

### GitHub Actions (Optional but Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## PHASE 8: MONITORING & MAINTENANCE

### Regular Tasks

**Daily:**
- Check error logs
- Monitor uptime
- Review database connections

**Weekly:**
- Review user feedback
- Check security alerts
- Update dependencies (npm outdated)

**Monthly:**
- Database optimization
- Performance optimization
- Security audit
- Backup verification

### Handling Issues

**502 Bad Gateway:**
- Check backend service status
- Check database connection
- Check API logs

**Slow Performance:**
- Check database query logs
- Review N+1 query issues
- Analyze frontend bundle size

**Payment Issues:**
- Verify MoMo credentials
- Check webhook logs
- Review failed transactions

---

## PHASE 9: SCALING (FUTURE)

When ready to scale:

1. **Database**
   - Migrate to managed PostgreSQL
   - Enable read replicas
   - Implement caching layer (Redis)

2. **Backend**
   - Implement horizontal scaling
   - Use load balancer
   - Microservices architecture

3. **Frontend**
   - Enable CDN caching
   - Implement service workers
   - Add offline capability

---

## TROUBLESHOOTING

### Common Issues & Solutions

**Database Connection Failed**
```
Solution:
1. Verify database URL is correct
2. Check firewall rules
3. Test connection locally
4. Check database service status
```

**CORS Errors**
```
Solution:
1. Update FRONTEND_URL in backend .env
2. Verify CORS configuration in Express
3. Check browser console for exact error
4. Use curl to test from backend
```

**Token Expired**
```
Solution:
1. Implement refresh token flow
2. Clear local storage on logout
3. Redirect to login on 401
4. Test with browser dev tools
```

**Slow API Responses**
```
Solution:
1. Add database indexes
2. Implement query optimization
3. Enable response caching
4. Use pagination for large datasets
```

---

## Support & Resources

- **Documentation**: See README.md files in each directory
- **Issue Tracking**: Use GitHub Issues
- **Contact**: niyodidie@gmail.com
- **WhatsApp**: https://wa.me/250792505680

---

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database fully initialized and tested
- [ ] Backend deployed and responding
- [ ] Frontend deployed and loading
- [ ] API connectivity verified
- [ ] SSL certificates enabled
- [ ] CORS configured properly
- [ ] Authentication tested
- [ ] Payment flow tested with sandbox
- [ ] SMS notifications tested
- [ ] Email notifications tested
- [ ] QR code generation tested
- [ ] Map functionality tested
- [ ] Admin dashboard tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimized (Lighthouse > 80)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error pages configured
- [ ] Monitoring/alerts configured
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained on system
- [ ] Go-live announcement prepared

---

## Success Criteria

Your deployment is successful when:

✓ Frontend loads without errors
✓ All pages responsive on mobile/tablet/desktop
✓ Users can register and login
✓ Bookings can be created
✓ Payments can be made
✓ QR codes generate correctly
✓ Drivers can scan tickets
✓ Admin dashboard fully functional
✓ No console errors
✓ Performance is acceptable (< 3s load time)
✓ System handles expected load

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Status:** Production Ready
