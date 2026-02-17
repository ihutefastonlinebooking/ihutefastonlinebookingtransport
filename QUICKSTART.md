# Quick Start: Get HuteFast Live in 15 Minutes

**Your HuteFast transport booking platform is production-ready. Here's how to launch it for customers.**

---

## 1️⃣ Push to GitHub (3 mins)

```bash
cd /workspaces/ihutefastonlinebookingtransport

# Configure git (one-time)
git config user.email "your@email.com"
git config user.name "Your Name"

# Create repo on GitHub.com (free account)
# Go to https://github.com/new and create "hutefast"

# Push code
git remote add origin https://github.com/YOUR_USERNAME/hutefast.git
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

## 2️⃣ Deploy Frontend to Vercel (7 mins)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"Import Project"** → Select **"hutefast"** repo
4. Set Root Directory: `frontend`
5. Click **"Deploy"**

**Wait 3-5 minutes...**

✅ **Your website is live!** You get a URL like: `https://hutefast.vercel.app`

---

## 3️⃣ Deploy Backend (5 mins)

### Choose ONE:

**A. Railway.app (Recommended)**
- Go to https://railway.app
- Sign up with GitHub
- Click **"New Project"** → Deploy from GitHub
- Select "hutefast" repo
- Add PostgreSQL database (Railway does it automatically)
- Set these env vars:
  ```
  JWT_SECRET=your-secret-key-here
  MOMO_API_KEY=your-key
  SMS_API_KEY=your-key
  FRONTEND_URL=https://hutefast.vercel.app
  ```
- Wait for build (3 mins)
- Get your API URL

**B. Render.com (Also Good)**
- Go to https://render.com
- Sign up with GitHub
- New Web Service → Connect "hutefast"
- Build cmd: `npm install`
- Start cmd: `node backend/src/server.js`
- Add PostgreSQL database
- Set env vars (same as above)
- Deploy

✅ **Backend is live!** You get a URL like: `https://hutefast-api.up.railway.app`

---

## 4️⃣ Update Frontend Env Vars (2 mins)

1. Go to Vercel dashboard
2. Find your project **"hutefast"**
3. **Settings** → **Environment Variables**
4. Update:
   ```
   VITE_API_URL=https://your-backend-url/api
   VITE_WS_URL=wss://your-backend-url
   ```
5. Vercel auto-redeploys ✅

---

## ✅ YOU'RE DONE!

Your platform is **LIVE FOR CUSTOMERS:**

📱 **Booking Website:** `https://hutefast.vercel.app`

👨‍💼 **Admin Panel:** `https://hutefast.vercel.app/admin/login`

🚗 **Driver Scanner:** `https://hutefast.vercel.app/driver/scan`

---

## 🎨 Customize Before Launch

1. **Add Images to Carousel:**
   ```bash
   # Add jpg/png to frontend/public/images/slider/
   cp my-transport-images/*.jpg frontend/public/images/slider/
   npm run prebuild
   git push origin main
   # Vercel auto-redeploys with new images
   ```

2. **Change Logo/Colors:**
   - Edit `frontend/tailwind.config.js` for colors
   - Replace `frontend/public/images/logos/logo.svg`

3. **Add Your Company Info:**
   - Edit `frontend/src/locales/en.json` for text

---

## 📱 Share This Link

Tell your customers: **"Book your transport here: https://hutefast.vercel.app"** 🚗

---

## 🆘 Issues?

See **DEPLOYMENT_GUIDE.md** for detailed troubleshooting
