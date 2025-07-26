#!/bin/bash

# Test script to verify offset functionality
BASE_URL="http://localhost:3334"

echo "🧪 Testing offset functionality..."

# Test 1: Get first 5 viral notes
echo "📝 Test 1: Getting first 5 viral notes (offset=0)"
curl -s "$BASE_URL/api/viral-notes?limit=5&offset=0" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, viral_score: .viral_score}' 2>/dev/null || echo "Failed to get first 5 notes"

echo ""
echo "---"

# Test 2: Get next 5 viral notes (offset=5)
echo "📝 Test 2: Getting next 5 viral notes (offset=5)"
curl -s "$BASE_URL/api/viral-notes?limit=5&offset=5" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, viral_score: .viral_score}' 2>/dev/null || echo "Failed to get next 5 notes"

echo ""
echo "---"

# Test 3: Get first 5 trending notes
echo "📝 Test 3: Getting first 5 trending notes (offset=0)"
curl -s "$BASE_URL/api/trending-notes?limit=5&offset=0" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, trending_score: .trending_score}' 2>/dev/null || echo "Failed to get first 5 trending notes"

echo ""
echo "---"

# Test 4: Get next 5 trending notes (offset=5)
echo "📝 Test 4: Getting next 5 trending notes (offset=5)"
curl -s "$BASE_URL/api/trending-notes?limit=5&offset=5" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, trending_score: .trending_score}' 2>/dev/null || echo "Failed to get next 5 trending notes"

echo ""
echo "---"

# Test 5: Get first 5 scraped notes
echo "📝 Test 5: Getting first 5 scraped notes (offset=0)"
curl -s "$BASE_URL/api/scraped-notes?limit=5&offset=0" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, interaction_score: .interaction_score}' 2>/dev/null || echo "Failed to get first 5 scraped notes"

echo ""
echo "---"

# Test 6: Get next 5 scraped notes (offset=5)
echo "📝 Test 6: Getting next 5 scraped notes (offset=5)"
curl -s "$BASE_URL/api/scraped-notes?limit=5&offset=5" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, interaction_score: .interaction_score}' 2>/dev/null || echo "Failed to get next 5 scraped notes"

echo ""
echo "---"

# Test 7: Get first 5 main notes (offset=0)
echo "📝 Test 7: Getting first 5 main notes (offset=0)"
curl -s "$BASE_URL/api/main-notes?limit=5&offset=0" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, total_score: .total_score}' 2>/dev/null || echo "Failed to get first 5 main notes"

echo ""
echo "---"

# Test 8: Get next 5 main notes (offset=5)
echo "📝 Test 8: Getting next 5 main notes (offset=5)"
curl -s "$BASE_URL/api/main-notes?limit=5&offset=5" | jq '.[0:3] | .[] | {id: .id, author_id: .author_id, total_score: .total_score}' 2>/dev/null || echo "Failed to get next 5 main notes"

echo ""
echo "✅ Offset testing completed!" 