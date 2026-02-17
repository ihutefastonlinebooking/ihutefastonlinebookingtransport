# HuteFast - Smart Transport Booking Platform

A production-ready transport booking platform built with **Node.js/Express** (backend) and **React** (frontend). HuteFast provides a comprehensive solution for booking long-distance trips, short-distance city rides, and driver management across Rwanda.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Frontend](#frontend)
- [WebSocket Events](#websocket-events)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

### Core Features
- ✅ User Authentication (Email/password with JWT)
- ✅ Booking System (Search routes and book seats)
- ✅ Payment Integration (Mobile Money via MoMo API)
- ✅ Driver Management (Registration, profile, trip management)
- ✅ Real-time Tracking (GPS location with WebSocket)
- ✅ QR Code Tickets (Secure booking validation)
- ✅ SMS Notifications (Via Twilio)
- ✅ Email Notifications (Via Nodemailer)
- ✅ iHute Card (Virtual prepaid card system)
- ✅ Admin Panel (Company management)
- ✅ Audit Logging (Activity tracking)
- ✅ Internationalization (English & French)

---

## Tech Stack

### Backend
- Node.js 18+, Express.js 4.x
- PostgreSQL 14+, Socket.io 4.x
- JWT Authentication, bcryptjs
- Joi Validation, MoMo API
- Twilio SMS, Nodemailer Email
- PDFKit, QR Code Generation

### Frontend
- React 18.x, Vite 5.x
- React Router 6.x, Zustand
- Axios, Socket.io Client
- Tailwind CSS 3.x, i18next
- Leaflet Maps, PDFKit

---

## Getting Started

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your database and API credentials
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure .env with API URLs
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=hutefast
JWT_SECRET=your_secret_key
MOMO_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
EMAIL_USER=your_email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_WEBSOCKET_URL=http://localhost:5000
VITE_APP_NAME=HuteFast
VITE_DEFAULT_LANGUAGE=en
```

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth & error handling
│   │   ├── services/         # External integrations
│   │   ├── utils/            # Utilities
│   │   ├── db/              # Database
│   │   └── websocket/       # Real-time
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand stores
│   │   ├── hooks/          # Custom hooks
│   │   ├── locales/        # i18n translations
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Bookings
- `POST /api/v1/bookings/search` - Search routes
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings` - Get user bookings
- `DELETE /api/v1/bookings/:id` - Cancel booking

### Payments
- `POST /api/v1/payments/initiate` - Start payment
- `POST /api/v1/payments/verify` - Verify payment
- `GET /api/v1/payments` - Payment history

### Drivers
- `POST /api/v1/drivers/register` - Register as driver
- `GET /api/v1/drivers/profile` - Driver profile
- `POST /api/v1/drivers/location` - Share location

---

## Development Scripts

### Backend
```bash
npm run dev      # Start dev server
npm start        # Start production
npm test         # Run tests
npm run lint     # Lint code
```

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview build
npm run lint     # Lint code
npm run format   # Format code
```

---

## License

MIT License - see LICENSE file for details

---

## Support

Email: support@hutefast.com

**HuteFast** - Making transport booking smart and accessible for Rwanda.