# Complete HuteFast Database Setup & Deployment Guide

This guide covers everything from local development to production deployment with database configuration.

---

## 🎯 Quick Reference

| Phase | Task | Status |
|-------|------|--------|
| **Setup** | Install PostgreSQL | ✅ Guide provided |
| **Local Dev** | Create database locally | ✅ Skip if using Render/Railway |
| **Schema** | Initialize tables | ✅ schema.sql ready |
| **Config** | Backend database connection | ✅ Instructions below |
| **Testing** | Verify connection | ✅ Test commands provided |
| **Production** | Deploy to Railway/Render | ✅ Step-by-step included |

---

## 📱 Part 1: Local Development

### **Prerequisites**

- Node.js 16+ (already have it)
- PostgreSQL 14+ (15 GB free disk for dev data)
- npm packages installed in backend folder

**Install PostgreSQL (Choose Your OS):**

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
```bash
# Download and run installer
# https://www.postgresql.org/download/windows/
# Remember your postgres password!
```

### **Step 1: Create Local Database**

```bash
# Connect to PostgreSQL as default user
psql -U postgres

# Create the database
CREATE DATABASE hutefast;

# Verify it was created
\l

# Exit
\q
```

### **Step 2: Initialize Schema**

```bash
# From the repository root
psql -U postgres -d hutefast -f backend/src/db/schema.sql

# Verify tables were created
psql -U postgres -d hutefast -c "\dt"

# You should see these 10 tables:
# audit_logs           | table
# bookings             | table
# companies            | table
# driver_locations     | table
# drivers              | table
# payments             | table
# qr_codes             | table
# routes               | table
# users                | table
# vehicles             | table
```

### **Step 3: Configure Backend Environment**

Create `/backend/.env`:

```env
NODE_ENV=development
PORT=5000

# Database - Choose ONE option:

# Option A (Recommended): Single connection URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hutefast

# Option B: Individual parameters (if Option A doesn't work)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hutefast

# Rest of config...
JWT_SECRET=dev_secret_key_12345
JWT_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
MOMO_API_KEY=test_key
```

### **Step 4: Install Dependencies**

```bash
cd backend
npm install

# If any errors, try:
npm install --legacy-peer-deps
```

### **Step 5: Start Backend Server**

```bash
# From /backend directory
npm run dev

# Expected output:
# ✓ Database initialized
# ✓ HuteFast Backend running on port 5000
# ✓ Environment: development
```

✅ **Backend is now connected to local database!**

### **Step 6: Verify Database Connection**

From another terminal:

```bash
# Test API is working
curl http://localhost:5000/health
# Expected: {"status":"OK","timestamp":"2024-01-15T..."}

# Test database is populated
psql -U postgres -d hutefast -c "SELECT COUNT(*) FROM users;"
```

---

## 🚀 Part 2: Production Deployment (Railway)

### **Recommended: Use Railway**

Railway is easiest - they handle database for you.

#### **Step 1: Create Railway Account**

1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Create new project

#### **Step 2: Add PostgreSQL Database**

1. Click "+ Add Service"
2. Select "PostgreSQL"
3. Railway creates database automatically
4. Go to "Variables" tab
5. Copy the `DATABASE_URL` value (looks like: `postgresql://user:password@railway.app:...`)

#### **Step 3: Add Backend Service**

1. Click "+ Add Service"
2. Select "GitHub Repo" (connect your HuteFast repo)
3. Select branch: `main`
4. In "Service" tab set Start Command:
   ```bash
   npm run start
   ```

#### **Step 4: Configure Environment Variables**

In Railway console, add these variables:

```env
NODE_ENV=production
PORT=5000

# Automatically provided by Railway:
DATABASE_URL=postgresql://... (auto-filled from PostgreSQL service)

# Add your keys:
JWT_SECRET=your_production_jwt_secret_32_chars_min
FRONTEND_URL=https://yourdomain.com
MOMO_API_KEY=production_momo_key
MOMO_API_SECRET=production_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+your_number
EMAIL_SERVICE=gmail
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_app_password
```

#### **Step 5: Deploy**

```bash
# From your local machine, push to main branch
git add .
git commit -m "Final deployment"
git push origin main

# Railway auto-deploys
# Check Railway dashboard for logs
```

#### **Step 6: Get Backend URL**

In Railway dashboard:
1. Select "Backend" service
2. Click "Settings"
3. Find "Public Domain" (e.g., `hutefast-backend.railway.app`)
4. Backend is live at: `https://hutefast-backend.railway.app`

✅ **Database & backend deployed!**

---

## 🌐 Part 3: Connect Frontend to Production Backend

In `/frontend/.env.production`:

```env
VITE_API_URL=https://hutefast-backend.railway.app/api/v1
VITE_WS_URL=wss://hutefast-backend.railway.app
VITE_ENV=production
```

Deploy frontend to Vercel (as before).

---

## 📊 Part 4: Database Management

### **Connect to Production Database from Local Machine**

```bash
# Get DATABASE_URL from Railway (from Part 2 Step 2)
# Format: postgresql://username:password@host:port/database

# Connect directly
psql postgresql://username:password@railway.app:5432/hutefast

# Or use environment variable
export DATABASE_URL="postgresql://..."
psql $DATABASE_URL
```

### **Common Database Operations**

**View all bookings:**
```sql
SELECT id, booking_reference, status, created_at FROM bookings LIMIT 10;
```

**View all users:**
```sql
SELECT id, email, user_type, created_at FROM users;
```

**Check payment transactions:**
```sql
SELECT amount, status, payment_method, created_at FROM payments ORDER BY created_at DESC LIMIT 20;
```

**Get route statistics:**
```sql
SELECT origin_city, destination_city, price_per_seat, COUNT(*) as bookings 
FROM bookings b
JOIN routes r ON b.route_id = r.id
GROUP BY r.id, origin_city, destination_city, price_per_seat
ORDER BY bookings DESC;
```

### **Manage Data**

**Backup production database:**
```bash
pg_dump $DATABASE_URL > hutefast_backup_$(date +%Y%m%d_%H%M%S).sql
# Creates local backup file
```

**Delete old audit logs (cleanup):**
```sql
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

**Monitor database size:**
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## 🔧 Part 5: Backend API Configuration

The backend automatically uses DATABASE_URL if available, otherwise falls back to individual DB_* variables.

**How the connection works:**

```javascript
// In backend/src/config/index.js
database: {
  url: process.env.DATABASE_URL || 
       `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}

// In backend/src/db/connection.js
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl,
  max: 20,  // Connection pool size
});
```

**Test connection programmatically:**

```bash
cd backend
node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  pool.query('SELECT NOW()', (err, res) => {
    if (err) console.error('❌ Connection failed:', err);
    else console.log('✅ Connected! Time:', res.rows[0].now);
    process.exit();
  });
"
```

---

## 🆘 Part 6: Troubleshooting

### **"psql: could not connect to server"**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or restart it
sudo systemctl restart postgresql

# Check port is listening
netstat -tuln | grep 5432
```

### **"password authentication failed"**

```bash
# Reset postgres password
sudo -u postgres psql
postgres=# ALTER USER postgres PASSWORD 'newpassword';
postgres=# \q

# Reconnect with new password
psql -U postgres -d hutefast
```

### **"relation users does not exist"**

```bash
# Schema not initialized, run:
psql -U postgres -d hutefast -f backend/src/db/schema.sql
```

### **"too many connections"**

```sql
-- In psql:
SELECT pid, usename, application_name FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '1 hour';
```

### **Backend shows "Database URL not configured"**

Ensure `.env` has either:
```env
DATABASE_URL=postgresql://... 
```
OR
```env
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

### **Connection pool exhausted**

Increase pool size in `/backend/src/config/index.js`:
```javascript
database: {
  max: 50  // Increase from 20 to 50
}
```

---

## ✅ Verification Checklist

Before going live, verify all these:

- [ ] Local database created: `psql -d hutefast -c "\dt"` shows 10 tables
- [ ] Schema initialized: Seed data visible with `SELECT COUNT(*) FROM users;`
- [ ] Backend `.env` configured with correct DATABASE_URL
- [ ] Backend starts without errors: `npm run dev`
- [ ] API responds: `curl http://localhost:5000/health` returns `{"status":"OK"}`
- [ ] Database query works: Backend can read/write to database
- [ ] Production credentials set in Railway
- [ ] Frontend `.env.production` points to production backend URL
- [ ] Production backend URL is accessible
- [ ] Production database created and schema initialized (Railway does this auto)
- [ ] Backup created: `pg_dump` successful

---

## 📞 Next Steps

1. **Create admin account** (manually in production DB):
   ```sql
   INSERT INTO users (email, password_hash, first_name, last_name, user_type, email_verified)
   VALUES ('admin@hutefast.com', '$2b$10$hash_here', 'Admin', 'User', 'super_admin', true);
   ```

2. **Add test company**:
   ```sql
   INSERT INTO companies (admin_user_id, name, registration_number, phone, email)
   SELECT id, 'HuteFast Express', 'HF-001', '+250788000000', 'info@hutefast.com'
   FROM users WHERE email = 'admin@hutefast.com';
   ```

3. **Add test routes**:
   ```sql
   INSERT INTO routes (company_id, origin_city, destination_city, departure_time, price_per_seat)
   SELECT id, 'Kigali', 'Kibuye', '08:00:00', 5000 FROM companies WHERE name = 'HuteFast Express';
   ```

4. **Test booking flow end-to-end**

5. **Monitor in dashboard**: Railway/Render logs for any issues

---

## 🎉 You're Ready!

Your HuteFast platform now has:
- ✅ Local development database
- ✅ Production database on Railway
- ✅ Backend connected and running
- ✅ Frontend deployed to Vercel
- ✅ Real images in carousel
- ✅ Complete navigation with language switching

**Customers can now:**
- 🚌 Book trips
- 💳 Pay via MoMo
- 📱 Get QR tickets
- 📍 Track driver
- 👨‍💼 Admin dashboard

---

## 📖 Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema details
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database maintenance & queries
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment walkthrough
- [backend/src/db/schema.sql](./backend/src/db/schema.sql) - SQL schema file

---

**Need help? Check troubleshooting section above. Platform is production-ready! 🚀**
