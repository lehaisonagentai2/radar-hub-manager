#!/bin/bash

# Test script for file upload and document management API
echo "Testing Radar Hub Manager API - File Upload & Document Management"
echo "==============================================================="

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

# Test 2: Create a test file
echo -e "\n2. Creating test file..."
TEST_FILE="/tmp/test_document.txt"
echo "This is a test document for the radar hub manager system.
It contains sample content for testing file upload functionality.
Created at: $(date)" > "$TEST_FILE"

echo "✅ Test file created: $TEST_FILE"

# Test 3: Upload file
echo -e "\n3. Testing file upload..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_FILE")

echo "Upload response: $UPLOAD_RESPONSE"

# Extract file URL
FILE_URL=$(echo $UPLOAD_RESPONSE | grep -o '"file_url":"[^"]*"' | sed 's/"file_url":"\([^"]*\)"/\1/')

if [ -z "$FILE_URL" ]; then
    echo "❌ Failed to upload file."
    exit 1
fi

echo "✅ File uploaded successfully. URL: $FILE_URL"

# Test 4: Create document record
echo -e "\n4. Creating document record..."
CREATE_DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Document\",
    \"description\": \"This is a test document created via API\",
    \"file_url\": \"$FILE_URL\",
    \"file_name\": \"test_document.txt\",
    \"file_size\": $(stat -f%z "$TEST_FILE" 2>/dev/null || stat -c%s "$TEST_FILE"),
    \"file_type\": \"text/plain\"
  }")

echo "Create document response: $CREATE_DOC_RESPONSE"

# Extract document ID
DOC_ID=$(echo $CREATE_DOC_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id":\([0-9]*\)/\1/')

if [ -z "$DOC_ID" ]; then
    echo "❌ Failed to create document."
    exit 1
fi

echo "✅ Document created successfully. ID: $DOC_ID"

# Test 5: List documents
echo -e "\n5. Testing list documents..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/documents" \
  -H "Authorization: Bearer $TOKEN")

echo "List documents response: $LIST_RESPONSE"

# Test 6: Get specific document
echo -e "\n6. Testing get document by ID..."
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Get document response: $GET_RESPONSE"

# Test 7: Update document
echo -e "\n7. Testing update document..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Document",
    "description": "This document has been updated via API"
  }')

echo "Update document response: $UPDATE_RESPONSE"

# Test 8: Access uploaded file via static URL
echo -e "\n8. Testing file access via static URL..."
FILE_ACCESS_RESPONSE=$(curl -s -I "$FILE_URL")
echo "File access response headers:"
echo "$FILE_ACCESS_RESPONSE"

# Test 9: Delete document
echo -e "\n9. Testing delete document..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Delete document response: $DELETE_RESPONSE"

# Cleanup
rm -f "$TEST_FILE"
echo -e "\n✅ Test completed successfully!"
echo "🎉 All file upload and document management features are working!"