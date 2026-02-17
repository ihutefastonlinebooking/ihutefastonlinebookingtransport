#!/bin/bash

# HuteFast Complete Setup Script
# This script automates the complete setup process

set -e

echo "=========================================="
echo "HuteFast Setup Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will set up HuteFast for local development${NC}\n"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version) installed${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git installed${NC}\n"

# Backend setup
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="

cd backend

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit backend/.env with your configuration${NC}"
fi

echo "Installing backend dependencies..."
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}\n"

# Frontend setup
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="

cd ../frontend

if [ ! -f .env.local ]; then
    echo "Creating .env.local file from template..."
    cp .env.example .env.local
fi

echo "Installing frontend dependencies..."
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}\n"

# Create image directories
echo "=========================================="
echo "Creating image directories..."
echo "=========================================="

mkdir -p public/images/slider
mkdir -p public/images/logos
mkdir -p public/images/icons
mkdir -p public/images/vehicles

echo -e "${GREEN}✓ Image directories created${NC}\n"

# Summary
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="

echo -e "\n${GREEN}Next steps:${NC}"
echo ""
echo "1. Configure environment variables:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Start Backend (in backend directory):"
echo "   npm run dev"
echo ""
echo "3. Start Frontend (in frontend directory):"
echo "   npm run dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo -e "${YELLOW}For detailed setup guide, see SETUP_ROADMAP.md${NC}\n"
