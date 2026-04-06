#!/bin/bash
TOKEN="${OPENCLAW_BEARER_TOKEN:?set OPENCLAW_BEARER_TOKEN}"
echo "=== Testing Mistral Large 3 via OpenClaw ==="
curl -sS -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-openclaw-agent-id: main" \
  -d '{
    "model": "openclaw",
    "messages": [{"role": "user", "content": "Say hello in Norwegian, one sentence only."}]
  }' 2>&1

echo ""
echo "=== Done ==="
