#!/bin/bash
OCDIR=/home/neal/.npm-global/lib/node_modules/openclaw
echo "=== Mistral model IDs in Vercel AI Gateway catalog module ==="
grep -oE '"mistral/[a-z0-9-]+"' "$OCDIR/dist/models-CJ6dUSpD.js" | sort -u

echo ""
echo "=== Check for discoverVercelAiGatewayModels implementation ==="
grep -c "discoverVercelAiGatewayModels" "$OCDIR/dist/models-CJ6dUSpD.js"

echo ""
echo "=== Check for /v1/models fetch ==="
grep -c "v1/models" "$OCDIR/dist/models-CJ6dUSpD.js"

echo ""
echo "=== Check for customModels or passthrough in agent runtime ==="
grep -oE '"[a-z]+[Mm]odels?"' "$OCDIR/dist/agent-runtime-B7ucOTD-.js" | sort -u | head -20
