#!/usr/bin/env bash
set -euo pipefail

VM_HOST="neal@167.99.128.115"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Deploying Planday plugin + skills to VM ==="

echo "[1/5] Syncing planday-query-tool plugin..."
ssh "$VM_HOST" "mkdir -p ~/openclaw-plugins/planday-query-tool"
rsync -avz --delete \
  "$ROOT_DIR/packages/planday-query-tool/" \
  "$VM_HOST:~/openclaw-plugins/planday-query-tool/"

echo "[2/5] Syncing OpenClaw skills..."
for SKILL in planday-schedule planday-wages planday-absence planday-staff planday-punchclock; do
  ssh "$VM_HOST" "mkdir -p ~/.openclaw/skills/$SKILL"
  rsync -avz \
    "$ROOT_DIR/packages/openclaw-skills/$SKILL/SKILL.md" \
    "$VM_HOST:~/.openclaw/skills/$SKILL/SKILL.md"
done

echo "[3/5] Installing plugin in OpenClaw..."
ssh "$VM_HOST" "cd ~/openclaw-plugins/planday-query-tool && npm install --omit=dev 2>/dev/null || true"
ssh "$VM_HOST" "cd ~/openclaw-plugins/planday-query-tool && openclaw plugins install -l ~/openclaw-plugins/planday-query-tool 2>/dev/null || true"

echo "[4/5] Checking systemd env for PLANDAY_QUERY_URL..."
ssh "$VM_HOST" "grep -q PLANDAY_QUERY_URL /etc/systemd/system/openclaw.service || {
  echo 'Adding PLANDAY_QUERY_URL to openclaw.service'
  sudo sed -i '/^\[Service\]/a Environment=PLANDAY_QUERY_URL=https://wireclaw.vercel.app' /etc/systemd/system/openclaw.service
  sudo systemctl daemon-reload
}"

echo "[5/5] Restarting OpenClaw..."
ssh "$VM_HOST" "sudo systemctl restart openclaw"

echo ""
echo "=== Deploy complete ==="
echo "Verify:"
echo "  ssh $VM_HOST 'openclaw tools list'"
echo "  ssh $VM_HOST 'openclaw status'"
