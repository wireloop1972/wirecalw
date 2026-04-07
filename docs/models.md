# Model Policy

All AI model routing for Nevlunghavn Gjestgiveri is handled server-side by
OpenClaw. The Next.js app sends `model: "openclaw"` and never references
provider-specific model IDs. All models are accessed through the Vercel AI
Gateway — no direct provider API keys are used.

---

## Guiding Principle

> Use code for calculations and data transformation; use LLMs for
> interpretation, writing, classification, and orchestration.

Models should be poets, not calculators. If a task requires formulas, SQL,
data transformation, or numeric computation, assign it to a code-generating
agent (Devstral) or execute it directly — do not ask a language model to
do arithmetic.

---

## Verified Model Map

| Alias    | OpenClaw Model ID                                 | Vercel Gateway ID            | Status       |
|----------|---------------------------------------------------|------------------------------|--------------|
| `poe`    | `vercel-ai-gateway/mistral/mistral-medium`        | `mistral/mistral-medium`     | Active (substitute) |
| `small`  | `vercel-ai-gateway/mistral/mistral-small`         | `mistral/mistral-small`      | Active       |
| `dev`    | `vercel-ai-gateway/mistral/devstral-2`            | `mistral/devstral-2`         | Active       |

Primary model (OpenClaw default): `vercel-ai-gateway/mistral/mistral-medium`

### Substitution: Mistral Medium for Mistral Large 3

| Field              | Value                                          |
|--------------------|------------------------------------------------|
| Desired model      | `vercel-ai-gateway/mistral/mistral-large-3`    |
| Actual substitute  | `vercel-ai-gateway/mistral/mistral-medium`     |
| Reason             | OpenClaw v2026.4.2 static Vercel AI Gateway catalog does not include `mistral-large-3`. The model exists on the Vercel AI Gateway (confirmed via REST API and direct curl test returning HTTP 200), but OpenClaw's model resolution rejects it as "Unknown model". |
| Retest after       | Next OpenClaw release that updates the Vercel AI Gateway model catalog. Check with `openclaw models list --all --provider vercel-ai-gateway` for `mistral-large-3`. |
| Impact             | Mistral Medium is less capable than Large 3 for complex reasoning and nuanced writing. Acceptable for initial rollout; upgrade to Large 3 when catalog support arrives. |

---

## Usage Policy

### Mistral Medium (`mistral/mistral-medium`) — temporary substitute for Large 3

- Portier Poe live / front-desk reasoning
- Complex hotel admin reasoning
- Long-form drafting where tone matters
- Guest-facing, stylistic, interpretive, or managerial tasks

### Mistral Small (`mistral/mistral-small`)

- Paperclip heartbeats
- Issue triage and classification
- Daily summaries
- Simple operational checks ("any overdue invoices?", "any unassigned shifts?")
- Cheap background orchestration and periodic scanning

### Devstral 2 (`mistral/devstral-2`)

- SQL generation (Supabase queries, joins, analytics)
- ETL scripts and data pipeline design
- CSV normalization and structured data transformation
- Analytics notebooks and scripts
- Code refactors and developer assistance
- KPI schema proposals and dashboard query drafting

---

## Routing Rules

1. If a task is **guest-facing, stylistic, interpretive, or managerial**,
   assign to Portier Poe using the primary model (currently Mistral Medium,
   target: Mistral Large 3).

2. If a task is **cheap triage, classification, periodic scanning, or routine
   status checking**, use Mistral Small.

3. If a task requires **SQL, coding, transformations, formulas, ETL, CSV work,
   or analytics pipeline design**, assign to Devstral 2.

4. **Do not** use Poe for numeric calculations when a script, SQL query, or
   code execution is more reliable.

---

## OpenClaw Configuration

Version: `2026.4.2 (d74a122)` on DigitalOcean VM (`167.99.128.115`).

Aliases are configured in `/home/neal/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "vercel-ai-gateway/mistral/mistral-medium",
        "fallbacks": []
      },
      "models": {
        "vercel-ai-gateway/mistral/mistral-medium": { "alias": "poe" },
        "vercel-ai-gateway/mistral/mistral-small": { "alias": "small" },
        "vercel-ai-gateway/mistral/devstral-2": { "alias": "dev" }
      },
      "heartbeat": {
        "every": "30m",
        "model": "vercel-ai-gateway/mistral/mistral-small",
        "target": "last"
      }
    }
  }
}
```

---

## Auth Chain

```
Browser → Vercel (Next.js) → OpenClaw (VM :18789) → Vercel AI Gateway → Mistral
```

- All models route through the **Vercel AI Gateway** — single gateway,
  single observability layer, single billing path.
- **Self-hosted OpenClaw `2026.4.2`** resolves the bundled `vercel-ai-gateway`
  provider using **`AI_GATEWAY_API_KEY` only** (see
  `dist/extensions/vercel-ai-gateway/index.js`: single `api-key` auth method).
  There is **no** built-in path that copies `x-vercel-oidc-token` from an
  incoming `/v1/chat/completions` request into the upstream gateway
  `Authorization` header. If that header is absent and no profile supplies a
  key, runs fail with *No API key found for provider "vercel-ai-gateway"*
  (`auth-profiles.json` / env resolution).
- **`/api/poe/chat`** still sends `x-vercel-oidc-token` when
  `VERCEL_OIDC_TOKEN` is set (Vercel production/preview). That is useful for
  logging and for a **future** OpenClaw feature or fork; it does **not** change
  upstream auth today.
- **No** direct `MISTRAL_API_KEY` is needed for this stack.
- **No** OpenAI or Google/Gemini credentials are used.

### OIDC-only goal (gap)

To authenticate the gateway with **only** Vercel OIDC and **no** static
`AI_GATEWAY_API_KEY` on the VM, OpenClaw would need to treat the OIDC JWT
(from `x-vercel-oidc-token` on the HTTP chat request) as the bearer credential
for `vercel-ai-gateway` on that request. That is not implemented in `2026.4.2`;
track upstream or supply a gateway API key on the VM until it exists.

---

## Previous Models (removed)

| Role      | Old Model ID                                              | Status  |
|-----------|-----------------------------------------------------------|---------|
| Primary   | `openai-codex/gpt-5.4`                                   | Removed |
| Fallback  | `vercel-ai-gateway/google/gemini-3.1-flash-lite-preview`  | Removed |
| Heartbeat | Gemini (via Vercel AI Gateway)                            | Removed |

These were replaced on 2026-04-05 as part of the migration to Mistral under
EU-controlled infrastructure.
