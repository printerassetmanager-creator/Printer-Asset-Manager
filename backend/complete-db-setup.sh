#!/bin/bash
# Complete Database Initialization & Repair Script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  PRINTER ASSET MANAGER - COMPLETE DATABASE SETUP         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd backend

# Step 1: Verify database exists
echo "📋 Step 1: Verifying database..."
psql -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database exists"
else
    echo "⚠️ Creating database..."
    createdb -U $DB_USER $DB_NAME
    echo "✅ Database created"
fi
echo ""

# Step 2: Initialize complete schema
echo "🔧 Step 2: Initializing database schema..."
node setup-db.js
echo ""

# Step 3: Run migrations
echo "🔄 Step 3: Running migrations..."
node runMigration.js
echo ""

# Step 4: Verify all tables
echo "🔍 Step 4: Verifying database schema..."
node verify-all-schemas.js
echo ""

# Step 5: Create default admin user
echo "👤 Step 5: Setting up admin user..."
node setup-admin.js
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              DATABASE SETUP COMPLETE ✅                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Start the backend:  npm start"
echo "  2. Check server logs for any issues"
echo "  3. Access frontend at: http://localhost:3000"
echo ""
