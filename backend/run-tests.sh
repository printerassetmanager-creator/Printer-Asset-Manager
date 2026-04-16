#!/bin/bash
# Comprehensive Backend Test Script

echo "═══════════════════════════════════════════════════════════"
echo "  PRINTER ASSET MANAGER - BACKEND COMPREHENSIVE TEST SUITE"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 1: Database Connection
echo "🔍 TEST 1: Database Connection..."
node test-db.js
echo ""

# Test 2: Authentication API
echo "🔍 TEST 2: Testing Auth Endpoints..."
echo "  Attempting login with test credentials..."
node test-login.js
echo ""

# Test 3: Admin user check
echo "🔍 TEST 3: Checking Admin User..."
node check-admin.js
echo ""

# Test 4: Code lint check
echo "🔍 TEST 4: Checking for syntax errors..."
find src -name "*.js" | while read file; do
  node -c "$file" && echo "  ✓ $file OK" || echo "  ✗ $file ERROR"
done
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  BACKEND TEST SUITE COMPLETE"
echo "═══════════════════════════════════════════════════════════"
