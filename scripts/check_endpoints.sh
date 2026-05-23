#!/usr/bin/env bash
# Simple health-check script for local backend endpoints
BASE=${1:-http://localhost:8000/api/v1}
ENDPOINTS=(
  "/health"
  "/auth/login"
  "/wishlist"
  "/cart"
  "/borrows"
  "/renewals"
  "/checkin/history"
)

echo "Checking API base: $BASE"
for ep in "${ENDPOINTS[@]}"; do
  url="$BASE$ep"
  status=$(curl -s -o /dev/null -w "%{http_code}" -I "$url")
  echo "$ep -> $status"
done

# Example of a POST to login (non-interactive)
echo
echo "Trying login (test123)..."
curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=test123&password=123456" -D - | sed -n '1,10p'
