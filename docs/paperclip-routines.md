# Paperclip Routines — Nevlunghavn Gjestgiveri

First operational routine set for Paperclip. These routines run as async
background tasks — they do **not** handle live guest chat, which routes
directly through OpenClaw (`POE_RUNTIME_MODE=openclaw-direct`).

See `docs/models.md` for the full model policy and `AGENTS.md` for agent
definitions.

---

## 1. Morning Briefing

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Owner         | Portier Poe                                |
| Cadence       | Daily, 07:30 local time                    |
| Primary model | Mistral Small (triage) + Mistral Medium (final narrative, substitute for Large 3) |

### Purpose

Produce a concise morning operations brief for the hotel.

### Inputs

- Inbox / email summaries
- Open Paperclip issues
- Future: BookVisit occupancy, Planday staffing, Tripletex flags, Supabase
  snapshots

### Expected Output

A comment on a daily issue thread (see `docs/paperclip-issue-templates.md`,
Template A) covering:

- Urgent guest/admin items
- Staffing anomalies
- Financial/admin flags
- Recommendations for the day

### Behavior

1. Mistral Small performs cheap scanning and triage of inputs.
2. Poe (currently Medium, target: Large 3) rewrites the final output in his
   formal style only if the brief is meant to be human-facing or guest-visible.

---

## 2. Inbox Triage

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Owner         | Portier Poe                                |
| Cadence       | Every 2–4 hours or manual heartbeat        |
| Primary model | Mistral Small                            |

### Purpose

Categorize incoming administrative work.

### Categories

- Guest request
- Booking / platform issue
- Supplier / vendor
- Finance / invoice
- Staff / planning
- Internal / admin
- Spam / ignore

### Output

Create or update Paperclip issues with labels/tags and a one-paragraph summary.

---

## 3. Weekly Ops Review

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Owner         | Portier Poe                                |
| Cadence       | Every Monday, 08:00 local time             |
| Primary model | Mistral Small (first pass) + Mistral Medium (synthesis, substitute for Large 3) |

### Purpose

Summarize the previous week operationally.

### Expected Output

A weekly issue comment (see `docs/paperclip-issue-templates.md`, Template B)
including:

- Main operational events
- Unresolved issues
- Guest-facing concerns
- Suggested management priorities

---

## 4. Data / Analytics Build Tasks

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Owner         | Devstral                                   |
| Cadence       | On-demand, issue-driven                    |
| Primary model | Devstral 2 (`mistral/devstral-2`)          |

### Purpose

Handle all tasks that require structured reasoning and code generation.

### Examples

- Write Supabase SQL to join BookVisit + Planday + Tripletex snapshots
- Generate ETL scripts to normalize CSV/API payloads
- Draft analytics notebook or script
- Propose KPI schema

### Rule

If the task requires formulas, code, SQL, or data transformation, assign it to
Devstral instead of Poe. See `docs/paperclip-issue-templates.md`, Template C
for the issue format.

---

## 5. Routine Health Check

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Owner         | Lightweight routine / default heartbeat    |
| Cadence       | Every 30–60 minutes                        |
| Primary model | Mistral Small                            |

### Purpose

Cheaply answer:

- Is there work waiting?
- Are there stale issues?
- Did any scheduled routine fail?
- Is a human escalation needed?

### Output

Either no-op (no action needed) or create/update a lightweight issue/comment.

---

## Routing Rules

These rules apply across all routines and ad-hoc Paperclip tasks.

1. **Guest-facing, stylistic, interpretive, or managerial** — assign to
   Portier Poe using the primary model (currently Mistral Medium, target:
   Mistral Large 3 when OpenClaw catalog adds support).

2. **Cheap triage, classification, periodic scanning, or routine status
   checking** — use Mistral Small.

3. **SQL, coding, transformations, formulas, ETL, CSV work, or analytics
   pipeline design** — assign to Devstral 2.

4. **Do not** use Poe for numeric calculations when a script, SQL query, or
   code execution is more reliable.

This is the core operational principle: models are poets, not calculators.

---

## Recommended First Rollout

After documentation is complete, implement these three routines first for
immediate hotel value without touching booking/finance integrations:

1. Morning Briefing
2. Inbox Triage
3. Devstral analytics issue flow
