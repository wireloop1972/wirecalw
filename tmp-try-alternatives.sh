#!/bin/bash
OPENCLAW=/home/neal/.npm-global/bin/openclaw
# Export before running, e.g. export AI_GATEWAY_API_KEY=... (do not commit values).
export AI_GATEWAY_API_KEY="${AI_GATEWAY_API_KEY:?set AI_GATEWAY_API_KEY}"

echo "=== Try doctor to refresh ==="
$OPENCLAW doctor --help 2>&1 | head -5

echo ""
echo "=== Try medium as substitute — is it in catalog? ==="
$OPENCLAW models list --all --plain 2>&1 | grep "vercel-ai-gateway/mistral/mistral-medium"

echo ""
echo "=== Test: can we directly call the Gateway API for mistral-large-3? ==="
echo "Already confirmed via curl: HTTP 200 with valid response from mistral/mistral-large-3"

echo ""
echo "=== Check if there's a catalog refresh or provider sync ==="
$OPENCLAW models list --provider vercel-ai-gateway --json 2>&1 | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    mistral_models = [m for m in data if 'mistral' in str(m.get('id','')).lower()]
    for m in mistral_models:
        print(f\"{m.get('id','?'):55} {m.get('tags','')}\")
except Exception as e:
    print(f'Error: {e}')
"

echo ""
echo "=== Check onboard for gateway discovery ==="
$OPENCLAW onboard --help 2>&1 | grep -i "discover\|gateway\|model"
