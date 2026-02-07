#!/bin/bash

BASE_URL="http://localhost:3001/api"
TIMESTAMP=$(date +%s)
SKU_SUFFIX="TEST-$TIMESTAMP"
LOG_FILE="test_server.log"

# Clean up any existing process on port 3001
PORT_PID=$(lsof -t -i:3001)
if [ ! -z "$PORT_PID" ]; then
  echo "🧹 Cleaning up existing process on port 3001 (PID: $PORT_PID)..."
  kill -9 $PORT_PID
fi

echo "🚀 Starting backend server for testing..."
npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

echo "⏳ Waiting for server to be ready..."
# Loop check health endpoint
MAX_RETRIES=30
for ((i=1;i<=MAX_RETRIES;i++)); do
    if curl -s "http://localhost:3001/health" | grep "running" > /dev/null; then
        echo "✅ Server is running!"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo "\n❌ Server failed to start within $MAX_RETRIES seconds."
        echo "--- Server Log ---"
        cat "$LOG_FILE"
        echo "------------------"
        # Kill whatever started
        if [ ! -z "$SERVER_PID" ]; then kill -9 $SERVER_PID; fi
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "🧪 Starting Variant System Test..."

# 1. Create Product
echo ""
echo "📦 Creating Product..."
PRODUCT_RES=$(curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Phone $TIMESTAMP\",
    \"sku\": \"PHONE-$SKU_SUFFIX\",
    \"stockMethod\": \"FIFO\",
    \"sellingPrice\": 5000000
  }")
echo "Response: $PRODUCT_RES"

# Parse Product ID: look for "id":123 pattern
PRODUCT_ID=$(echo $PRODUCT_RES | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "✅ Product ID: $PRODUCT_ID"

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" == "null" ]; then
  echo "❌ Failed to create product"
  echo "--- Server Log ---"
  cat "$LOG_FILE"
  kill $(lsof -t -i:3001)
  exit 1
fi

# 2. Create Variant (Storage)
echo ""
echo "🎨 Creating Variant (Storage)..."
VARIANT_RES=$(curl -s -X POST "$BASE_URL/variants" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": $PRODUCT_ID,
    \"name\": \"Storage\"
  }")
echo "Response: $VARIANT_RES"

VARIANT_ID=$(echo $VARIANT_RES | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "✅ Variant ID: $VARIANT_ID"

if [ -z "$VARIANT_ID" ]; then
  echo "❌ Failed to create variant"
  kill $(lsof -t -i:3001)
  exit 1
fi

# 3. Add Variant Value (128GB)
echo ""
echo "📝 Adding Variant Value (128GB)..."
VALUE_RES=$(curl -s -X POST "$BASE_URL/variants/$VARIANT_ID/values" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"128GB\"
  }")
echo "Response: $VALUE_RES"

VALUE_ID=$(echo $VALUE_RES | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "✅ Variant Value ID: $VALUE_ID"

if [ -z "$VALUE_ID" ]; then
  echo "❌ Failed to create variant value"
  kill $(lsof -t -i:3001)
  exit 1
fi

# 4. Create Variant Combination
echo ""
echo "🔗 Creating Variant Combination..."
COMBINATION_RES=$(curl -s -X POST "$BASE_URL/variant-combinations" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": $PRODUCT_ID,
    \"sku\": \"PHONE-128-$SKU_SUFFIX\",
    \"price\": 5500000,
    \"stock\": 10,
    \"variantValueIds\": [$VALUE_ID]
  }")
echo "Response: $COMBINATION_RES"

COMBINATION_ID=$(echo $COMBINATION_RES | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "✅ Combination ID: $COMBINATION_ID"

if [ -z "$COMBINATION_ID" ]; then
  echo "❌ Failed to create variant combination"
  kill $(lsof -t -i:3001)
  exit 1
fi

# 5. Get Product with Variants
echo ""
echo "🔍 Verifying Full Product Structure..."
FULL_PRODUCT_RES=$(curl -s -X GET "$BASE_URL/products/$PRODUCT_ID/with-variants")
echo "Response: $FULL_PRODUCT_RES"

# Simple string matching for verification
if [[ $FULL_PRODUCT_RES == *"Test Phone"* ]] && [[ $FULL_PRODUCT_RES == *"Storage"* ]] && [[ $FULL_PRODUCT_RES == *"128GB"* ]]; then
  echo ""
  echo "✅ TEST PASSED: Product, Variant, Value, and Combination linked correctly!"
else
  echo ""
  echo "❌ TEST FAILED: Response missing expected data."
fi

echo ""
echo "🛑 Stopping server..."
kill $(lsof -t -i:3001)
echo "✅ Test Complete!"
exit 0
