#!/bin/bash

# Database Migration Script for Railway/Production
# Run this after deploying to initialize database schema

set -e

echo "🚀 Initializing HuteFast Database..."
echo "===================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Set DATABASE_URL in Railway environment variables"
    exit 1
fi

echo "✓ DATABASE_URL detected"

# Get schema content
SCHEMA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCHEMA_DIR/../backend/src/db/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ ERROR: Schema file not found at $SCHEMA_FILE"
    exit 1
fi

echo "✓ Schema file found"

# Run migrations
echo "📋 Applying database schema..."

# Use psql with DATABASE_URL
psql "$DATABASE_URL" << 'EOF'
-- This will run all CREATE TABLE IF NOT EXISTS statements
BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables will be created here from schema.sql
-- The queries are idempotent (IF NOT EXISTS)

COMMIT;
EOF

# Now run the full schema
psql "$DATABASE_URL" -f "$SCHEMA_FILE"

echo "✅ Database schema applied successfully!"

# Verify tables were created
TABLE_COUNT=$(psql "$DATABASE_URL" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✓ Database has $TABLE_COUNT tables"
    
    # List created tables
    echo ""
    echo "Created tables:"
    psql "$DATABASE_URL" -c "\dt public.*"
else
    echo "⚠️  No tables found (may already exist)"
fi

echo ""
echo "✅ Database initialization complete!"
echo "🎉 HuteFast is ready to run"
