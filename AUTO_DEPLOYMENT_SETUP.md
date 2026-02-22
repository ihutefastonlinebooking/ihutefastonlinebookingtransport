# 🚀 AUTOMATIC DEPLOYMENT SETUP - COMPLETE GUIDE

## Status: ✅ Repository Ready for Auto-Deployment

Your code has been:
- ✅ Built and tested successfully
- ✅ Committed to GitHub with comprehensive commit message
- ✅ GitHub Actions workflows created
- ✅ Ready for automatic deployment to Netlify and Vercel

---

## 📋 What Happens Automatically

Every time you push to the `main` branch:
1. GitHub Actions automatically builds the project
2. If build succeeds, deploys to BOTH Netlify AND Vercel
3. Your site is live within 2-3 minutes
4. You receive deployment status in GitHub

---

## 🔧 SETUP STEP-BY-STEP (15 MINUTES)

### Step 1: Create Netlify Account & Connect Repository

1. **Go to**: https://app.netlify.com
2. **Click**: "Add new site" → "Import an existing project"
3. **Select**: GitHub
4. **Authorize**: Netlify to access your GitHub account
5. **Select Repository**: `ihutefastonlinebookingtransport`
6. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Base directory: `frontend` (optional)

7. **Set Environment Variables**:
   - Name: `VITE_API_URL`
   - Value: `https://ehut-api.railway.app/api`
   
   - Name: `VITE_SOCKET_URL`
   - Value: `https://ehut-api.railway.app`
   
   - Name: `VITE_APP_NAME`
   - Value: `EHUT`

8. **Deploy**: Click "Deploy site"

**Result**: Your site is now at `https://your-sitename.netlify.app`

### Step 2: Get Netlify Token for GitHub Actions

1. **Go to**: https://app.netlify.com/user/applications/personal
2. **Click**: "New access token"
3. **Name**: "GitHub Actions"
4. **Copy** the generated token

### Step 3: Add Netlify Secrets to GitHub

1. **Go to**: Your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click**: "New repository secret"
4. **Add Secret 1**:
   - Name: `NETLIFY_AUTH_TOKEN`
   - Value: (paste the token from Step 2)

5. **Add Secret 2**:
   - Name: `NETLIFY_SITE_ID`
   - Value: (your site ID from Netlify dashboard - under Site settings)

### Step 4: Create Vercel Account & Connect Repository

1. **Go to**: https://vercel.com
2. **Click**: "Add New..." → "Project"
3. **Import Git Repository**: Select `ihutefastonlinebookingtransport`
4. **Configure**:
   - Framework Preset: React
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Environment Variables**:
   ```
   VITE_API_URL = https://ehut-api.railway.app/api
   VITE_SOCKET_URL = https://ehut-api.railway.app
   VITE_APP_NAME = EHUT
   ```

6. **Deploy**: Click "Deploy"

**Result**: Your site is now at `https://your-project.vercel.app`

### Step 5: Get Vercel Token for GitHub Actions

1. **Go to**: https://vercel.com/account/tokens
2. **Create Token**:
   - Name: "GitHub Actions"
   - Scope: Full account
   - Copy the token

### Step 6: Add Vercel Secrets to GitHub

1. **Go to**: Your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click**: "New repository secret"
4. **Name**: `VERCEL_TOKEN`
5. **Value**: (paste token from Step 5)

---

## ✅ VERIFICATION CHECKLIST

After setup, verify everything works:

- [ ] Netlify site is accessible (visit your Netlify URL)
- [ ] Vercel site is accessible (visit your Vercel URL)
- [ ] GitHub Actions secrets are set (check Repository Settings)
- [ ] Both workflows exist (`.github/workflows/deploy-*.yml`)
- [ ] Environment variables are configured on both platforms

---

## 🧪 TEST AUTOMATIC DEPLOYMENT

1. **Make a small change** to frontend code
2. **Commit and push** to main branch
3. **Check GitHub Actions** (Actions tab in your repo)
4. **Wait 3-5 minutes** for deployment
5. **Access your site** to verify changes are live

---

## 📊 Environment Variables Reference

These should be set on Netlify AND Vercel:

```
VITE_API_URL = https://ehut-api.railway.app/api
VITE_SOCKET_URL = https://ehut-api.railway.app
VITE_APP_NAME = EHUT
```

---

## 🔍 TROUBLESHOOTING

### Build Fails on Netlify/Vercel

**Check**:
1. Environment variables are set correctly
2. Node version is 18+ (set in netlify.toml or Vercel dashboard)
3. Frontend dependencies are installed: `npm ci`
4. Build command works locally: `npm run build`

**Fix**:
```bash
# Local test
cd frontend
npm ci
npm run build
```

### Deployment Not Triggering

**Check**:
1. GitHub Actions are enabled (Settings → Actions)
2. Secrets are set (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID, VERCEL_TOKEN)
3. Workflows are in `.github/workflows/`
4. You pushed to `main` branch

**Fix**:
```bash
# Manually trigger
git add .
git commit -m "Test deployment trigger"
git push origin main
```

### Site Shows Old Version

**Clear Cache**:

**Netlify**:
1. Go to Netlify dashboard
2. Builds → Deploy settings
3. Click "Clear cache and redeploy"

**Vercel**:
1. Go to Vercel dashboard
2. Deployments → Click latest
3. Click "Redeploy" button

---

## 📱 Your Live Websites

Once everything is configured:

| Platform | URL | Status |
|----------|-----|--------|
| Netlify | https://your-netlify-site.netlify.app | Auto-deployed |
| Vercel | https://your-vercel-project.vercel.app | Auto-deployed |
| GitHub | https://github.com/ihutefastonlinebooking/ihutefastonlinebookingtransport | Source |

---

## 🔄 AUTOMATIC DEPLOYMENT WORKFLOW

```
Push to GitHub main branch
         ↓
GitHub Actions triggered
         ↓
Build frontend (npm run build)
         ↓
─────────────────────
│                   │
↓                   ↓
Deploy to Netlify  Deploy to Vercel
│                   │
↓                   ↓
Live at netlify.app Live at vercel.app
```

---

## 🎯 NEXT: Connect Backend (Optional)

If you want to deploy backend to Railway:

1. **Go to**: https://railway.app
2. **Create Project** → **Import GitHub repo**
3. **Select backend folder**
4. **Add PostgreSQL** database
5. **Set Environment Variables** (see docs)
6. **Deploy!**

Backend will be at: `https://your-rail-project.railway.app`

---

## 📝 Frequently Asked Questions

**Q: Do I need both Netlify and Vercel?**
A: No! Choose one. Having both is for redundancy/comparison.

**Q: Can I use a custom domain?**
A: Yes! Both Netlify and Vercel allow custom domains in their dashboards.

**Q: How do I disable automatic deployment?**
A: Delete the workflow files in `.github/workflows/` or disable GitHub Actions.

**Q: How long does deployment take?**
A: Typically 2-5 minutes from push to live.

**Q: What if deployment fails?**
A: GitHub will show error logs. Click on the failed workflow to see details.

---

## 🎉 YOU'RE DONE!

Your website now has:
- ✅ Automatic deployment on every push
- ✅ Continuous deployment pipeline
- ✅ Zero-downtime updates
- ✅ Built-in CI/CD
- ✅ Production-ready infrastructure

**Push code → Automatic deployment → Live in 3 minutes!**

---

## 📞 Support

- **Netlify Docs**: https://docs.netlify.com
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Status**: ✅ PRODUCTION DEPLOYMENT READY  
**Last Updated**: February 22, 2026  
**Version**: 1.0.0
