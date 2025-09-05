#!/bin/bash

echo "🧪 Testing Backend Livestream Endpoints"
echo "========================================"

# Test if backend is running
echo "1. Testing if backend is running..."
if curl -s http://localhost:5050/health > /dev/null; then
    echo "✅ Backend is running on port 5050"
else
    echo "❌ Backend is not running on port 5050"
    echo "   Please start your backend first: npm run dev"
    exit 1
fi

echo -e "\n2. Testing livestream health endpoint..."
curl -s http://localhost:5050/livestream/health | jq '.' || echo "Health endpoint failed"

echo -e "\n3. Testing active streams endpoint..."
curl -s http://localhost:5050/livestream/active | jq '.' || echo "Active streams endpoint failed"

echo -e "\n4. Testing stream status endpoint (with test ID)..."
curl -s http://localhost:5050/livestream/test-123/status | jq '.' || echo "Stream status endpoint failed"

echo -e "\n5. Testing HLS manifest endpoint (with test ID)..."
curl -s http://localhost:5050/livestream/test-123/stream.m3u8 || echo "HLS manifest endpoint failed"

echo -e "\n✅ Backend endpoint tests completed!"
echo -e "\n📝 If you see 404 errors for test IDs, that's expected."
echo -e "   The important thing is that the routes are responding."
