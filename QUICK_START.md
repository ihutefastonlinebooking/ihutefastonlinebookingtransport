# 🚀 QUICK START - 3 STEPS

## 1️⃣ Setup Environment

### Backend `.env`
```bash
cd backend
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hutefast
JWT_SECRET=your_super_secret_key_at_least_32_characters_long_here
REFRESH_TOKEN_SECRET=another_secret_at_least_32_characters_long_here
MOMO_API_KEY=test
MOMO_API_SECRET=test
TWILIO_ACCOUNT_SID=test
TWILIO_AUTH_TOKEN=test
TWILIO_PHONE_NUMBER=+1234567890
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
ENCRYPTION_KEY=encryption_key_at_least_32_characters_long_here
FRONTEND_URL=http://localhost:3000
EOF
```

### Frontend `.env.local`
```bash
cd ../frontend
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=HuteFast
VITE_DEFAULT_LANGUAGE=en
EOF
```

## 2️⃣ Start Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
# ✓ Running on http://localhost:5000
```

## 3️⃣ Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# ✓ Running on http://localhost:3000
```

**Done!** Open: http://localhost:3000

---

## 📱 Test Features

- **Register:** New account
- **Login:** client@test.com / Test123456!
- **Book Trip:** Search and book transport
- **Admin:** /admin-login (admin@hutefast.com / Admin123!)
- **Map:** Live driver tracking
- **QR:** Scan tickets

---

## 🗄️ Database Setup (First Time Only)

### Option A: Local PostgreSQL
```bash
# Install Postgres
brew install postgresql  # macOS
# or
sudo apt-get install postgresql  # Ubuntu

# Start service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Ubuntu

# Create database
psql -U postgres -c "CREATE DATABASE hutefast;"
psql -U postgres -c "CREATE USER hutefast_user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hutefast TO hutefast_user;"

# Update backend/.env:
DB_HOST=localhost
DB_USER=hutefast_user
DB_PASSWORD=password
DB_NAME=hutefast
```

### Option B: Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Copy Connection String
4. Update backend/.env with connection details

---

## 🎯 What Works

| Feature | Status | Test |
|---------|--------|------|
| User Registration | ✅ Complete | Sign up |
| Authentication | ✅ Complete | Login |
| Bookings | ✅ Complete | Book a trip |
| Payments | ✅ Complete | MoMo sandbox |
| Admin Dashboard | ✅ Complete | /admin |
| QR Scanning | ✅ Complete | Driver page |
| Real-time Map | ✅ Complete | Live tracking |
| SMS Notifications | ✅ Ready | Configure Twilio |
| Email Notifications | ✅ Ready | Configure SMTP |
| Multi-language | ✅ Complete | Switch language |

---

## 📚 Full Documentation

- [README.md](./README.md) - Overview
- [SETUP_ROADMAP.md](./SETUP_ROADMAP.md) - Detailed setup
- [DEPLOYMENT_PRODUCTION_GUIDE.md](./DEPLOYMENT_PRODUCTION_GUIDE.md) - Deploy to production
- [PROJECT_COMPLETION.md](./PROJECT_COMPLETION.md) - What's included
- [FINAL_BUILD_SUMMARY.md](./FINAL_BUILD_SUMMARY.md) - Complete summary
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Full guide

---

## 🐛 Troubleshooting

**Port in use?**
```bash
lsof -i :5000  # Check port 5000
kill -9 <PID>
```

**Dependencies issue?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database won't connect?**
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

**Blank page?**
- Check browser console for errors
- Verify `VITE_API_URL` in `.env.local`
- Restart frontend dev server

---

## ✅ Success Checklist

- [ ] Backend running on :5000
- [ ] Frontend running on :3000
- [ ] Can access http://localhost:3000
- [ ] Can register user
- [ ] Can login
- [ ] Can see dashboard
- [ ] No console errors

---

## 🚀 Deploy to Production

When ready: Follow [DEPLOYMENT_PRODUCTION_GUIDE.md](./DEPLOYMENT_PRODUCTION_GUIDE.md)

**Quick steps:**
1. Build frontend: `npm run build`
2. Deploy to Vercel
3. Deploy backend to Render
4. Setup Supabase
5. Configure production env vars
6. Go live!

---

**Version:** 1.0.0 | **Status:** Ready 🎉