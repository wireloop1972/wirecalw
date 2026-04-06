#!/bin/bash
OCDIR=/home/neal/.npm-global/lib/node_modules/openclaw

echo "=== Look for model catalog files ==="
find "$OCDIR" -type f -name "*catalog*" -o -name "*models*" -o -name "*vercel*gateway*" 2>/dev/null | head -20

echo ""
echo "=== Look for provider plugin files ==="
find "$OCDIR" -type f -name "*vercel*" 2>/dev/null | head -20

echo ""
echo "=== Check for mistral-large in any catalog/registry ==="
grep -rl "mistral-large" "$OCDIR" 2>/dev/null | head -10

echo ""
echo "=== Check for vercel-ai-gateway model resolution ==="
grep -rl "Unknown model" "$OCDIR" 2>/dev/null | head -10
