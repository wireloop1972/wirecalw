# Poe → Paperclip Proxy: HTTP Contract

**Status:** Design spec only — not yet active.
**Date:** 2026-04-04

---

## Overview

When `POE_RUNTIME_MODE=paperclip-proxy`, the Next.js Poe chat route proxies
requests through Paperclip's agent runtime instead of calling OpenClaw directly.
Paperclip handles orchestration, SOUL/persona, tool invocation, and memory,
while OpenClaw remains the LLM backend (via Paperclip's `openclaw_gateway`
adapter).

```
Browser → /api/poe/chat (Vercel)
       → Paperclip :3100 (agent runtime)
       → OpenClaw :18789 (LLM gateway)
       → openai-codex/gpt-5.4
```

---

## Paperclip Connection Details

| Setting           | Value                                              |
|-------------------|----------------------------------------------------|
| Base URL          | `http://127.0.0.1:3100` (localhost on the Ubuntu VM) |
| Auth              | Bearer token (server-only, never exposed to browser) |
| Agent ID          | `24b159a0-493f-4ee8-9566-08a69edc18a3` (Portier Poe) |
| Adapter           | `openclaw_gateway`                                   |
| Session strategy  | `project` (keyed by `sessionKey` from the request)   |

When the route is eventually exposed through Caddy to Vercel, replace the base
URL with the private hostname or Caddy proxy path. For now, both Vercel and
Paperclip are on the same DigitalOcean VM network.

---

## Environment Variables

| Variable                 | Example                                  | Scope       |
|--------------------------|------------------------------------------|-------------|
| `PAPERCLIP_BASE_URL`     | `http://127.0.0.1:3100`                  | Server-only |
| `PAPERCLIP_API_KEY`      | (agent JWT or server token from Paperclip) | Server-only |
| `PAPERCLIP_POE_AGENT_ID` | `24b159a0-493f-4ee8-9566-08a69edc18a3`   | Server-only |

These must be set in addition to `POE_RUNTIME_MODE=paperclip-proxy` for the
proxy path to activate. If any are missing, the route returns HTTP 500.

---

## Request Shape

```http
POST /api/agents/{agentId}/chat
Authorization: Bearer {PAPERCLIP_API_KEY}
Content-Type: application/json
x-session-key: poe-{uuid-from-cookie}
```

```json
{
  "messages": [
    { "role": "system", "content": "(POE_SYSTEM_PROMPT)" },
    { "role": "user", "content": "Hva er frokosttidene?" },
    { "role": "assistant", "content": "Frokosten serveres mellom..." },
    { "role": "user", "content": "Takk, og middag?" }
  ],
  "sessionKey": "poe-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "metadata": {
    "source": "nextjs-poe-chat",
    "hotel": "Nevlunghavn Gjestgiveri"
  }
}
```

### Field notes

- **messages**: Full conversation history including system prompt, identical to
  what the `openclaw-direct` path sends to OpenClaw. Paperclip may use its own
  SOUL/persona from the agent config, in which case the system prompt can be
  dropped from the client-side messages in a future iteration.

- **sessionKey**: The same `poe-{uuid}` cookie value used for OpenClaw session
  tracking. Paperclip uses this to maintain agent state across requests.

- **metadata**: Opaque context passed to Paperclip for logging/routing. Not
  used for auth or identity.

---

## Expected Response Shape

Paperclip's agent chat endpoint returns a response that the Next.js route maps
into the existing `{ assistantMessage: string }` format expected by the
frontend.

The exact Paperclip response shape depends on the agent runtime version. The
proxy implementation should extract the assistant's text content and normalize
it.

---

## Auth Strategy

For the initial integration, use a single static server token:

1. Generate a token in Paperclip (via the admin API or database).
2. Store it as `PAPERCLIP_API_KEY` in Vercel env vars (server-only).
3. The Next.js route sends it as `Authorization: Bearer {token}` on every
   request.

This is intentionally simple. When Paperclip's auth matures (e.g., per-user
JWTs, OAuth scopes), the auth strategy can be upgraded without changing the
route structure.

---

## Transition Plan

1. **Current state**: `openclaw-direct` — all Poe traffic goes to OpenClaw.
2. **Testing**: Set `POE_RUNTIME_MODE=paperclip-proxy` in a preview/staging
   environment. Verify Paperclip logs show agent activity.
3. **Production flip**: Set the env var in the production Vercel environment.
4. **Rollback**: Unset or change `POE_RUNTIME_MODE` to `openclaw-direct`.
   No code deploy needed.
