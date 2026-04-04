# Poe Runtime Audit

**Date:** 2026-04-04 (updated)
**Auditor:** Cursor agent
**Scope:** Determine the actual runtime path for Poe chat requests and whether
Paperclip, OpenClaw session persistence, or memory features are in use.

---

## Current Request Path

```
Browser (React state) → /api/poe/chat (Vercel) → Caddy :80 → OpenClaw :18789 → Model
```

The Next.js route (`app/api/poe/chat/route.ts`) calls OpenClaw's
`/v1/chat/completions` endpoint directly via HTTP. It sends:

- `Authorization: Bearer <token>` (gateway token)
- `x-openclaw-agent-id: main` (the default agent)
- `x-session-key: poe:<session-id>` (stable per-browser session, cookie-backed)
- `model: "openclaw"` (OpenClaw resolves to configured primary/fallback)
- `user: <session-id>` (OpenAI-standard user field for session tracking)
- Full message array: `[system_prompt, ...client_history]`

No Paperclip API is called anywhere in the application.

---

## Runtime Mode

The Poe runtime mode is controlled by the `POE_RUNTIME_MODE` env var:

- **`openclaw-direct`** (default): Next.js calls OpenClaw directly.
  This is the current production mode.
- **`paperclip-proxy`**: Would route through Paperclip's agent runtime.
  **Not yet implemented.** Setting this value will intentionally return
  HTTP 501 until the proxy handler is added.

As of now, `POE_RUNTIME_MODE` must remain `openclaw-direct` (or be unset).
Changing it to `paperclip-proxy` will intentionally return HTTP 501 until
the proxy implementation is added.

The mode is read from the environment via `getPoeRuntimeMode()` in
`lib/poe-runtime.ts` — no code change needed to switch modes, just set the
env var on Vercel or in `.env.local`.

---

## Is Paperclip Used?

**No.** Zero Paperclip API calls exist in the Next.js codebase. The only
Paperclip references are in `INFRASTRUCTURE.md` (documentation) and a one-off
database migration script (`tmp_update_agent.mjs`).

Paperclip is installed and running on the server:

```
curl http://127.0.0.1:3100/api/health
→ {"status":"ok","version":"2026.325.0","deploymentMode":"local_trusted"}
```

However, its embedded PostgreSQL has shared memory errors (code 58P01) and its
heartbeat/scheduler/routine ticks are all failing. The Portier Poe agent is
configured in the Paperclip database with an `openclaw_gateway` adapter, but no
traffic reaches it. See **Paperclip PostgreSQL Status** below for diagnosis.

---

## Session Continuity

### Before this patch

OpenClaw created a new session for every HTTP request to
`/v1/chat/completions`. Evidence:

- `openclaw status` showed **92 active sessions**, all with unique UUIDs
- Session keys followed the pattern `agent:main:openai:{random-uuid}`
- Each session had only ~9.7-9.9k tokens (single-turn conversations)
- The route sent no session key, thread ID, or conversation ID

### After this patch

The route now:

1. **Generates a stable session ID** per browser via an `httpOnly` cookie
   (`poe_sid`), persisted for 30 days.
2. **Sends the session ID** to OpenClaw via:
   - `x-session-key: poe:<session-id>` header
   - `user: <session-id>` body field (OpenAI-standard)
3. **Logs the session ID** in every request for traceability.

Whether OpenClaw uses `x-session-key` for session routing depends on the
gateway version. Even if it doesn't, the `user` field appears in OpenClaw's
session metadata and the cookie ensures consistent identity per browser.

**Primary continuity still comes from the client.** The `usePoeChat` hook
sends the full message history on every request. If the user refreshes the
page, React state is lost. Server-side session persistence via OpenClaw is
a secondary benefit, not the primary mechanism.

---

## What Currently Provides "Memory"?

**Client-side React state only.**

The `usePoeChat` hook (`hooks/usePoeChat.ts`) maintains conversation entries in
`useState`. On every message send, it maps all entries to
`{role: "user"|"assistant", content}` format and includes them in the API
request body. The API route prepends the system prompt and forwards everything
to OpenClaw.

If the user refreshes the page, all conversation history is lost.

OpenClaw's memory feature is technically present but unused:
```
Memory: 0 files · 0 chunks · sources memory · plugin memory-core · vector unknown
```

---

## Model in Use

All recent sessions show `google/gemini-3.1-flash-lite-preview` (the fallback),
not `openai-codex/gpt-5.4` (the configured primary). This indicates the OpenAI
Codex OAuth token has expired, causing silent fallback to Gemini.

Config from `~/.openclaw/openclaw.json`:
- Primary: `openai-codex/gpt-5.4`
- Fallback: `vercel-ai-gateway/google/gemini-3.1-flash-lite-preview`

`openclaw models list` output:
```
Model                                      Input      Ctx      Local Auth  Tags
openai-codex/gpt-5.4                       text+image 266k     no    yes   default,configured,alias:codex
vercel-ai-gateway/google/gemini-3.1-fla... text+image 977k     no    no    fallback#1,configured,alias:gflash
```

**Action required:** Re-authenticate Codex OAuth interactively. See
**Manual Steps** below.

---

## Paperclip PostgreSQL Status

**Diagnosis (2026-04-04):**

The embedded PostgreSQL (port 54329) has lost its POSIX shared memory segment.
The process is running but all DB operations fail with:

```
FATAL: could not open shared memory segment "/PostgreSQL.1535214680": No such file or directory
(code 58P01, file dsm_impl.c:266, routine dsm_impl_posix)
```

This causes cascading failures in:
- `plugin-job-scheduler` (scheduler tick error)
- `heartbeat timer tick`
- `routine scheduler tick`
- `periodic heartbeat recovery`

**System resources are fine:**
- `/dev/shm`: 2.0G total, 1.1M used (99.9% free)
- `kernel.shmmax`: 18446744073692774399 (unlimited)
- `kernel.shmall`: 18446744073692774399 (unlimited)

The issue is that the shared memory segment was cleaned up (likely by a reboot
or tmpfs cleanup) while the PostgreSQL process was still running. The fix is a
clean service restart, which requires `sudo`. See **Manual Steps** below.

---

## Tools

No tools are enabled in the chat route. The request body contains only `model`,
`messages`, and `user`. OpenClaw's tool profiles (`coding` for primary,
`minimal` for Gemini) are configured server-side but only apply when the gateway
itself invokes tools for its own agent sessions, not for passthrough HTTP
completions.

---

## Poe Instructions Source

The system prompt (`POE_SYSTEM_PROMPT`) is hardcoded in `lib/personas.ts` in the
Next.js app. It is not pulled from Paperclip's agent configuration. Paperclip has
its own SOUL/instructions stored in the `agents` table, but these are not read
by the current live chat path.

---

## Architecture Summary

| Component             | Status                              | In Poe chat path? |
|-----------------------|-------------------------------------|--------------------|
| Next.js route         | Active, env-driven mode             | Yes                |
| OpenClaw gateway      | Running, healthy                    | Yes (HTTP pass-through) |
| Session cookie        | `poe_sid`, 30-day `httpOnly`        | Yes (identity)     |
| OpenClaw sessions     | Stable key via `x-session-key`      | Yes (monitoring)   |
| OpenClaw memory       | Enabled, 0 files/chunks             | No                 |
| Paperclip             | Running (DB errors, needs restart)  | No                 |
| Paperclip Portier Poe | Configured, `openclaw_gateway`      | No                 |

---

## Changes Made

### Phase 8D (2026-04-04, commit ea8055e)

1. Runtime mode abstraction (`lib/poe-runtime.ts`)
2. Enhanced logging (`app/api/poe/chat/route.ts`)
3. System prompt memory and emote fixes

### Phase 3 — Env-driven runtime mode (2026-04-04)

- `getPoeRuntimeMode()` now reads `POE_RUNTIME_MODE` from env instead of
  using a hardcoded constant.
- `getOpenClawConfig()` accepts both `OPENCLAW_API_KEY` and
  `OPENCLAW_GATEWAY_TOKEN` (preference to API_KEY).
- `.env.example` updated with the new variable.

### Phase 4 — Stable session key (2026-04-04)

- Route generates a `poe-{uuid}` session ID on first request and persists it
  in an `httpOnly` cookie (`poe_sid`, 30 days, `secure` in production).
- Session ID is sent to OpenClaw as `x-session-key` header and `user` body
  field.
- Every log line now includes the session ID for traceability.

---

## Manual Steps Required

These steps require an interactive terminal on the Ubuntu server
(`ssh neal@167.99.128.115`, then `tmux attach -t ops`):

### 1. Restart Paperclip (fix PostgreSQL shared memory)

```bash
sudo systemctl restart paperclip
sleep 5
systemctl status paperclip --no-pager
curl -sS http://127.0.0.1:3100/api/health
journalctl -u paperclip -n 20 --no-pager
```

Verify: health returns `{"status":"ok"}` and no `58P01` errors in logs.

### 2. Re-authenticate OpenAI Codex OAuth

```bash
openclaw models auth login --provider openai-codex
```

This opens an interactive OAuth flow. Follow the URL in a browser, authorize,
and return to the terminal. Then verify:

```bash
openclaw models list
openclaw status
```

Verify: sessions start using `openai-codex/gpt-5.4` instead of the Gemini
fallback.

---

## Recommendations for Next Steps

1. **Complete manual steps above** — Codex re-auth and Paperclip restart.

2. **Clean up OpenClaw sessions** — 92+ orphaned sessions accumulate from
   previous stateless HTTP requests. These can be pruned or ignored.

3. **Add persistent conversation storage** — When ready, store conversations
   in Supabase so they survive page refreshes. Independent of
   OpenClaw/Paperclip.

4. **Paperclip integration** — When Paperclip's DB is stable, set
   `POE_RUNTIME_MODE=paperclip-proxy` and implement the proxy handler. This
   would enable Paperclip's orchestration, tools, routines, and memory for
   Poe, while keeping OpenClaw as the LLM backend.
