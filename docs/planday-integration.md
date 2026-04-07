# Planday integration

Read-only workforce data: Planday API → Vercel sync routes → Supabase `planday_*`
tables. OpenClaw uses the **`planday_query`** tool (plugin in
`packages/planday-query-tool/`) to run SELECT queries via
`POST /api/planday/query`. Skills live in `packages/openclaw-skills/`.

## Scopes (read-only)

HR, scheduling (shifts, time and cost), punchclock, payroll — as enabled in
your Planday app.

## OAuth

Refresh token grant: `POST https://id.planday.com/connect/token` with
`client_id` + `refresh_token`; API calls use `X-ClientId` and
`Authorization: Bearer {access_token}`.

## Deploy

- **Vercel:** env `PLANDAY_APP_ID`, `PLANDAY_TOKEN`, `CRON_SECRET`,
  `OPENCLAW_GATEWAY_TOKEN` (must match VM bearer for query tool).
- **VM:** `./scripts/deploy-vm.sh` after any `packages/` change; merge
  `packages/openclaw-skills/openclaw-planday-config.json` into
  `~/.openclaw/openclaw.json` once.
- **Paperclip:** `./scripts/deploy-paperclip-skills.sh`.

## Freshness

Main sync about every 30 minutes; payroll daily (02:00 UTC). See
`/api/planday/status` and `planday_sync_log`.

Full agent checklist: [CURSOR_PLANDAY_INSTRUCTIONS.md](../CURSOR_PLANDAY_INSTRUCTIONS.md).
