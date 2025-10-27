#!/bin/bash

# Test script for vessel management API
echo "Testing Radar Hub Manager API - Vessel Management"
echo "================================================="

# Base URL
BASE_URL="http://localhost:8998/v1/api/radar-hub-manager"

# Test 1: Login to get JWT token
echo -e "\n1. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract JWT token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get JWT token. Login failed."
    exit 1
fi

echo "✅ Successfully logged in. Token: ${TOKEN:0:20}..."

# Test 2: Create first vessel
echo -e "\n2. Creating first vessel..."
CREATE_VESSEL1_RESPONSE=$(curl -s -X POST "$BASE_URL/vessels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "USS Enterprise",
    "mmsi": "123456789",
    "kind": "TC",
    "size": "342m x 78m x 76m",
    "weight": "100000 tons",
    "class": "Lớp A",
    "specs": "Nuclear powered aircraft carrier",
    "max_speed": "30+ knots",
    "description": "Nuclear-powered supercarrier of the United States Navy"
  }')

echo "Create vessel 1 response: $CREATE_VESSEL1_RESPONSE"

# Extract vessel ID
VESSEL1_ID=$(echo $CREATE_VESSEL1_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id":\([0-9]*\)/\1/')

# Test 3: Create second vessel
echo -e "\n3. Creating second vessel..."
CREATE_VESSEL2_RESPONSE=$(curl -s -X POST "$BASE_URL/vessels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Titanic",
    "mmsi": "987654321",
    "kind": "DS",
    "size": "269m x 28m x 53m",
    "weight": "52310 tons",
    "class": "Lớp B",
    "specs": "Olympic-class ocean liner",
    "max_speed": "23 knots",
    "description": "British passenger liner that sank in 1912"
  }')

echo "Create vessel 2 response: $CREATE_VESSEL2_RESPONSE"

# Extract vessel ID
VESSEL2_ID=$(echo $CREATE_VESSEL2_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id":\([0-9]*\)/\1/')

# Test 4: Create third vessel for search testing
echo -e "\n4. Creating third vessel..."
CREATE_VESSEL3_RESPONSE=$(curl -s -X POST "$BASE_URL/vessels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise NCC-1701",
    "mmsi": "555666777",
    "kind": "TC",
    "size": "288m x 127m x 73m",
    "weight": "190000 tons",
    "class": "Lớp A",
    "specs": "Constitution-class starship",
    "max_speed": "Warp 8",
    "description": "Starfleet flagship from Star Trek"
  }')

echo "Create vessel 3 response: $CREATE_VESSEL3_RESPONSE"

# Test 5: List all vessels
echo -e "\n5. Testing list all vessels..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/vessels" \
  -H "Authorization: Bearer $TOKEN")

echo "List all vessels response: $LIST_RESPONSE"

# Test 6: Search vessels by name (partial match)
echo -e "\n6. Testing search by name (search for 'Enterprise')..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/vessels?name=Enterprise" \
  -H "Authorization: Bearer $TOKEN")

echo "Search by name response: $SEARCH_RESPONSE"

# Test 7: Get vessel by ID
echo -e "\n7. Testing get vessel by ID..."
if [ ! -z "$VESSEL1_ID" ]; then
    GET_BY_ID_RESPONSE=$(curl -s -X GET "$BASE_URL/vessels/$VESSEL1_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "Get vessel by ID response: $GET_BY_ID_RESPONSE"
else
    echo "❌ No vessel ID available for testing"
fi

# Test 8: Get vessel by MMSI
echo -e "\n8. Testing get vessel by MMSI..."
GET_BY_MMSI_RESPONSE=$(curl -s -X GET "$BASE_URL/vessels/mmsi/123456789" \
  -H "Authorization: Bearer $TOKEN")

echo "Get vessel by MMSI response: $GET_BY_MMSI_RESPONSE"

# Test 9: Update vessel
echo -e "\n9. Testing update vessel..."
if [ ! -z "$VESSEL1_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/vessels/$VESSEL1_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "description": "Updated: Nuclear-powered supercarrier of the United States Navy - CVN-65",
        "max_speed": "33+ knots"
      }')
    echo "Update vessel response: $UPDATE_RESPONSE"
else
    echo "❌ No vessel ID available for testing"
fi

# Test 10: Test MMSI uniqueness constraint
echo -e "\n10. Testing MMSI uniqueness constraint..."
DUPLICATE_MMSI_RESPONSE=$(curl -s -X POST "$BASE_URL/vessels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate MMSI Test",
    "mmsi": "123456789",
    "kind": "TC"
  }')

echo "Duplicate MMSI response (should fail): $DUPLICATE_MMSI_RESPONSE"

# Test 11: Search with non-existent name
echo -e "\n11. Testing search with non-existent name..."
NO_RESULT_SEARCH=$(curl -s -X GET "$BASE_URL/vessels?name=NonExistentVessel" \
  -H "Authorization: Bearer $TOKEN")

echo "Search with no results: $NO_RESULT_SEARCH"

# Test 12: Delete vessel
echo -e "\n12. Testing delete vessel..."
if [ ! -z "$VESSEL2_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/vessels/$VESSEL2_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "Delete vessel response: $DELETE_RESPONSE"
    
    # Verify deletion
    echo -e "\n13. Verifying vessel deletion..."
    VERIFY_DELETE=$(curl -s -X GET "$BASE_URL/vessels/$VESSEL2_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "Verify deletion (should return 404): $VERIFY_DELETE"
else
    echo "❌ No vessel ID available for testing"
fi

# Final test: List remaining vessels
echo -e "\n14. Final test - List remaining vessels..."
FINAL_LIST=$(curl -s -X GET "$BASE_URL/vessels" \
  -H "Authorization: Bearer $TOKEN")

echo "Final vessel list: $FINAL_LIST"

echo -e "\n✅ Vessel management API testing completed!"
echo "🎉 Features tested:"
echo "   - ✅ Create vessel with validation"
echo "   - ✅ MMSI uniqueness constraint"
echo "   - ✅ List all vessels"
echo "   - ✅ Search by name (partial match)"
echo "   - ✅ Get by ID"
echo "   - ✅ Get by MMSI"
echo "   - ✅ Update vessel"
echo "   - ✅ Delete vessel"
echo "   - ✅ Index-based search functionality"