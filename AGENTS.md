# Agents

Agent definitions for Nevlunghavn Gjestgiveri, managed by Paperclip and routed
through OpenClaw. See `docs/models.md` for the full model policy and routing
rules.

---

## Portier Poe

| Field            | Value                                          |
|------------------|------------------------------------------------|
| Name             | Portier Poe                                    |
| Role             | Portier og daglig driftsleder                  |
| Runtime adapter  | `openclaw_gateway`                             |
| Model            | `vercel-ai-gateway/mistral/mistral-medium` (alias `poe`, substitute for Large 3) |
| Agent ID         | `24b159a0-493f-4ee8-9566-08a69edc18a3`         |
| Gateway URL      | `ws://127.0.0.1:18789`                         |
| Session strategy | `project`                                      |

### Responsibilities

- Live guest-facing chat (Next.js `/api/poe/chat` via `openclaw-direct`)
- Complex hotel admin reasoning and decision-making
- Long-form drafting where tone, formality, and persona matter
- Morning briefing final narrative (when guest/staff-facing)
- Weekly ops review synthesis

### Boundaries

- Does **not** handle numeric calculations, SQL, ETL, or code generation
- Does **not** run as a Paperclip live-chat proxy — live chat routes directly
  through OpenClaw (`POE_RUNTIME_MODE=openclaw-direct`)
- Paperclip uses Poe for async admin tasks (routines, issue comments, briefings)

---

## Devstral

| Field            | Value                                          |
|------------------|------------------------------------------------|
| Name             | Devstral                                       |
| Role             | Code & Analytics Assistant                     |
| Runtime adapter  | `openclaw_gateway`                             |
| Model            | `vercel-ai-gateway/mistral/devstral-2` (alias `dev`) |

### Responsibilities

- SQL generation for Supabase (joins, aggregations, migrations)
- ETL scripts and data pipeline design
- CSV normalization and structured data transformation
- Analytics notebooks and scripts
- Code refactors and developer assistance
- KPI schema proposals and admin dashboard query drafting

### Boundaries

- Does **not** handle guest-facing communication or persona-driven writing
- Does **not** interpret tone or provide managerial judgment
- Route tasks here when they require formulas, code, SQL, or data transformation

---

## Heartbeat / Background Worker

| Field            | Value                                          |
|------------------|------------------------------------------------|
| Name             | (default heartbeat)                            |
| Role             | Cheap background orchestration                 |
| Model            | `vercel-ai-gateway/mistral/mistral-small` (alias `small`) |

### Responsibilities

- Paperclip heartbeat cycles (is there work waiting?)
- Issue triage and classification
- Daily routine summaries
- Simple operational checks (overdue invoices, unassigned shifts)
- Stale issue detection and routine failure alerts

### Configuration note

Paperclip v2026.403.0 does not expose a per-heartbeat model override in its
public config. The heartbeat model is set in OpenClaw's agent defaults:

```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "every": "30m",
        "model": "vercel-ai-gateway/mistral/mistral-small",
        "target": "last"
      }
    }
  }
}
```

If Paperclip adds explicit heartbeat model routing in a future version, migrate
the setting there. Until then, the OpenClaw default ensures heartbeats use
Mistral Small instead of the more expensive primary model.

---

## Planday skills

Workforce data is cached in Supabase `planday_*` tables (synced from Planday via
Vercel Cron). Agents query it with the OpenClaw tool **`planday_query`**, which
POSTs read-only SQL to `https://wireclaw.vercel.app/api/planday/query` with the
gateway bearer.

### OpenClaw skills (`SKILL.md` on VM, source in `packages/openclaw-skills/`)

| Skill | Typical triggers | Tables |
|-------|------------------|--------|
| `planday-schedule` | Who is working, roster, shifts | `planday_shifts` + joins |
| `planday-wages` | Wage costs, payroll, labor NOK | `planday_time_and_cost`, `planday_payroll_snapshots` |
| `planday-absence` | Sick leave, sykefravær | `planday_shifts`, `planday_shift_types` |
| `planday-staff` | Employees, headcount, departments | `planday_employees` |
| `planday-punchclock` | Actual vs scheduled hours | `planday_punchclock` |

### Plugin

`planday-query` — local path `~/openclaw-plugins/planday-query-tool/` after
`./scripts/deploy-vm.sh`. Registers **`planday_query`**.

### Paperclip company skills

Registered for NEV via `scripts/deploy-paperclip-skills.sh`: `planday-schedule-reader`,
`planday-payroll-reporter`, `planday-absence-checker`, `planday-staff-lookup`,
`planday-punchclock-reader`. Link them to Morning Briefing / Weekly Review in
Paperclip admin.

### Routing

1. User asks a Planday question → matching skill guides SQL via **`planday_query`**.
2. Tool → Vercel → Supabase RPC → JSON rows.
3. Poe (or presentation agent) formats the answer; Devstral can draft SQL for heavy routines.

---

## Runtime Architecture

```
Live guest chat:
  Browser → Vercel (Next.js) → Caddy :80 → OpenClaw :18789 → Vercel AI Gateway → Mistral Medium
  (target: Mistral Large 3 when OpenClaw catalog adds support)

Async admin (Paperclip routines, issues, heartbeats):
  Paperclip :3100 → OpenClaw :18789 → Vercel AI Gateway → Mistral (model per agent/task)
```

Poe's live chat and Paperclip's async operations are separate paths. Paperclip
is the task engine for hotel admin operations; it is not a live-chat proxy.
