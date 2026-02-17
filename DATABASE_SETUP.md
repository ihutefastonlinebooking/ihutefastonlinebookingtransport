# Database Setup Guide - HuteFast Backend

Complete guide to set up, initialize, and manage the PostgreSQL database for HuteFast.

---

## 🎯 Quick Start (5 minutes)

### **Local Development Setup**

#### **1. Install PostgreSQL**

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
Download from https://www.postgresql.org/download/windows/

#### **2. Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the HuteFast database
CREATE DATABASE hutefast;

# Verify
\l

# Exit
\q
```

#### **3. Initialize Schema**

```bash
# Run the schema file
psql -U postgres -d hutefast -f backend/src/db/schema.sql

# Verify tables
psql -U postgres -d hutefast -c "\dt"
```

✅ **Database ready!**

---

## 📝 Database Structure

**10 Main Tables:**

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | Customers, drivers, admins | ~10K |
| `companies` | Transport operators | ~50 |
| `routes` | Trip routes (Kigali→Kibuye) | ~200 |
| `vehicles` | Buses, minibuses | ~500 |
| `drivers` | Professional drivers | ~300 |
| `bookings` | Customer reservations | ~100K |
| `payments` | Payment transactions | ~100K |
| `qr_codes` | QR boarding tickets | ~100K |
| `driver_locations` | GPS tracking | ~1M (real-time) |
| `audit_logs` | System activity logs | ~500K |

---

## 🔗 Connection Strings

### **Local Development**

Create `.env` in `/backend`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hutefast
```

### **Production (Railway)**

Railway automatically provides:
```
DATABASE_URL=postgresql://user:password@railway.app:5432/hutefast
```

Just use it in your `.env`

### **Alternative Providers**

**Render:**
```
DATABASE_URL=postgresql://user:password@dpg-xxx.render.com:5432/hutefast
```

**Vercel Postgres (if using):**
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.postgres.vercel-storage.com/hutefast
```

---

## 🖥️ Connecting Backend to Database

### **File: `/backend/src/config/index.js`**

Add database configuration:

```javascript
require('dotenv').config();

module.exports = {
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hutefast',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Other configs...
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
};
```

### **File: `/backend/src/db/connection.js`**

Update connection setup:

```javascript
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

module.exports = pool;
```

### **File: `/backend/src/server.js`**

Initialize database on startup:

```javascript
const express = require('express');
const pool = require('./db/connection');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connected at', result.rows[0].now);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  }
});

module.exports = app;
```

---

## 🚀 Deployment Database Setup

### **Railway (Recommended)**

**Step 1: Create PostgreSQL Database**
- Go to https://railway.app
- Create new project
- Add PostgreSQL service
- Railway auto-creates database

**Step 2: Get Connection String**
```
Variables tab → DATABASE_URL (copy)
```

**Step 3: Run Migrations**
```bash
# In Railway CLI
railway run npm run migrate

# Or manually connect
psql $DATABASE_URL < backend/src/db/schema.sql
```

**Step 4: Deploy Backend**
```bash
railway up
```

### **Render**

**Step 1: Create PostgreSQL**
- Go to https://render.com
- Create new PostgreSQL database
- Copy connection string

**Step 2: Add Environment Variable**
```
DATABASE_URL=postgresql://...
```

**Step 3: Deploy**
- Connect GitHub repo
- Auto-deploys on push

### **AWS RDS**

**Step 1: Create RDS Instance**
- Go to AWS RDS console
- Create PostgreSQL instance (14+)
- Security groups: Allow port 5432 from backend

**Step 2: Get Endpoint**
```
DATABASE_URL=postgresql://admin:password@hutefast.xxxxx.us-east-1.rds.amazonaws.com:5432/hutefast
```

**Step 3: Connect & Initialize**
```bash
psql -h hutefast.xxxxx.us-east-1.rds.amazonaws.com -U admin -d hutefast < schema.sql
```

---

## 📊 Database Queries Reference

### **Query Users**

```sql
-- All users
SELECT * FROM users;

-- Customers only
SELECT * FROM users WHERE user_type = 'customer';

-- Drivers with company
SELECT u.*, d.license_number, c.name as company_name
FROM users u
LEFT JOIN drivers d ON u.id = d.user_id
LEFT JOIN companies c ON d.company_id = c.id;
```

### **Booking Analytics**

```sql
-- Total bookings by company
SELECT c.name, COUNT(b.id) as total_bookings
FROM companies c
LEFT JOIN routes r ON c.id = r.company_id
LEFT JOIN bookings b ON r.id = b.route_id
GROUP BY c.id, c.name;

-- Revenue by payment method
SELECT payment_method, SUM(amount) as total
FROM payments
WHERE status = 'completed'
GROUP BY payment_method;

-- Bookings in last 7 days
SELECT COUNT(*) as bookings_this_week
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### **Driver Statistics**

```sql
-- Active drivers with vehicle info
SELECT 
  d.id,
  u.first_name,
  u.last_name,
  v.registration_plate,
  d.status,
  COUNT(b.id) as completed_trips
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN vehicles v ON d.vehicle_id = v.id
LEFT JOIN bookings b ON d.id = b.driver_id AND b.status = 'completed'
WHERE d.status = 'online'
GROUP BY d.id, u.first_name, u.last_name, v.registration_plate, d.status;
```

---

## 🔍 Monitoring & Maintenance

### **Check Database Size**

```bash
psql -U postgres -d hutefast -c "SELECT pg_size_pretty(pg_database_size('hutefast'));"
```

### **List Connection Count**

```bash
psql -U postgres -d hutefast -c "SELECT count(*) FROM pg_stat_activity;"
```

### **Monitor Slow Queries**

Enable logging in `/etc/postgresql/14/main/postgresql.conf`:

```
log_min_duration_statement = 1000  # Log queries > 1 second
```

Then check logs:
```bash
tail -f /var/log/postgresql/postgresql-14-main.log
```

### **Backup Database**

```bash
# Full backup
pg_dump -U postgres -d hutefast > hutefast_backup.sql

# Backup with compression
pg_dump -U postgres -d hutefast -Fc > hutefast_backup.dump

# Scheduled backup (add to crontab)
0 2 * * * pg_dump -U postgres -d hutefast > /backups/hutefast_$(date +\%Y\%m\%d).sql
```

### **Restore Database**

```bash
# From SQL file
psql -U postgres -d hutefast < hutefast_backup.sql

# From dump file
pg_restore -U postgres -d hutefast hutefast_backup.dump
```

---

## 🗑️ Clean Up Old Data

### **Delete Expired Bookings**

```sql
DELETE FROM bookings 
WHERE expiry_at < NOW() AND status = 'pending';
```

### **Archive Old Audit Logs**

```sql
-- Delete logs older than 1 year
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete location history older than 1 month (for performance)
DELETE FROM driver_locations 
WHERE timestamp < NOW() - INTERVAL '1 month';
```

### **Vacuum Database** (optimize storage)

```bash
psql -U postgres -d hutefast -c "VACUUM FULL;"
```

---

## 🔐 Security Checklist

- [ ] Use strong database password
- [ ] Enable SSL for production database
- [ ] Restrict database access to backend server IP only
- [ ] Use environment variables for credentials (never in code)
- [ ] Enable database backups (daily)
- [ ] Set connection timeouts
- [ ] Use read-only user for analytics
- [ ] Enable audit logging
- [ ] Monitor connection limits
- [ ] Disable unnecessary PostgreSQL extensions

---

## 🐛 Troubleshooting

### **Connection Refused**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check port 5432 is listening
netstat -tuln | grep 5432
```

### **Authentication Failed**

```bash
# Try different password
psql -U postgres -h localhost -d hutefast

# Reset postgres password
sudo -u postgres psql
postgres=# ALTER USER postgres PASSWORD 'newpassword';
```

### **Database Locked**

```bash
# Find active connections
SELECT pid, usename, application_name, state FROM pg_stat_activity;

-- Kill blocking connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = 'app';
```

### **Disk Space Full**

```bash
# Check disk usage
df -h

# Clean up old backups
rm /backups/hutefast_backup_*.sql

# Vacuum to reclaim space
VACUUM FULL;
```

---

## ✅ Verification Checklist

After setup, verify:

```bash
# ✅ Connect to database
psql -U postgres -d hutefast

# ✅ List tables
\dt

# ✅ Count records
SELECT COUNT(*) FROM users;

# ✅ Test insert
INSERT INTO users (email, password_hash, first_name, last_name, user_type) 
VALUES ('test@hutefast.com', 'hash', 'Test', 'User', 'customer');

# ✅ Verify backend connection
npm start  # Should show "✅ Database connected at ..."
```

---

## 📞 Support

- **PostgreSQL Docs:** https://www.postgresql.org/docs/14/
- **Railway Docs:** https://docs.railway.app/
- **Render Docs:** https://render.com/docs/
- **AWS RDS:** https://docs.aws.amazon.com/rds/

---

**Database setup complete! Your HuteFast platform is ready for data.**
