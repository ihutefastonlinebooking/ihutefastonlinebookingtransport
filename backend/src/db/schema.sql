-- HuteFast Database Schema
-- PostgreSQL 14+
-- Run this file to initialize the database

-- Drop tables if they exist (for fresh install)
-- Uncomment the following lines ONLY for development/testing
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS driver_locations CASCADE;
-- DROP TABLE IF EXISTS qr_codes CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS drivers CASCADE;
-- DROP TABLE IF EXISTS vehicles CASCADE;
-- DROP TABLE IF EXISTS routes CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  user_type VARCHAR(50) NOT NULL DEFAULT 'customer', -- 'customer', 'driver', 'admin'
  is_verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
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

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- ============================================================================
-- ROUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_routes_company ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_cities ON routes(origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_number VARCHAR(100) UNIQUE,
  license_expiry_date DATE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  experience_years INT,
  rating DECIMAL(3, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'offline', -- 'online', 'offline', 'on_trip'
  current_lat DECIMAL(10, 7),
  current_lng DECIMAL(10, 7),
  last_location_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_departure_date ON bookings(departure_date);

-- ============================================================================
-- BOOKING_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  origin_city VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  number_of_passengers INT NOT NULL DEFAULT 1,
  vehicle_type VARCHAR(50), -- 'bus', 'minibus', 'van', 'car'
  special_requirements TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'contacted', 'confirmed', 'cancelled'
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_requests_email ON booking_requests(email);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ============================================================================
-- QR_CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  qr_code_value VARCHAR(500) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'used', 'expired', 'cancelled'
  scanned_at TIMESTAMP,
  scanned_by_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_booking ON qr_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_value ON qr_codes(qr_code_value);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);

-- ============================================================================
-- DRIVER_LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  trip_id UUID,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  speed DECIMAL(5, 2),
  heading INT,
  accuracy INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100),
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- SEED DATA (OPTIONAL - Comment out if not needed)
-- ============================================================================

-- Insert test company
INSERT INTO companies (name, registration_number, phone, email, city, status)
VALUES ('HuteFast Express', 'HF-001', '+250788000000', 'info@hutefast.com', 'Kigali', 'active')
ON CONFLICT (registration_number) DO NOTHING;

-- Insert test admin user
INSERT INTO users (email, password_hash, first_name, last_name, user_type, is_verified)
VALUES ('admin@hutefast.com', '$2b$10$7J5.7R8z8P2T1K9x5M3z8e5K9z1L5N2X3Q7a9D2H5B8C1F4G7J9M2P5', 'Admin', 'User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert test customer user
INSERT INTO users (email, password_hash, first_name, last_name, user_type, is_verified)
VALUES ('customer@hutefast.com', '$2b$10$7J5.7R8z8P2T1K9x5M3z8e5K9z1L5N2X3Q7a9D2H5B8C1F4G7J9M2P5', 'John', 'Doe', 'customer', true)
ON CONFLICT (email) DO NOTHING;

-- Insert test routes
INSERT INTO routes (company_id, origin_city, destination_city, departure_time, arrival_time, duration_hours, distance_km, price_per_seat, route_type, status)
SELECT 
  c.id,
  'Kigali',
  'Kibuye',
  '08:00:00'::TIME,
  '10:30:00'::TIME,
  2.5,
  120,
  5000,
  'long_distance',
  'active'
FROM companies c WHERE c.name = 'HuteFast Express'
ON CONFLICT DO NOTHING;

INSERT INTO routes (company_id, origin_city, destination_city, departure_time, arrival_time, duration_hours, distance_km, price_per_seat, route_type, status)
SELECT 
  c.id,
  'Kigali',
  'Ruhengeri',
  '09:00:00'::TIME,
  '12:00:00'::TIME,
  3,
  140,
  6000,
  'long_distance',
  'active'
FROM companies c WHERE c.name = 'HuteFast Express'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCHEMA INITIALIZATION COMPLETE
-- ============================================================================
-- All tables created with proper indexes and relationships
-- Seed data added for testing
-- Ready for production use
