# Cursor agent instructions — Planday integration (skill-based)

**Single authoritative spec** for this repo. Three tracks, eight verification steps.

## Context

- **Repo:** `wireloop1972/wirecalw` — Next.js on Vercel, Supabase, AI on DO VM
  (`167.99.128.115`): OpenClaw `:18789`, Paperclip `:3100`.
- **Goal:** Read-only Planday workforce data for questions like “who works
  tomorrow?”, wage costs, sick leave, punchclock vs schedule.
- **Principle:** Skills teach *what to do*; the **`planday_query`** tool does it.

## Architecture

```
                                    ┌────────────────────────────┐
                                    │  Planday API               │
                                    │  openapi.planday.com       │
                                    └──────────┬─────────────────┘
                                               │
                              ┌────────────────▼────────────────┐
                              │  Vercel (Next.js)                │
                              │  /api/planday/sync   (cron)      │
                              │  /api/planday/query  (tool API)  │
                              └────────────────┬────────────────┘
                                               │
                              ┌────────────────▼────────────────┐
                              │  Supabase  planday_* tables      │
                              └────────────────┬────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────┐
│  DigitalOcean VM (167.99.128.115)                                            │
│  OpenClaw: ~/.openclaw/skills/planday-*/SKILL.md + planday-query plugin      │
│  Paperclip: company_skills (see scripts/paperclip-planday-skills.sql)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**End-to-end:** User → Poe chat → OpenClaw + skill → `planday_query` →
`POST https://wirecalw.vercel.app/api/planday/query` → JSON → Norwegian answer.

## Three tracks

| Track | What | Where |
|-------|------|--------|
| **1** | Vercel pipeline: client, sync modules, API routes, migration `005`, `vercel.json` crons | `lib/planday/`, `app/api/planday/`, `supabase/migrations/005_planday_cache.sql` |
| **2** | Poe persona (`PLANDAY_CONTEXT`, `planday_query`) | `lib/personas.ts` |
| **3** | Plugin + skills + deploy | `packages/planday-query-tool/`, `packages/openclaw-skills/`, `scripts/deploy-vm.sh`, `scripts/deploy-paperclip-skills.sh`, `scripts/paperclip-planday-skills.sql` |

## Environment

**Vercel / `.env.local`:** `PLANDAY_APP_ID` (fallback `PALNDAY_APP_ID`), `PLANDAY_TOKEN`, `CRON_SECRET`, `OPENCLAW_GATEWAY_TOKEN` (and Supabase vars).

**VM:** `~/.openclaw/planday-query.json` holds `queryUrl` + `bearerToken` (see `scripts/vm-init-planday-query.sh`). OpenClaw **2026.4.x** rejects `agents.defaults.skills` in `openclaw.json` — use `skills.entries` + SKILL.md folders only. **`bearerToken` must match Vercel `OPENCLAW_GATEWAY_TOKEN`.** Do not rename **wireclaw** → **wirecalw** inside `openclaw.json` for provider or display naming; **wirecalw** belongs only in URL hosts (`queryUrl`, `PLANDAY_QUERY_URL`).

## Deploy workflow

1. Push → Vercel builds Track 1–2.
2. Apply migration `005_planday_cache.sql` (Supabase CLI, dashboard, or MCP).
3. From repo root: `./scripts/deploy-vm.sh` after any `packages/` change.
4. First time: merge `packages/openclaw-skills/openclaw-planday-config.json` into `~/.openclaw/openclaw.json`.
5. `./scripts/deploy-paperclip-skills.sh` (idempotent). Wire routines in Paperclip UI.

Also: `chmod +x scripts/deploy-vm.sh scripts/deploy-paperclip-skills.sh` on Unix.

## Verification (8 steps)

1. `GET https://wirecalw.vercel.app/api/planday/status` → `planday_auth: "ok"`.
2. Supabase: `planday_*` tables exist.
3. `GET https://wirecalw.vercel.app/api/planday/sync` with `Authorization: Bearer $CRON_SECRET` → per-entity results.
4. `POST https://wirecalw.vercel.app/api/planday/query` with `Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN` and body `{"sql":"SELECT first_name, last_name FROM planday_employees LIMIT 3"}`.
5. `ssh neal@167.99.128.115` → `ls ~/.openclaw/skills/planday-*/SKILL.md` (5 files).
6. `openclaw tools list` on VM includes **`planday_query`**.
7. Browser Poe chat: e.g. “Hvem jobber i morgen?” → tool call → answer.
8. Paperclip: five `company_skills` rows present; routines linked in admin.

## Implementation reference

- **Planday client:** `lib/planday/client.ts` — token cache, `plandayGet`, `plandayGetAll`.
- **Sync:** `lib/planday/sync/*.ts` — departments, employee-groups, shift-types, employees, shifts, time-and-cost, punchclock, payroll, log.
- **Routes:** `app/api/planday/sync`, `sync-payroll`, `status`, `query`.
- **Query auth:** `OPENCLAW_GATEWAY_TOKEN ?? OPENCLAW_API_KEY` on Vercel.
- **RPC:** `execute_planday_query` in migration (read-only SELECT).
- **Plugin:** `packages/planday-query-tool/index.js` — `definePluginEntry`, Typebox params.
- **Skills:** five folders under `packages/openclaw-skills/*/SKILL.md`.

## Paperclip SQL note

`scripts/paperclip-planday-skills.sql` assumes `company_skills(company_id uuid, …)`.
If your Paperclip schema differs, adjust casts or columns before running.

## Docs in repo

- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) — SSH/rsync, env table, commands.
- [AGENTS.md](AGENTS.md) — skill ↔ table routing.
- [docs/planday-integration.md](docs/planday-integration.md) — overview.
