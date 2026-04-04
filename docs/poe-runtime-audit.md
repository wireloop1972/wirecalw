# Poe Runtime Audit

**Date:** 2026-04-04
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
- `model: "openclaw"` (OpenClaw resolves to configured primary/fallback)
- Full message array: `[system_prompt, ...client_history]`

No Paperclip API is called anywhere in the application.

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
heartbeat recovery is failing. The Portier Poe agent is configured in the
Paperclip database with an `openclaw_gateway` adapter, but no traffic reaches it.

---

## Does Stable Session Continuity Exist?

**No.** OpenClaw creates a new session for every HTTP request to
`/v1/chat/completions`. Evidence:

- `openclaw status` shows **92 active sessions**, all with unique UUIDs
- Session keys follow the pattern `agent:main:openai:{random-uuid}`
- Each session has only ~9.7-9.9k tokens (single-turn conversations)
- The route sends no session key, thread ID, or conversation ID header

OpenClaw's HTTP chat completions endpoint is stateless by design. Session
persistence is intended for WebSocket connections and the CLI, not for HTTP.

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
Codex OAuth token may have expired, causing silent fallback to Gemini.

Config from `~/.openclaw/openclaw.json`:
- Primary: `openai-codex/gpt-5.4`
- Fallback: `vercel-ai-gateway/google/gemini-3.1-flash-lite-preview`

---

## Tools

No tools are enabled in the chat route. The request body contains only `model`
and `messages`. OpenClaw's tool profiles (`coding` for primary, `minimal` for
Gemini) are configured server-side but only apply when the gateway itself
invokes tools for its own agent sessions, not for passthrough HTTP completions.

---

## Poe Instructions Source

The system prompt (`POE_SYSTEM_PROMPT`) is hardcoded in `lib/personas.ts` in the
Next.js app. It is not pulled from Paperclip's agent configuration. Paperclip has
its own SOUL/instructions stored in the `agents` table, but these are not read
by the current live chat path.

---

## Architecture Summary

| Component           | Status                              | In Poe chat path? |
|---------------------|-------------------------------------|--------------------|
| Next.js route       | Active                              | Yes                |
| OpenClaw gateway    | Running, healthy                    | Yes (HTTP pass-through) |
| OpenClaw sessions   | 92 orphaned single-turn sessions    | Created but not reused |
| OpenClaw memory     | Enabled, 0 files/chunks             | No                 |
| Paperclip           | Running (DB errors)                 | No                 |
| Paperclip Portier Poe | Configured, `openclaw_gateway` adapter | No              |

---

## Changes Made (Phase 8D)

### 1. Runtime mode abstraction (`lib/poe-runtime.ts`)

Added `PoeRuntimeMode` type (`"openclaw-direct" | "paperclip-proxy"`) and
`getOpenClawConfig()` helper. Defaulted to `openclaw-direct`. The route now
uses this config, making the architecture explicit and preparing for a future
Paperclip handoff without rewriting the route.

### 2. Enhanced logging (`app/api/poe/chat/route.ts`)

The route now logs runtime mode, total message count, client message count, and
role sequence on every request. This makes it trivial to verify in Vercel
function logs that conversation history is arriving correctly.

### 3. Previous fixes (already committed)

- System prompt rewritten to preserve conversation memory and avoid re-greeting
- Client hook uses `useRef` to avoid stale closure issues with entries
- Stage directions / emotes removed from prompt

---

## Recommendations for Next Steps

1. **Re-authenticate OpenAI Codex** — The primary model is not being used.
   Run `openclaw models auth login --provider openai-codex` in a tmux session
   to refresh the OAuth token.

2. **Fix Paperclip PostgreSQL** — The embedded DB has shared memory errors.
   Restart the Paperclip service (`sudo systemctl restart paperclip`) and
   monitor logs. If the issue persists, the server may need more shared memory
   (`/dev/shm` or `sysctl kernel.shmmax`).

3. **Clean up OpenClaw sessions** — 92 orphaned sessions accumulate from HTTP
   requests. These can be pruned periodically or ignored (they are lightweight).

4. **Add persistent conversation storage** — When ready, store conversations in
   Supabase or a similar DB so they survive page refreshes. This is independent
   of the OpenClaw/Paperclip question.

5. **Paperclip integration** — When Paperclip's DB is stable, switch
   `POE_RUNTIME_MODE` to `"paperclip-proxy"` and implement the Paperclip agent
   runtime API call. This would enable Paperclip's orchestration, tools,
   routines, and memory for Poe, while keeping OpenClaw as the LLM backend.
