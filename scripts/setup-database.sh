#!/bin/bash

# HuteFast Database Setup Script
# Automates local PostgreSQL database initialization

set -e

#Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 HuteFast Database Setup${NC}"
echo "================================"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@14"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL found${NC}"

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo -e "${YELLOW}📌 PostgreSQL is not running, attempting to start...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@14 || true
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql || true
    fi
    
    sleep 2
    
    if ! pg_isready > /dev/null 2>&1; then
        echo -e "${RED}❌ Could not start PostgreSQL${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Create database
echo -e "${YELLOW}📦 Creating database 'hutefast'...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'hutefast'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE hutefast"
echo -e "${GREEN}✓ Database created${NC}"

# Initialize schema
echo -e "${YELLOW}📋 Initializing database schema...${NC}"

SCHEMA_FILE="backend/src/db/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

psql -U postgres -d hutefast -f "$SCHEMA_FILE"
echo -e "${GREEN}✓ Schema initialized${NC}"

# Verify tables
echo -e "${YELLOW}🔍 Verifying tables...${NC}"
TABLE_COUNT=$(psql -U postgres -d hutefast -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Database has $TABLE_COUNT tables${NC}"
else
    echo -e "${RED}❌ No tables found in database${NC}"
    exit 1
fi

# Create or update .env
echo -e "${YELLOW}📝 Creating .env file...${NC}"

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hutefast

# JWT
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=dev_refresh_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# Payment & Services (optional for local dev)
MOMO_API_KEY=test_key
MOMO_API_SECRET=test_secret
TWILIO_ACCOUNT_SID=test_sid
TWILIO_AUTH_TOKEN=test_token
TWILIO_PHONE_NUMBER=+1234567890
EMAIL_SERVICE=gmail
EMAIL_USER=test@gmail.com
EMAIL_PASSWORD=test_password
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
else
    echo -e "${YELLOW}⚠  backend/.env already exists, skipping${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Database: hutefast"
echo "Host: localhost"
echo "Port: 5432"
echo "User: postgres"
echo ""
echo "Next steps:"
echo "1. cd backend"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo "Verify connection:"
echo "  psql -U postgres -d hutefast -c \"SELECT COUNT(*) FROM users;\""
echo ""
