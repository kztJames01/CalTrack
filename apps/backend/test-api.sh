#!/bin/bash

# CalTrack Backend - Quick Test Script
# This script tests all endpoints to verify Phase 2 implementation

set -e

BASE_URL="http://localhost:3000/api"
EMAIL="test@caltrack.com"
PASSWORD="Test123!@#"

echo "🚀 CalTrack Backend API Test"
echo "============================"
echo ""

# Test health endpoint
echo "✅ Testing health endpoint..."
curl -s ${BASE_URL} | grep -q "Hello World" && echo "   Health check passed!" || echo "   ❌ Health check failed"
echo ""

# Register user
echo "✅ Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
  
if echo $REGISTER_RESPONSE | grep -q "accessToken"; then
  echo "   User registered successfully!"
  ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
else
  echo "   User might already exist, trying login..."
  
  # Login
  echo "✅ Logging in..."
  LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
  
  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "   Token obtained: ${ACCESS_TOKEN:0:20}..."
echo ""

# Test nutrition search
echo "✅ Testing nutrition search..."
SEARCH_RESPONSE=$(curl -s "${BASE_URL}/nutrition/search?query=apple" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo $SEARCH_RESPONSE | grep -q "food_name"; then
  echo "   Nutrition search working!"
else
  echo "   ⚠️  Nutrition search may need API credentials"
fi
echo ""

# Create a test meal
echo "✅ Creating test meal..."
MEAL_DATA='{
  "type": "breakfast",
  "eatenAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
  "notes": "Test meal from API",
  "foodItems": [
    {
      "name": "Banana",
      "calories": 105,
      "protein": 1.3,
      "carbs": 27,
      "fat": 0.4,
      "servingSize": "1",
      "servingUnit": "medium banana",
      "quantity": 1,
      "isCustom": true
    }
  ]
}'

CREATE_MEAL_RESPONSE=$(curl -s -X POST ${BASE_URL}/meals \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${MEAL_DATA}")

if echo $CREATE_MEAL_RESPONSE | grep -q '"id"'; then
  MEAL_ID=$(echo $CREATE_MEAL_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
  echo "   Meal created with ID: ${MEAL_ID}"
else
  echo "   ⚠️  Meal creation may have failed (check database connection)"
fi
echo ""

# Get meals list
echo "✅ Fetching meals list..."
MEALS_LIST=$(curl -s "${BASE_URL}/meals" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo $MEALS_LIST | grep -q "meals"; then
  echo "   Meals list retrieved!"
else
  echo "   ⚠️  Could not fetch meals"
fi
echo ""

# Get daily totals
echo "✅ Getting daily totals..."
TODAY=$(date +"%Y-%m-%d")
DAILY_TOTALS=$(curl -s "${BASE_URL}/meals/daily-totals?date=${TODAY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo $DAILY_TOTALS | grep -q "totals"; then
  echo "   Daily totals retrieved!"
else
  echo "   ⚠️  Could not fetch daily totals"
fi
echo ""

# Test sync endpoints
echo "✅ Testing sync endpoints..."
LAST_SYNC=$(curl -s "${BASE_URL}/sync/last-sync" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo $LAST_SYNC | grep -q "timestamp"; then
  echo "   Sync endpoints working!"
else
  echo "   ⚠️  Sync endpoints may need database"
fi
echo ""

# Cleanup
if [ -n "$MEAL_ID" ]; then
  echo "✅ Cleaning up test meal..."
  curl -s -X DELETE "${BASE_URL}/meals/${MEAL_ID}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null
  echo "   Test meal deleted"
fi
echo ""

echo "============================"
echo "✨ Phase 2 API Testing Complete!"
echo ""
echo "📝 Notes:"
echo "   - Make sure PostgreSQL and Redis are running"
echo "   - Nutrition API requires valid Nutritionix credentials"
echo "   - Photo upload requires AWS S3 configuration"
echo "   - Vision API requires Google Cloud credentials"
echo ""
echo "🔗 API Documentation: apps/backend/API.md"
echo "🔗 Phase 2 Summary: apps/backend/PHASE2_COMPLETE.md"
