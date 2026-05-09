#!/bin/bash

# Deployment Verification Script
# Run this after deployment to verify everything is working

set -e

echo "🔍 Employ.me Deployment Verification"
echo "===================================="
echo ""

# Check for required arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <heroku-app-name> <vercel-url>"
    echo "Example: $0 employme-api https://employme.vercel.app"
    exit 1
fi

HEROKU_APP="$1"
VERCEL_URL="$2"
BACKEND_URL="https://${HEROKU_APP}.herokuapp.com"
API_URL="${BACKEND_URL}/api"

echo "Backend: $BACKEND_URL"
echo "Frontend: $VERCEL_URL"
echo "API: $API_URL"
echo ""

# Test results
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        status=$(echo "$response" | tail -n1)
        
        if [ "$status" -ge 200 ] && [ "$status" -lt 500 ]; then
            echo "✅ OK ($status)"
            ((PASSED++))
        else
            echo "❌ Failed ($status)"
            ((FAILED++))
        fi
    else
        echo "❌ Connection failed"
        ((FAILED++))
    fi
}

echo "🔗 Connectivity Tests"
echo "-------------------"
test_endpoint "Backend health" "$BACKEND_URL/health"
test_endpoint "API health" "$API_URL/health"

echo ""
echo "📊 API Tests"
echo "----------"
test_endpoint "Get jobs" "$API_URL/jobs"
test_endpoint "Get employers" "$API_URL/employers"

echo ""
echo "🌐 CORS Tests"
echo "-----------"
if curl -s -I -X OPTIONS "$API_URL/health" \
    -H "Origin: $VERCEL_URL" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null | \
    grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
    ((PASSED++))
else
    echo "❌ CORS headers missing"
    ((FAILED++))
fi

echo ""
echo "======================================"
echo "Results: $PASSED passed ✅, $FAILED failed ❌"
echo "======================================"

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️ Some tests failed. Check your configuration."
    exit 1
fi
