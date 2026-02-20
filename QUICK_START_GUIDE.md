# EHUT Booking Platform - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14 (or Supabase account)
- Git

### Step 1: Clone & Install

```bash
cd /workspaces/ihutefastonlinebookingtransport

# Backend setup
cd backend
npm install

# Frontend setup
cd frontend
npm install
```

### Step 2: Environment Configuration

**Backend - Create `backend/.env`**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/hutefast
JWT_SECRET=your-secret-key-12345
FRONTEND_URL=http://localhost:5173
```

**Frontend - Create `frontend/.env.local`**
```env
VITE_API_URL=http://localhost:5000
```

### Step 3: Start Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Step 4: Access the Platform

- **Homepage:** http://localhost:5173
- **Booking Flow:** http://localhost:5173/book-flow
- **Admin Login:** http://localhost:5173/admin/login

---

## 📍 What to Test

### 1. Homepage (5 min)
```
✓ Load http://localhost:5173
✓ Verify carousel displays
✓ Click navigation arrows
✓ Click dot indicators
✓ Hover to see controls
✓ Check mobile responsive layout (F12)
```

### 2. Booking Flow (10 min)
```
✓ Click "Book Now" button
✓ Step 1: Search for routes
  - Enter: Kigali → Musanze
  - Click Search
  - See available routes
✓ Step 2: Select departure date
✓ Step 3: Select time and seats
✓ Step 4: Enter customer details
✓ Step 5: Review and confirm
✓ See QR code generated
```

### 3. Admin Dashboard (5 min)
```
✓ Access http://localhost:5173/admin/login
✓ Use default admin credentials (check backend seed data)
✓ View bookings list
✓ Test status update dropdown
✓ View payment status
```

---

## 🛠️ Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection error
```bash
# Check PostgreSQL is running
psql -U postgres

# Check DATABASE_URL in .env
# Format: postgresql://user:password@host:port/database
```

### API errors in console
```bash
# Check VITE_API_URL matches backend port
# Default: VITE_API_URL=http://localhost:5000
```

### Database not found
```bash
# Create database
createdb hutefast

# Run migrations (if not auto-run)
psql -U postgres -d hutefast -f backend/src/db/schema.sql
```

---

## 📁 Project Structure Overview

```
EHUT Booking Platform/
├── frontend/                 ← React application
│   ├── src/
│   │   ├── pages/           ← HomePage, BookingFlow, AdminDashboard
│   │   ├── components/      ← Carousel, Button, Card, etc.
│   │   ├── services/        ← API configuration
│   │   └── utils/           ← Utilities
│   └── package.json
├── backend/                  ← Express.js API
│   ├── src/
│   │   ├── controllers/     ← Business logic
│   │   ├── routes/          ← API endpoints
│   │   ├── middleware/      ← Auth, errors, etc.
│   │   ├── db/              ← Database schema
│   │   └── services/        ← Email, QR, etc.
│   └── package.json
└── Documentation/
    ├── FINAL_IMPLEMENTATION_SUMMARY.md
    ├── IMPLEMENTATION_STATUS.md
    └── validate-implementation.sh
```

---

## 🔑 Key Features Implemented

### ✅ Homepage
- **Carousel Slider** with auto-play, manual navigation, and responsive design

### ✅ Booking System
- **5-Step Flow**: Service → Date → Time → Details → Confirm
- **Validation**: All inputs validated with helpful error messages
- **Double-Booking Prevention**: System prevents overbooking seats
- **QR Code**: Auto-generated for each booking

### ✅ Admin Features
- **Authentication**: Secure login system
- **Booking Management**: View, update, and manage all bookings
- **Status Updates**: Change booking and payment status with one click
- **Search & Filter**: Find bookings by status, date, customer

### ✅ Backend
- **RESTful APIs** with proper error handling
- **Database** with proper schema and indexes
- **Audit Logging** for all transactions
- **Email Notifications** on booking confirmation

---

## 📊 API Endpoints

### Booking Endpoints
```
GET  /api/v1/bookings/search?origin=X&destination=Y
POST /api/v1/bookings
GET  /api/v1/bookings
GET  /api/v1/bookings/:bookingId
DELETE /api/v1/bookings/:bookingId
```

### Admin Endpoints
```
GET    /api/v1/bookings/admin/all
PUT    /api/v1/bookings/:bookingId/status
PUT    /api/v1/bookings/:bookingId/payment-status
PUT    /api/v1/bookings/:bookingId
DELETE /api/v1/bookings/:bookingId/admin
```

See `IMPLEMENTATION_STATUS.md` for full endpoint documentation.

---

## 🎯 Common Tasks

### Test Booking Creation
1. Register at `/register`
2. Login at `/login`
3. Go to `/book-flow`
4. Follow all 5 steps
5. See booking confirmation with QR code

### Test Admin Functions
1. Login at `/admin/login`
2. View all bookings
3. Click status dropdown
4. Select new status
5. See update confirmed

### Check Database
```bash
psql -U postgres -d hutefast

# View bookings
SELECT * FROM bookings;

# View users
SELECT * FROM users;

# View audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC;
```

---

## 📞 Need Help?

### Check Logs
- **Frontend**: Open browser DevTools (F12)
- **Backend**: Check terminal where npm run dev is running
- **Database**: Check PostgreSQL logs

### Read Documentation
- Quick overview: [FINAL_IMPLEMENTATION_SUMMARY.md](./FINAL_IMPLEMENTATION_SUMMARY.md)
- Detailed guide: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- Validation: Run `./validate-implementation.sh`

### Common Issues & Fixes
See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md#known-issues--fixes)

---

## Next Steps

1. **Start the servers** (see Step 3 above)
2. **Test the booking flow** (see What to Test)
3. **Explore the code** and watch the system in action
4. **Review documentation** for API details
5. **Plan next features** (payments, real-time sync, etc.)

---

**Happy booking! 🚀**

For technical details, see [FINAL_IMPLEMENTATION_SUMMARY.md](./FINAL_IMPLEMENTATION_SUMMARY.md)
