#!/usr/bin/env bash
set -euo pipefail

VM_HOST="neal@167.99.128.115"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/paperclip-planday-skills.sql"

echo "=== Registering Paperclip company skills (idempotent) ==="

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Missing $SQL_FILE" >&2
  exit 1
fi

if ! ssh "$VM_HOST" "command -v psql >/dev/null"; then
  echo "Install PostgreSQL client on the VM: sudo apt install -y postgresql-client" >&2
  exit 1
fi

ssh "$VM_HOST" "PGPASSWORD=paperclip psql -h 127.0.0.1 -p 54329 -U paperclip -d paperclip" < "$SQL_FILE"

echo "=== Done. Restart Paperclip if needed: ssh $VM_HOST 'sudo systemctl restart paperclip' ==="
