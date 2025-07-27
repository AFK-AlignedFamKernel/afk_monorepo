#!/bin/bash

# Test script for topic search functionality
echo "🧪 Testing topic search functionality..."

# Test 1: Search for notes with topic "bitcoin"
echo "📝 Test 1: Searching for notes with topic 'bitcoin'"
response=$(curl -s "http://localhost:3334/api/search/topics?topic=bitcoin&limit=5")
if [[ $response == *"Error"* ]]; then
    echo "❌ Test 1 failed: $response"
else
    echo "✅ Test 1 response received"
    echo "$response" | jq '.' 2>/dev/null || echo "Response: $response"
fi

echo ""

# Test 2: Search for notes with topic "nostr" with interaction filter
echo "📝 Test 2: Searching for notes with topic 'nostr' and min 1 interaction"
response=$(curl -s "http://localhost:3334/api/search/topics?topic=nostr&limit=5&min_interaction_count=1")
if [[ $response == *"Error"* ]]; then
    echo "❌ Test 2 failed: $response"
else
    echo "✅ Test 2 response received"
    echo "$response" | jq '.' 2>/dev/null || echo "Response: $response"
fi

echo ""

# Test 3: Search for notes with topic "lightning" sorted by reactions
echo "📝 Test 3: Searching for notes with topic 'lightning' sorted by reactions"
response=$(curl -s "http://localhost:3334/api/search/topics?topic=lightning&limit=5&sort=reactions_desc")
if [[ $response == *"Error"* ]]; then
    echo "❌ Test 3 failed: $response"
else
    echo "✅ Test 3 response received"
    echo "$response" | jq '.' 2>/dev/null || echo "Response: $response"
fi

echo ""

# Test 4: Get popular topics
echo "📝 Test 4: Getting popular topics"
response=$(curl -s "http://localhost:3334/api/search/tags?limit=10&time_range=7d")
if [[ $response == *"Error"* ]]; then
    echo "❌ Test 4 failed: $response"
else
    echo "✅ Test 4 response received"
    echo "$response" | jq '.' 2>/dev/null || echo "Response: $response"
fi

echo ""

# Test 5: Search with time range filter
echo "📝 Test 5: Searching for notes with topic 'ethereum' in last 24h"
response=$(curl -s "http://localhost:3334/api/search/topics?topic=ethereum&limit=5&time_range=24h")
if [[ $response == *"Error"* ]]; then
    echo "❌ Test 5 failed: $response"
else
    echo "✅ Test 5 response received"
    echo "$response" | jq '.' 2>/dev/null || echo "Response: $response"
fi

echo ""
echo "✅ Topic search tests completed!" 