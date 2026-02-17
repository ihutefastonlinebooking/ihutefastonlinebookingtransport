# HuteFast Database Schema & Setup

**Database:** PostgreSQL 14+  
**Status:** Complete production schema

---

## 🗄️ Database Overview

All data for the HuteFast platform is stored in PostgreSQL. The database holds:
- Users (customers, drivers, admins)
- Routes & trips
- Vehicles & drivers
- Bookings & payments
- QR codes & tickets
- Real-time tracking

---

## 📊 Complete Schema

### **1. USERS Table**
Stores all user accounts (customers, drivers, admins)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  user_type VARCHAR(50) NOT NULL, -- 'customer', 'driver', 'admin'
  is_verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
```

### **2. COMPANIES Table**
Transport companies/operators

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  logo_url TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **3. ROUTES Table**
Trip routes (e.g., Kigali → Musanze)

```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  origin_city VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  duration_hours DECIMAL(5, 2),
  distance_km DECIMAL(10, 2),
  price_per_seat DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  route_type VARCHAR(50), -- 'long_distance', 'city', 'shuttle'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_company ON routes(company_id);
CREATE INDEX idx_routes_cities ON routes(origin_city, destination_city);
```

### **4. VEHICLES Table**
Buses, minibuses, taxis used for transport

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  registration_plate VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50), -- 'bus', 'minibus', 'van'
  seats_capacity INT NOT NULL,
  manufacture_year INT,
  last_inspection_date DATE,
  gps_enabled BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'maintenance', 'retired'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_company ON vehicles(company_id);
```

### **5. DRIVERS Table**
Professional drivers

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  license_number VARCHAR(100) UNIQUE,
  license_expiry_date DATE,
  vehicle_id UUID REFERENCES vehicles(id),
  experience_years INT,
  rating DECIMAL(3, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'offline', -- 'online', 'offline', 'on_trip'
  current_lat DECIMAL(10, 7),
  current_lng DECIMAL(10, 7),
  last_location_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_user ON drivers(user_id);
CREATE INDEX idx_drivers_company ON drivers(company_id);
```

### **6. BOOKINGS Table**
Customer trip bookings

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  number_of_seats INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'boarded', 'completed', 'cancelled'
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  departure_date DATE NOT NULL,
  passenger_names JSONB, -- Array of passenger names
  passenger_contacts JSONB, -- Array of phone numbers
  qr_code_id UUID,
  notes TEXT,
  expiry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_route ON bookings(route_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
```

### **7. PAYMENTS Table**
Payment records

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RWF',
  payment_method VARCHAR(50), -- 'momo', 'card', 'bank_transfer'
  payment_provider VARCHAR(100), -- 'mtn_momo', 'airtel_money'
  provider_transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  reference_number VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### **8. QR_CODES Table**
QR code tickets

```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  qr_code_value VARCHAR(500) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'used', 'expired', 'cancelled'
  scanned_at TIMESTAMP,
  scanned_by_driver_id UUID REFERENCES drivers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_qr_codes_booking ON qr_codes(booking_id);
CREATE INDEX idx_qr_codes_value ON qr_codes(qr_code_value);
```

### **9. DRIVER_LOCATIONS Table**
Real-time driver GPS tracking

```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  trip_id UUID,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  speed DECIMAL(5, 2),
  heading INT,
  accuracy INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_driver_locations_driver ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_timestamp ON driver_locations(timestamp);
```

### **10. AUDIT_LOGS Table**
System activity tracking

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

## 🚀 Setup Instructions

### **Step 1: Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE hutefast;

# Connect to the new database
\c hutefast
```

### **Step 2: Run Schema (Copy All SQL Above)**

```bash
# Option A: Run SQL file
psql -U postgres -d hutefast -f schema.sql

# Option B: Paste SQL in psql
psql -U postgres -d hutefast
# Copy/paste all CREATE TABLE statements
```

### **Step 3: Verify Tables**

```bash
psql -U postgres -d hutefast

# List all tables
\dt

# Show table structure
\d users
```

### **Step 4: Set Connection String**

For your backend `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hutefast
```

For Railway/Render:
- They provide `DATABASE_URL` automatically
- Just use it in your backend

---

## 📝 Initial Data (Seed)

After tables are created, add sample data:

```sql
-- Insert test company
INSERT INTO companies (name, phone, email, city)
VALUES ('HuteFast Express', '+250788000000', 'info@hutefast.com', 'Kigali');

-- Insert test user (admin)
INSERT INTO users (email, password_hash, first_name, last_name, user_type)
VALUES ('admin@hutefast.com', '$2b$10$...', 'Admin', 'User', 'admin');

-- Insert test route
INSERT INTO routes (company_id, origin_city, destination_city, departure_time, price_per_seat, route_type)
SELECT id, 'Kigali', 'Kibuye', '08:00:00', 5000, 'long_distance'
FROM companies WHERE name = 'HuteFast Express';
```

---

## 🔧 Maintenance

### **Regular Backups**

```bash
# Backup database
pg_dump -U postgres -d hutefast > hutefast_backup.sql

# Restore from backup
psql -U postgres -d hutefast < hutefast_backup.sql
```

### **Monitor Database Size**

```bash
# Connect to DB
psql -U postgres -d hutefast

# Check size
SELECT pg_size_pretty(pg_database_size('hutefast'));
```

### **Clean Up Old Records**

```sql
-- Delete bookings older than 1 year
DELETE FROM bookings WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'completed';

-- Delete logs older than 6 months
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '6 months';
```

---

## 🔐 Security Notes

✅ **Do:**
- Use strong database password
- Enable SSL on production database
- Regular backups (Railway/Render do this automatically)
- Use environment variables for credentials
- Restrict database access to backend server only

❌ **Don't:**
- Commit `.env` with database password
- Expose database URL in frontend
- Use same password for all databases
- Store plaintext passwords (hash with bcrypt)

---

## 📱 Accessing the Database

### **Local Development**

```bash
psql -U postgres -d hutefast

# Common commands
\dt              # List tables
\d users         # Show table structure
SELECT * FROM users;  # Query data
```

### **Railway/Render**

After creating database, providers give you:
```
postgresql://user:password@host:port/database
```

Use with any PostgreSQL client:
- DBeaver (GUI)
- pgAdmin
- psql command line
- Backend connection string

---

## ✅ Database Ready!

Your database schema is complete and ready for production.

**Next Steps:**
1. Deploy backend to Railway/Render
2. They auto-create the database
3. Connection string is provided
4. Run migrations/seed data
5. Backend connects automatically

**Contact Support:** If database issues, check Railway/Render logs
