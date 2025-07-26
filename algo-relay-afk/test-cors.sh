#!/bin/bash

# CORS Test Script for Algo-Relay
# This script tests if CORS is properly configured

echo "🧪 Testing CORS Configuration for Algo-Relay"
echo "=============================================="

# Default values
RELAY_URL=${1:-"http://localhost:3334"}
TEST_ORIGIN=${2:-"http://localhost:3000"}

echo "Testing against: $RELAY_URL"
echo "Test origin: $TEST_ORIGIN"
echo ""

# Test 1: Preflight OPTIONS request
echo "1️⃣ Testing OPTIONS preflight request..."
curl -s -X OPTIONS \
  -H "Origin: $TEST_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v "$RELAY_URL/api/trending-notes" 2>&1 | grep -E "(Access-Control|HTTP)"

echo ""
echo "2️⃣ Testing actual GET request..."
curl -s -X GET \
  -H "Origin: $TEST_ORIGIN" \
  -H "Content-Type: application/json" \
  -v "$RELAY_URL/api/trending-notes" 2>&1 | grep -E "(Access-Control|HTTP)"

echo ""
echo "3️⃣ Testing without Origin header..."
curl -s -X GET \
  -H "Content-Type: application/json" \
  -v "$RELAY_URL/api/trending-notes" 2>&1 | grep -E "(Access-Control|HTTP)"

echo ""
echo "✅ CORS test completed!"
echo ""
echo "Expected results:"
echo "- OPTIONS request should return 200 with CORS headers"
echo "- GET request should return 200 with CORS headers"
echo "- Look for 'Access-Control-Allow-Origin' in the response headers"
echo ""
echo "If you see CORS errors, check your ALLOWED_ORIGINS configuration." 