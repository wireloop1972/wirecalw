#!/bin/bash
OCDIR=/home/neal/.npm-global/lib/node_modules/openclaw

echo "=== Check for passthrough or allowUnknown config options ==="
grep -r "passthrough\|allowUnknown\|allow_unknown\|skipValidation\|customModel" "$OCDIR/dist/" --include="*.js" -l 2>/dev/null | head -10

echo ""
echo "=== Check for dynamic discovery ==="
grep -r "discoverVercelAiGatewayModels\|/v1/models" "$OCDIR/dist/" --include="*.js" -l 2>/dev/null | head -10

echo ""
echo "=== Check static catalog content for mistral ==="
grep -r "mistral-large\|mistral-medium\|mistral-small" "$OCDIR/dist/provider-catalog-"*.js 2>/dev/null | head -5

echo ""
echo "=== Count entries in Vercel AI Gateway static catalog ==="
# Search for model definitions that look like vercel-ai-gateway/mistral
grep -c "mistral/" "$OCDIR/dist/provider-catalog-"*.js 2>/dev/null | head -5
