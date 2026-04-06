#!/bin/bash
OPENCLAW=/home/neal/.npm-global/bin/openclaw

echo "=== Check if models config can include custom entries ==="
$OPENCLAW config get agents.defaults.models 2>&1

echo ""
echo "=== Check if there's a providers or custom-models config ==="
$OPENCLAW config get providers 2>&1 || echo "(no providers key)"

echo ""
echo "=== Check vercel-ai-gateway provider config ==="
$OPENCLAW config get vercel-ai-gateway 2>&1 || echo "(no vercel-ai-gateway key)"

echo ""
echo "=== Check if model params has a passthrough or custom flag ==="
cat /home/neal/.openclaw/openclaw.json | python3 -c "
import sys, json
config = json.load(sys.stdin)
models = config.get('agents',{}).get('defaults',{}).get('models',{})
for k,v in models.items():
    print(f'{k}: {json.dumps(v)}')"

echo ""
echo "=== Try setting model with force flag ==="
$OPENCLAW models set "vercel-ai-gateway/mistral/mistral-large-3" 2>&1
