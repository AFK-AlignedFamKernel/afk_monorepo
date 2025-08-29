#!/bin/bash

# Test script for livestream HTTP endpoints
# Make sure your backend is running on port 5050

BASE_URL="http://localhost:5050"

echo "🧪 Testing Livestream HTTP Endpoints"
echo "====================================="

# Test health check
echo "1. Testing health check..."
curl -s "$BASE_URL/livestream/health" | jq '.' || echo "Health check failed"

echo -e "\n2. Testing active streams list..."
curl -s "$BASE_URL/livestream/active" | jq '.' || echo "Active streams failed"

echo -e "\n3. Testing stream status (with a test stream ID)..."
curl -s "$BASE_URL/livestream/test-stream-123/status" | jq '.' || echo "Stream status failed"

echo -e "\n4. Testing HLS manifest (with a test stream ID)..."
curl -s "$BASE_URL/livestream/test-stream-123/stream.m3u8" || echo "HLS manifest failed"

echo -e "\n5. Testing HLS segment (with a test segment)..."
curl -s "$BASE_URL/livestream/test-stream-123/segment_0.ts" || echo "HLS segment failed"

echo -e "\n✅ Endpoint tests completed!"
echo -e "\n📝 Note: Some endpoints will return 404 for test IDs, which is expected."
echo -e "   The important thing is that the routes are registered and responding."
