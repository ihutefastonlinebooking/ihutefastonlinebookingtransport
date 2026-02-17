#!/bin/bash

# HuteFast Platform Verification Script
# Checks that all components are ready for deployment

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   HuteFast Platform - Verification Checklist           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# ============================================================================
# 1. Check Git Repository
# ============================================================================
echo -e "\n${BLUE}1. Git Repository${NC}"
if [ -d ".git" ]; then
    check_pass "Git repository found"
    COMMITS=$(git rev-list --all --count 2>/dev/null || echo "unknown")
    check_pass "Git commits: $COMMITS"
else
    check_fail "Not a git repository"
fi

# ============================================================================
# 2. Check Frontend Files
# ============================================================================
echo -e "\n${BLUE}2. Frontend Files${NC}"

[ -f "frontend/package.json" ] && check_pass "frontend/package.json exists" || check_fail "frontend/package.json missing"
[ -f "frontend/tsconfig.json" ] && check_pass "frontend/tsconfig.json configured" || check_fail "frontend/tsconfig.json missing"
[ -f "frontend/src/App.jsx" ] && check_pass "frontend/src/App.jsx exists" || check_fail "frontend/src/App.jsx missing"
[ -f "frontend/src/pages/HomePage.jsx" ] && check_pass "frontend/src/pages/HomePage.jsx exists" || check_fail "frontend/src/pages/HomePage.jsx missing"
[ -f "frontend/src/components/Header.jsx" ] && check_pass "frontend/src/components/Header.jsx (Navigation) exists" || check_fail "frontend/src/components/Header.jsx missing"
[ -f "frontend/src/components/Carousel.jsx" ] && check_pass "frontend/src/components/Carousel.jsx (Images) exists" || check_fail "frontend/src/components/Carousel.jsx missing"

# Check images
IMAGE_COUNT=$(find frontend/public/images/slider -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) 2>/dev/null | wc -l)
if [ "$IMAGE_COUNT" -ge 5 ]; then
    check_pass "Carousel has $IMAGE_COUNT images"
else
    check_fail "Carousel has only $IMAGE_COUNT images (need 5+)"
fi

[ -f "frontend/public/images/logos/logo.png" ] && check_pass "Logo file exists" || check_warn "Logo file missing"

# ============================================================================
# 3. Check Backend Files
# ============================================================================
echo -e "\n${BLUE}3. Backend Files${NC}"

[ -f "backend/package.json" ] && check_pass "backend/package.json exists" || check_fail "backend/package.json missing"
[ -f "backend/src/server.js" ] && check_pass "backend/src/server.js exists" || check_fail "backend/src/server.js missing"
[ -f "backend/src/db/connection.js" ] && check_pass "backend/src/db/connection.js exists" || check_fail "backend/src/db/connection.js missing"
[ -f "backend/src/db/schema.sql" ] && check_pass "backend/src/db/schema.sql exists" || check_fail "backend/src/db/schema.sql missing"
[ -d "backend/src/routes" ] && check_pass "backend/src/routes directory exists" || check_fail "backend/src/routes missing"

# ============================================================================
# 4. Check Environment Files
# ============================================================================
echo -e "\n${BLUE}4. Environment Configuration${NC}"

[ -f "backend/.env.example" ] && check_pass "backend/.env.example found" || check_fail "backend/.env.example missing"
[ -f "frontend/.env.example" ] && check_pass "frontend/.env.example found" || check_fail "frontend/.env.example missing"

if [ -f "backend/.env" ]; then
    check_pass "backend/.env configured"
    if grep -q "DATABASE_URL\|DB_HOST" backend/.env; then
        check_pass "Database URL/Host configured"
    else
        check_warn "Database configuration not found in .env"
    fi
else
    check_warn "backend/.env not yet created (run setup script)"
fi

if [ -f "frontend/.env" ]; then
    check_pass "frontend/.env configured"
else
    check_warn "frontend/.env not yet created (run setup script)"
fi

# ============================================================================
# 5. Check Dependencies
# ============================================================================
echo -e "\n${BLUE}5. Dependencies${NC}"

if [ -d "backend/node_modules" ]; then
    check_pass "Backend dependencies installed (node_modules exists)"
else
    check_warn "Backend dependencies not installed (run: cd backend && npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    check_pass "Frontend dependencies installed (node_modules exists)"
else
    check_warn "Frontend dependencies not installed (run: cd frontend && npm install)"
fi

# ============================================================================
# 6. Check Documentation
# ============================================================================
echo -e "\n${BLUE}6. Documentation${NC}"

[ -f "README.md" ] && check_pass "README.md provided" || check_fail "README.md missing"
[ -f "GETTING_STARTED.md" ] && check_pass "GETTING_STARTED.md provided" || check_fail "GETTING_STARTED.md missing"
[ -f "DATABASE_SCHEMA.md" ] && check_pass "DATABASE_SCHEMA.md provided" || check_fail "DATABASE_SCHEMA.md missing"
[ -f "DATABASE_SETUP.md" ] && check_pass "DATABASE_SETUP.md provided" || check_fail "DATABASE_SETUP.md missing"
[ -f "DATABASE_DEPLOYMENT.md" ] && check_pass "DATABASE_DEPLOYMENT.md provided" || check_fail "DATABASE_DEPLOYMENT.md missing"
[ -f "SETUP_ROADMAP.md" ] && check_pass "SETUP_ROADMAP.md provided" || check_fail "SETUP_ROADMAP.md missing"
[ -f "DEPLOYMENT_GUIDE.md" ] && check_pass "DEPLOYMENT_GUIDE.md provided" || check_fail "DEPLOYMENT_GUIDE.md missing"

# ============================================================================
# 7. Check Setup Scripts
# ============================================================================
echo -e "\n${BLUE}7. Setup Scripts${NC}"

[ -x "scripts/setup-database.sh" ] && check_pass "setup-database.sh is executable" || check_fail "setup-database.sh not executable"
[ -x "scripts/migrate-database.sh" ] && check_pass "migrate-database.sh is executable" || check_fail "migrate-database.sh not executable"

# ============================================================================
# 8. Check System Requirements
# ============================================================================
echo -e "\n${BLUE}8. System Requirements${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed: $NPM_VERSION"
else
    check_fail "npm not installed"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | awk '{print $3}')
    check_pass "PostgreSQL installed: v$PG_VERSION"
else
    check_warn "PostgreSQL not installed (needed for local dev)"
fi

# ============================================================================
# 9. Check Database (if running locally)
# ============================================================================
echo -e "\n${BLUE}9. Database Status${NC}"

if command -v pg_isready &> /dev/null; then
    if pg_isready > /dev/null 2>&1; then
        check_pass "PostgreSQL server is running"
        
        # Check if database exists
        DB_EXISTS=$(psql -U postgres -lqt | cut -d \| -f 1 | grep -w hutefast 2>/dev/null || echo "")
        if [ -n "$DB_EXISTS" ]; then
            check_pass "Database 'hutefast' exists"
            
            # Check tables
            TABLE_COUNT=$(psql -U postgres -d hutefast -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')
            if [ "$TABLE_COUNT" -gt 0 ]; then
                check_pass "Database has $TABLE_COUNT tables (schema initialized)"
            else
                check_warn "Database exists but no tables found (run: bash scripts/setup-database.sh)"
            fi
        else
            check_warn "Database 'hutefast' not found (run: bash scripts/setup-database.sh)"
        fi
    else
        check_warn "PostgreSQL server is not running (for local dev: brew services start postgresql@14)"
    fi
else
    check_warn "PostgreSQL CLI tools not found"
fi

# ============================================================================
# 10. Summary and Recommendations
# ============================================================================
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

echo -e "\n${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

TOTAL=$((PASSED + FAILED + WARNINGS))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo ""
echo -e "Overall Readiness: ${GREEN}$PERCENTAGE%${NC}"

if [ "$FAILED" -eq 0 ] && [ "$WARNINGS" -le 2 ]; then
    echo -e "\n${GREEN}✓ PLATFORM IS READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: bash scripts/setup-database.sh"
    echo "2. Deploy to Railway or local development"
    echo "3. Check: [GETTING_STARTED.md](./GETTING_STARTED.md)"
elif [ "$FAILED" -eq 0 ]; then
    echo -e "\n${YELLOW}⚠ PLATFORM IS MOSTLY READY (address warnings first)${NC}"
else
    echo -e "\n${RED}✗ PLATFORM HAS ISSUES (fix failures before deploying)${NC}"
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  - SETUP_ROADMAP.md"
echo "  - GETTING_STARTED.md"
echo "  - DATABASE_DEPLOYMENT.md"
