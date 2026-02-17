#!/bin/bash

#
# HuteFast Platform - Final Validation Script
# Tests all Phase 3 implementations for production readiness
# Usage: bash validate.sh
#

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════"
echo " HuteFast - Production Readiness Validation"
echo " Phase 3 - Features: Invoices, Short Trips, iHute Card, RBAC"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_feature() {
    local feature=$1
    local command=$2
    echo -n "Testing: $feature... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

# File syntax check
test_syntax() {
    local file=$1
    local name=$2
    echo -n "Checking syntax: $name... "
    
    if node -c "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}1. BACKEND SYNTAX VALIDATION${NC}"
test_syntax "backend/src/controllers/invoiceController.js" "invoiceController"
test_syntax "backend/src/controllers/shortTripBookingController.js" "shortTripBookingController"
test_syntax "backend/src/controllers/ihuteCardController.js" "ihuteCardController"
test_syntax "backend/src/middleware/roles.js" "roles middleware"
test_syntax "backend/src/routes/invoiceRoutes.js" "invoiceRoutes"
test_syntax "backend/src/server.js" "server entry"

echo ""
echo -e "${BLUE}2. FRONTEND SYNTAX VALIDATION${NC}"
test_syntax "frontend/src/components/ProtectedRoute.jsx" "ProtectedRoute"
test_syntax "frontend/src/App.jsx" "App routes"
test_syntax "frontend/src/store/authStore.js" "authStore"
test_syntax "frontend/src/services/api.js" "API services"

echo ""
echo -e "${BLUE}3. FILE EXISTENCE CHECKS${NC}"
test_feature "Invoice controller exists" "test -f backend/src/controllers/invoiceController.js"
test_feature "Short trip controller exists" "test -f backend/src/controllers/shortTripBookingController.js"
test_feature "iHute card controller exists" "test -f backend/src/controllers/ihuteCardController.js"
test_feature "Company controller exists" "test -f backend/src/controllers/companyController.js"
test_feature "Roles middleware exists" "test -f backend/src/middleware/roles.js"
test_feature "ProtectedRoute component exists" "test -f frontend/src/components/ProtectedRoute.jsx"

echo ""
echo -e "${BLUE}4. ROUTE CONFIGURATION CHECKS${NC}"
test_feature "Invoice routes registered" "grep -q 'invoiceRoutes' backend/src/server.js"
test_feature "Short trip routes exist" "test -f backend/src/routes/shortTripRoutes.js"
test_feature "iHute card routes exist" "test -f backend/src/routes/ihuteCardRoutes.js"
test_feature "QR validation routes exist" "test -f backend/src/routes/qrValidationRoutes.js"

echo ""
echo -e "${BLUE}5. DATABASE SCHEMA CHECKS${NC}"
test_feature "Database schema file exists" "test -f backend/src/db/schema.js"
test_feature "Connection file exists" "test -f backend/src/db/connection.js"

echo ""
echo -e "${BLUE}6. FRONTEND ROUTE STRUCTURE CHECKS${NC}"
test_feature "Protected client routes exist" "grep -q 'requiredRoles=.*client' frontend/src/App.jsx"
test_feature "Protected driver routes exist" "grep -q 'requiredRoles=.*driver' frontend/src/App.jsx"
test_feature "Protected admin routes exist" "grep -q 'requiredRoles=.*super_admin' frontend/src/App.jsx"

echo ""
echo -e "${BLUE}7. API SERVICE CHECKS${NC}"
test_feature "Invoice service exists" "grep -q 'invoiceService' frontend/src/services/api.js"
test_feature "Short trip service exists" "grep -q 'shortTripService' frontend/src/services/api.js"
test_feature "iHute card service exists" "grep -q 'ihuteCardService' frontend/src/services/api.js"
test_feature "QR validation service exists" "grep -q 'qrValidationService' frontend/src/services/api.js"

echo ""
echo -e "${BLUE}8. MIDDLEWARE CHECKS${NC}"
test_feature "requireSuperAdmin exported" "grep -q 'export.*requireSuperAdmin' backend/src/middleware/roles.js"
test_feature "requireCompanyAdmin exported" "grep -q 'export.*requireCompanyAdmin' backend/src/middleware/roles.js"
test_feature "requireDriver exported" "grep -q 'export.*requireDriver' backend/src/middleware/roles.js"
test_feature "requireClient exported" "grep -q 'export.*requireClient' backend/src/middleware/roles.js"

echo ""
echo -e "${BLUE}9. DOCUMENTATION CHECKS${NC}"
test_feature "PHASE_3_SUMMARY.md exists" "test -f PHASE_3_SUMMARY.md"
test_feature "DEPLOYMENT_GUIDE.md exists" "test -f DEPLOYMENT_GUIDE.md"
test_feature "README.md updated" "grep -q 'Phase 3' README.md"

echo ""
echo -e "${BLUE}10. ENVIRONMENT FILE CHECKS${NC}"
test_feature "Backend .env.example exists" "test -f backend/.env.example"
test_feature "Frontend .env.example exists" "test -f frontend/.env.example"

echo ""
echo -e "${BLUE}11. PUBLIC ASSETS CHECKS${NC}"
test_feature "Images slider dir exists" "test -d frontend/public/images/slider"
test_feature "Images logos dir exists" "test -d frontend/public/images/logos"
test_feature "Images icons dir exists" "test -d frontend/public/images/icons"
test_feature "Images vehicles dir exists" "test -d frontend/public/images/vehicles"

echo ""
echo -e "${BLUE}12. DEPENDENCY CHECKS${NC}"
test_feature "Backend dependencies installed" "test -d backend/node_modules"
test_feature "Frontend dependencies installed" "test -d frontend/node_modules"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL VALIDATIONS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure .env files with database and API credentials"
    echo "2. Run: cd backend && npm start (port 5000)"
    echo "3. Run: cd frontend && npm run dev (port 5173)"
    echo "4. Test login at http://localhost:5173/login"
    echo "5. Review DEPLOYMENT_GUIDE.md for production deployment"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME VALIDATIONS FAILED${NC}"
    echo ""
    echo "Issues to resolve:"
    echo "- Check file syntax with: node -c <file>"
    echo "- Verify all dependencies are installed with: npm install"
    echo "- Check file paths match directory structure"
    echo ""
    exit 1
fi
