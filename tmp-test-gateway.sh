#!/bin/bash
# Set in your shell or .env (never commit real keys).
KEY="${AI_GATEWAY_API_KEY:?set AI_GATEWAY_API_KEY}"
GW="https://ai-gateway.vercel.sh/v1/chat/completions"

for model in "mistral/mistral-large-3" "mistral/mistral-large-latest"; do
  echo "=== Testing: $model ==="
  resp=$(curl -sS -w "\n%{http_code}" -X POST "$GW" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $KEY" \
    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hi in one word.\"}],\"max_tokens\":10}")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | head -n -1)
  echo "HTTP $code"
  echo "$body" | head -c 300
  echo ""
  echo ""
done
