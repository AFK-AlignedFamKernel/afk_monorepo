#!/bin/bash

# Test script for topic search functionality
echo "🧪 Testing topic search functionality..."

# Test 1: Search for notes with topic "bitcoin"
echo "📝 Test 1: Searching for notes with topic 'bitcoin'"
curl -s "http://localhost:3334/api/search/topics?topic=bitcoin&limit=5" | jq '.[0:3]' || echo "❌ Test 1 failed"

echo ""

# Test 2: Search for notes with topic "nostr" with interaction filter
echo "📝 Test 2: Searching for notes with topic 'nostr' and min 1 interaction"
curl -s "http://localhost:3334/api/search/topics?topic=nostr&limit=5&min_interaction_count=1" | jq '.[0:3]' || echo "❌ Test 2 failed"

echo ""

# Test 3: Search for notes with topic "lightning" sorted by reactions
echo "📝 Test 3: Searching for notes with topic 'lightning' sorted by reactions"
curl -s "http://localhost:3334/api/search/topics?topic=lightning&limit=5&sort=reactions_desc" | jq '.[0:3]' || echo "❌ Test 3 failed"

echo ""

# Test 4: Get popular topics
echo "📝 Test 4: Getting popular topics"
curl -s "http://localhost:3334/api/search/tags?limit=10&time_range=7d" | jq '.[0:5]' || echo "❌ Test 4 failed"

echo ""

# Test 5: Search with time range filter
echo "📝 Test 5: Searching for notes with topic 'ethereum' in last 24h"
curl -s "http://localhost:3334/api/search/topics?topic=ethereum&limit=5&time_range=24h" | jq '.[0:3]' || echo "❌ Test 5 failed"

echo ""
echo "✅ Topic search tests completed!" 