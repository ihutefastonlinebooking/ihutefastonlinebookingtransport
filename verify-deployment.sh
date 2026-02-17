#!/bin/bash

# HuteFast Production Deployment Verification Script
# Run this script before deploying to production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "HuteFast Production Deployment Checklist"
echo "==========================================${NC}\n"

CHECKS_PASSED=0
CHECKS_TOTAL=0

# Function to check and report
check_item() {
    local name="$1"
    local condition="$2"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if eval "$condition"; then
        echo -e "${GREEN}✓${NC} $name"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name"
    fi
}

# Environment Checks
echo -e "${YELLOW}1. ENVIRONMENT CONFIGURATION${NC}\n"

check_item "Backend .env exists" "[ -f backend/.env ]"
check_item "Frontend .env.local exists" "[ -f frontend/.env.local ]"
check_item "Backend has DB_HOST" "grep -q 'DB_HOST' backend/.env"
check_item "Backend has JWT_SECRET" "grep -q 'JWT_SECRET' backend/.env"
check_item "Frontend has VITE_API_URL" "grep -q 'VITE_API_URL' frontend/.env.local"

echo ""

# Dependencies Checks
echo -e "${YELLOW}2. DEPENDENCIES${NC}\n"

check_item "Backend node_modules exists" "[ -d backend/node_modules ]"
check_item "Frontend node_modules exists" "[ -d frontend/node_modules ]"

echo ""

# Backend Checks
echo -e "${YELLOW}3. BACKEND STRUCTURE${NC}\n"

check_item "Server file exists" "[ -f backend/src/server.js ]"
check_item "Config file exists" "[ -f backend/src/config/index.js ]"
check_item "Database schema exists" "[ -f backend/src/db/schema.js ]"
check_item "Controllers directory exists" "[ -d backend/src/controllers ]"
check_item "Routes directory exists" "[ -d backend/src/routes ]"
check_item "Middleware directory exists" "[ -d backend/src/middleware ]"
check_item "Services directory exists" "[ -d backend/src/services ]"

echo ""

# Frontend Checks
echo -e "${YELLOW}4. FRONTEND STRUCTURE${NC}\n"

check_item "React entry point exists" "[ -f frontend/src/index.jsx ]"
check_item "App component exists" "[ -f frontend/src/App.jsx ]"
check_item "Pages directory exists" "[ -d frontend/src/pages ]"
check_item "Components directory exists" "[ -d frontend/src/components ]"
check_item "Services directory exists" "[ -d frontend/src/services ]"
check_item "Store directory exists" "[ -d frontend/src/store ]"
check_item "Locales directory exists" "[ -d frontend/src/locales ]"
check_item "Tailwind config exists" "[ -f frontend/tailwind.config.js ]"
check_item "Vite config exists" "[ -f frontend/vite.config.js ]"

echo ""

# Image Assets Checks
echo -e "${YELLOW}5. IMAGE ASSETS${NC}\n"

check_item "Slider images directory exists" "[ -d frontend/public/images/slider ]"
check_item "Logos directory exists" "[ -d frontend/public/images/logos ]"
check_item "Icons directory exists" "[ -d frontend/public/images/icons ]"
check_item "Vehicles directory exists" "[ -d frontend/public/images/vehicles ]"

echo ""

# Database Checks
echo -e "${YELLOW}6. DATABASE${NC}\n"

check_item "Database connection configured" "grep -q 'DB_HOST' backend/.env"
check_item "Database user configured" "grep -q 'DB_USER' backend/.env"
check_item "Database password configured" "grep -q 'DB_PASSWORD' backend/.env"

echo ""

# Security Checks
echo -e "${YELLOW}7. SECURITY${NC}\n"

check_item "JWT secret configured" "grep -q 'JWT_SECRET' backend/.env"
check_item "JWT secret is 32+ characters" "[ $(grep 'JWT_SECRET=' backend/.env | sed 's/JWT_SECRET=//' | wc -c) -gt 32 ]"
check_item "Refresh token secret configured" "grep -q 'REFRESH_TOKEN_SECRET' backend/.env"
check_item "Encryption key configured" "grep -q 'ENCRYPTION_KEY' backend/.env"

echo ""

# Required Services
echo -e "${YELLOW}8. THIRD-PARTY SERVICES${NC}\n"

check_item "MoMo API key configured" "grep -q 'MOMO_API_KEY' backend/.env"
check_item "MoMo API secret configured" "grep -q 'MOMO_API_SECRET' backend/.env"
check_item "Twilio SID configured" "grep -q 'TWILIO_ACCOUNT_SID' backend/.env"
check_item "Twilio Auth token configured" "grep -q 'TWILIO_AUTH_TOKEN' backend/.env"
check_item "Email service configured" "grep -q 'EMAIL_USER' backend/.env"
check_item "Email password configured" "grep -q 'EMAIL_PASSWORD' backend/.env"

echo ""

# Documentation Checks
echo -e "${YELLOW}9. DOCUMENTATION${NC}\n"

check_item "README.md exists" "[ -f README.md ]"
check_item "SETUP_ROADMAP.md exists" "[ -f SETUP_ROADMAP.md ]"
check_item "DEPLOYMENT_PRODUCTION_GUIDE.md exists" "[ -f DEPLOYMENT_PRODUCTION_GUIDE.md ]"
check_item "PROJECT_COMPLETION.md exists" "[ -f PROJECT_COMPLETION.md ]"

echo ""

# Build Checks
echo -e "${YELLOW}10. BUILD READINESS${NC}\n"

check_item "Frontend package.json has build script" "grep -q '\"build\"' frontend/package.json"
check_item "Backend package.json has start script" "grep -q '\"start\"' backend/package.json"

echo ""

# Display Summary
SCORE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))

echo -e "${BLUE}=========================================="
echo "DEPLOYMENT READINESS SCORE"
echo "==========================================${NC}"
echo -e "\nPassed: ${GREEN}$CHECKS_PASSED/$CHECKS_TOTAL${NC} checks ($SCORE%)\n"

if [ $SCORE -eq 100 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED - READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review environment variables in backend/.env"
    echo "2. Review environment variables in frontend/.env.local"
    echo "3. Ensure database is accessible"
    echo "4. Run: cd backend && npm run dev"
    echo "5. Run: cd frontend && npm run dev (in another terminal)"
    echo "6. Test locally before deploying"
    echo "7. Follow DEPLOYMENT_PRODUCTION_GUIDE.md for production deployment"
    exit 0
elif [ $SCORE -ge 90 ]; then
    echo -e "${YELLOW}⚠ SOME CHECKS FAILED - REVIEW REQUIRED${NC}"
    echo ""
    echo "Please review the failed items above before deploying."
    exit 1
else
    echo -e "${RED}✗ CRITICAL CHECKS FAILED - DEPLOYMENT BLOCKED${NC}"
    echo ""
    echo "Please fix the failed items before proceeding."
    exit 1
fi
