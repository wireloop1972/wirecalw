#!/usr/bin/env bash
set -euo pipefail
# Run ON THE VM: writes ~/.openclaw/planday-query.json bearer from gateway token.
TOKEN="$(jq -r '.gateway.auth.token' "$HOME/.openclaw/openclaw.json")"
jq -n --arg t "$TOKEN" '{queryUrl:"https://wirecalw.vercel.app",bearerToken:$t}' \
  > "$HOME/.openclaw/planday-query.json"
chmod 600 "$HOME/.openclaw/planday-query.json"
echo "Wrote $HOME/.openclaw/planday-query.json"
