# HuteFast - Smart Transport Booking Platform

**A fully production-ready, scalable transport booking platform with long-distance trips, short-distance city rides, digital cards, and QR ticket validation.**

---

## � START HERE

> **Your HuteFast platform is 100% complete and ready to launch!**

| Goal | Document | Time |
|------|----------|------|
| **Quick Setup** | [QUICK_START.md](./QUICK_START.md) | 15 min ⚡ |
| **Full Guide** | [GETTING_STARTED.md](./GETTING_STARTED.md) | 30 min |
| **Test All Features** | [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) | 1-2 hrs |
| **Deploy to Production** | [DEPLOYMENT_PRODUCTION_GUIDE.md](./DEPLOYMENT_PRODUCTION_GUIDE.md) | 2-4 hrs |
| **Project Overview** | [YOU_ARE_HERE.md](./YOU_ARE_HERE.md) | 5 min 🎉 |
| **Next Steps** | [NEXT_STEPS.md](./NEXT_STEPS.md) | 10 min |

**👉 First time? Start with [QUICK_START.md](./QUICK_START.md)**

---

## �🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL / Supabase
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/ihutefastonlinebooking/ihutefastonlinebookingtransport.git
cd ihutefastonlinebookingtransport

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

---

## 💡 Key Features

### For Clients
✅ Long-Distance Bookings - Search, book, and track inter-city trips
✅ Short-Distance Rides - Quick city transportation with instant booking
✅ iHute Card - Prepaid digital card for fast booking & payment
✅ Real-Time Tracking - Live driver location on maps
✅ QR Tickets - Easy boarding with QR code validation
✅ Payment Gateway - MoMo and card payments
✅ SMS & Email - Instant confirmations
✅ Multi-Language - English & French support

### For Drivers
✅ Easy Booking Acceptance
✅ Online Status & Location Sharing
✅ QR Ticket Scanner
✅ Earnings Dashboard
✅ Trip History

### For Companies
✅ Route Management
✅ Vehicle Management
✅ Driver Management
✅ Revenue Reports

### For Admin
✅ Full System Control
✅ User & Payment Management
✅ Revenue Analytics

---

## 🔧 Technology Stack

### Frontend: React 18 + Vite + Tailwind CSS
### Backend: Node.js + Express.js + PostgreSQL
### Database: Supabase (PostgreSQL)
### Hosting: Vercel (Frontend) + Render/Railway (Backend)

---

## 🚀 Deployment

See [DEPLOYMENT_PRODUCTION_GUIDE.md](./DEPLOYMENT_PRODUCTION_GUIDE.md) for complete deployment instructions.

---

## 📞 Support

- **Email:** niyodidie@gmail.com
- **Phone:** +250 792 505 680
- **WhatsApp:** https://wa.me/250792505680

---

**Version:** 1.0.0 | **Status:** Production Ready | **Last Updated:** February 2026

## ✨ Key Features

### 🏠 Customer Interface
- **Homepage with Auto-Carousel** — dynamic image slider with fade transitions
- **Smart Multi-Step Booking** — search routes, select seats, enter passenger names, confirm in 10 minutes
- **Real-Time QR Tickets** — instant QR code generation with duplicate scan prevention
- **Live Trip Tracking** — see driver location on interactive map in real-time
- **Mobile-First Design** — fully responsive on all devices
- **Smooth Animations** — page transitions, loaders, toast notifications

### � Phase 3: New Payment & Booking Systems
- **iHute Digital Card** — Create digital wallet, topup balance, make payments directly
- **Short Trip Booking** — Urban short-distance trips with instant QR tickets
- **Invoice Generation** — Automatic PDF invoices with QR codes for all bookings
- **Transaction History** — View all payments and transaction details
- **Payment Methods** — Support for MoMo, iHute Card, and bank transfers

### 👨‍💼 Admin Dashboard
- **Secure JWT Login** — `/admin/login` protected with token expiry
- **Routes Management** — create, edit, delete, search and filter routes
- **Vehicles & Drivers** — manage fleet and driver profiles
- **Bookings Overview** — real-time booking status and analytics
- **Payment Reports** — track transactions and revenue
- **Audit Logs** — activity tracking for compliance
- **Responsive Tables** — pagination, search, bulk operations

### 🚗 Driver Features
- **QR Scanner** — real-time camera feed, instant validation
- **Trip History** — view all completed trips and earnings
- **Online/Offline Status** — toggle availability
- **Real-time Location Sharing** — GPS tracking with WebSocket
- **Ticket Validation** — mark passengers as boarded with scanner

### 🔐 Security & Access Control
- **JWT token-based authentication** with automatic expiry
- **Role-Based Access Control** — 4 role types: super_admin, company_admin, driver, client
- **Data Isolation** — Each user sees only their own data
- **Protected Routes** — Frontend ProtectedRoute component with role verification
- **Password hashing** (bcrypt)
- **CORS properly configured**
- **Environment variables** for sensitive data
- **QR code duplicate prevention**
- **Input validation** on all endpoints
- **HTTPS ready** for production

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, npm/yarn
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone and navigate
git clone <your-repo-url>
cd ihutefastonlinebookingtransport

# Install dependencies
cd frontend && npm install --legacy-peer-deps
cd ../backend && npm install

# Generate images index
cd ../frontend && npm run prebuild

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your values
```

### Development

```bash
# Terminal 1: Backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### Test Routes
- **Homepage:** http://localhost:5173
- **Book Trip:** http://localhost:5173/book
- **Admin Login:** http://localhost:5173/admin/login
- **Driver Scanner:** http://localhost:5173/driver/scan

---

## 📦 Production Build

```bash
cd frontend
npm run build          # Creates dist/
npm run preview        # Test production build locally
```

Build size: **~213 KB gzipped** (optimized)

---

## 🌐 Deploy to Vercel (Frontend)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "HuteFast production-ready: booking, QR scanner, admin dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ihutefastonlinebookingtransport.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click **"New Project"**
3. **Import Repository** — select your GitHub repository
4. **Configure Project:**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install --legacy-peer-deps`

5. **Add Environment Variables:**
   ```
   VITE_API_URL = https://your-backend-api.com/api
   VITE_WS_URL = wss://your-websocket.com
   VITE_ENV = production
   ```

6. **Deploy** — Vercel automatically builds and deploys on each push

**✅ Your frontend is now live!** Share the Vercel URL with customers.

---

## 🚀 Deploy Backend

### Option A: Railway.app (Recommended)

1. Create account at https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your repository
4. Create PostgreSQL database (Railway will provide `DATABASE_URL`)
5. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret
   NODE_ENV=production
   MOMO_API_KEY=your-key
   SMS_API_KEY=your-sms-key
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```
6. Deploy — Railway handles it automatically

### Option B: Render.com

1. Create account at https://render.com
2. **New** → **Web Service** → Connect GitHub
3. Select repository
4. Add PostgreSQL database
5. Set build command: `npm install && npm run build`
6. Set start command: `npm start`
7. Add environment variables (same as above)

### Option C: Railway + Supabase

1. Deploy backend on Railway (see Option A)
2. Use Supabase for PostgreSQL (generous free tier)
3. Get connection string from Supabase dashboard
4. Use in `DATABASE_URL` on Railway

---

## 📁 Image Management

### Add Carousel Images

1. **Option A: Direct Upload**
   ```bash
   # Add images to frontend public folder
   cp your-image.jpg frontend/public/images/slider/
   ```

2. **Option B: From Project Root**
   ```bash
   # Copy from images/ folder
   cp images/*.jpg frontend/public/images/slider/
   ```

3. **Generate Index**
   ```bash
   npm run prebuild
   ```

4. **Deploy** — Images appear automatically in carousel on refresh

Supported formats: `.jpg`, `.png`, `.webp`, `.svg`

---

## ✅ Pre-Deployment Checklist

- [ ] Backend API deployed and running
- [ ] PostgreSQL database created and migrated
- [ ] JWT_SECRET set (strong, random string)
- [ ] MoMo and SMS API keys configured
- [ ] Frontend `VITE_API_URL` and `VITE_WS_URL` point to backend
- [ ] CORS enabled on backend for Vercel domain
- [ ] SSL certificates installed (auto on Railway/Render)
- [ ] Email/SMS gateways tested
- [ ] QR validation tested on real device
- [ ] Admin login functional
- [ ] Booking flow tested end-to-end
- [ ] Payment integration tested (with staging credentials first)
- [ ] Mobile responsiveness verified
- [ ] Console has no errors on production

---

## 🧪 Testing Pre-Launch

### Smoke Tests
```bash
# Test homepage loads
curl https://your-vercel-url.vercel.app/

# Test API connectivity
curl https://your-backend-url/api/health
```

### Manual Tests
1. **Homepage** — carousel loads and auto-plays ✓
2. **Book Trip** — search, select seats, enter details ✓
3. **Admin Login** — login, view dashboard ✓
4. **Driver Scanner** — open camera, test with QR code ✓
5. **Payment** — 10-minute countdown works ✓
6. **Mobile** — test on real phone (iOS & Android) ✓

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **Render Dashboard:** https://dashboard.render.com
- **Supabase Console:** https://app.supabase.com

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with "Cannot find module" | Run `npm install --legacy-peer-deps` again |
| API 404 errors | Check `VITE_API_URL` matches backend domain |
| Images not showing in carousel | Run `npm run prebuild` after adding images |
| WebSocket connection fails | Check `VITE_WS_URL` is correct (use `wss://` for HTTPS) |
| Admin login redirects to login page | Check backend JWT validation is working |
| Payment window expired errors | 10-minute timer is hardcoded; create new booking |

---

## 📊 Tech Stack

**Frontend:**
- React 18.x, Vite 5.x, React Router 6.x
- Tailwind CSS 3.x, i18next, Axios
- Socket.io Client, Leaflet Maps
- qrcode.js, date-fns, Zustand

**Backend:**
- Node.js 18.x, Express.js 4.x
- PostgreSQL 14.x, Socket.io 4.x
- JWT, bcrypt, Joi Validation
- Nodemailer, Twilio SMS Integration

---

## 📄 License

MIT License — Free for production use

---

## 🎉 YOU'RE READY!

Your HuteFast transport booking platform is **production-ready**. Share the Vercel URL with your customers and start accepting bookings! 🚀

**Frontend URL (production):** Will be provided by Vercel after deployment

For enterprise support or customization, contact the development team.
