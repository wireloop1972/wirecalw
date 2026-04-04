# wireclaw Infrastructure Reference

## Overview

wireclaw is the Next.js frontend for Wire Loop Labs AI assistants. It connects to
an OpenClaw gateway running on a DigitalOcean VM via Caddy reverse proxy.

```
Browser → Vercel (Next.js) → DigitalOcean VM (Caddy :80 → OpenClaw :18789) → Vercel AI Gateway → Claude
```

---

## DigitalOcean VM

| Field       | Value                              |
|-------------|------------------------------------|
| IP          | `167.99.128.115`                   |
| OS          | Ubuntu 24.04 LTS                   |
| Specs       | 2 vCPUs, 4 GB RAM, 120 GB NVMe    |
| User        | `neal` (sudo, SSH key auth)        |
| Node.js     | v22.22.1                           |
| npm         | 10.9.4                             |
| OpenClaw    | 2026.3.13 (61d171a)               |

### SSH access

```bash
ssh neal@167.99.128.115
```

Uses the `id_ed25519` key in `~/.ssh/`. The key has a passphrase.

---

## OpenClaw Gateway

### Service

| Field         | Value                                                    |
|---------------|----------------------------------------------------------|
| systemd unit  | `/etc/systemd/system/openclaw.service`                   |
| Run as        | `neal:neal`                                              |
| ExecStart     | `/usr/bin/openclaw gateway run --bind lan --port 18789`  |
| Restart       | `always` (5s delay)                                      |

### Common commands

```bash
# Status
sudo systemctl status openclaw --no-pager

# Restart after config changes
sudo systemctl restart openclaw

# View recent logs
journalctl -u openclaw --no-pager -n 50

# Detailed OpenClaw logs (date-stamped)
cat /tmp/openclaw-1000/openclaw-$(date +%Y-%m-%d).log
```

### Configuration

**Path:** `/home/neal/.openclaw/openclaw.json`

Key settings:
- `gateway.port`: 18789
- `gateway.mode`: "local"
- `gateway.bind`: "lan"
- `gateway.auth.mode`: "token" (bearer token in config)
- `gateway.http.endpoints.chatCompletions.enabled`: true
- `agents.defaults.model.primary`: `openai-codex/gpt-5.4` (OpenAI Codex via OAuth)
- `agents.defaults.model.fallbacks`: `vercel-ai-gateway/google/gemini-3.1-flash-lite-preview`
- `tools.byProvider` restricts Gemini to `minimal` profile (no tool calls)
- `agents.defaults.heartbeat.model`: Gemini (cheap pings every 30m)

### Environment variables (in systemd unit)

| Variable                     | Purpose                                   |
|------------------------------|-------------------------------------------|
| `OPENCLAW_GATEWAY_PASSWORD`  | Gateway admin password                    |
| `AI_GATEWAY_API_KEY`         | Vercel AI Gateway API key                 |
| `HOME`                       | Set to `/home/neal`                       |
| `OPENCLAW_NO_RESPAWN`        | Set to `1`                                |

### Chat completions endpoint

```bash
curl -sS -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <GATEWAY_TOKEN>" \
  -H "x-openclaw-agent-id: main" \
  -d '{
    "model": "openclaw",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Health check

```bash
curl http://127.0.0.1:18789/global/health
```

---

## Caddy Reverse Proxy

| Field       | Value                                  |
|-------------|----------------------------------------|
| Config      | `/etc/caddy/Caddyfile`                 |
| Listens     | `:80` (HTTP only, no TLS yet)          |
| Proxies to  | `127.0.0.1:18789`                      |
| Logs        | `/var/log/caddy/openclaw.log`          |

### Common commands

```bash
sudo systemctl status caddy --no-pager
sudo systemctl restart caddy
```

### Features

- gzip encoding
- WebSocket upgrade support
- Security headers: X-Frame-Options, Referrer-Policy, X-Content-Type-Options
- Request logging with rotation (10 MB, keep 5)

---

## Firewall (UFW)

| Port  | Rule        |
|-------|-------------|
| 22    | Allow (SSH) |
| 80    | Allow (HTTP via Caddy) |
| 18789 | Deny (OpenClaw direct — localhost only) |

```bash
sudo ufw status verbose
```

---

## Directories on the VM

| Path                          | Purpose                    |
|-------------------------------|----------------------------|
| `/home/neal/.openclaw/`       | OpenClaw config            |
| `/home/neal/wireclaw-data/`   | App data (future use)      |
| `/home/neal/wireclaw-data/logs/` | App logs (future use)   |

---

## Next.js App (this repo)

### Required environment variables

Set these in Vercel (or `.env.local` for local dev):

| Variable                 | Example                       | Used in            |
|--------------------------|-------------------------------|--------------------|
| `OPENCLAW_BASE_URL`      | `http://167.99.128.115`       | Route handlers     |
| `OPENCLAW_GATEWAY_TOKEN` | (gateway auth token from VM)  | Route handlers     |
| `POE_RUNTIME_MODE`       | `openclaw-direct` (default)   | Poe route handler  |

`POE_RUNTIME_MODE` controls whether Poe chat routes through OpenClaw directly
(`openclaw-direct`, the default) or through Paperclip (`paperclip-proxy`, not
yet implemented). See `docs/poe-runtime-audit.md` for details.

These are read **only** in server-side route handlers, never exposed to the client.

### Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with real values
npm run dev
```

### Key paths

| Path                            | Purpose                              |
|---------------------------------|--------------------------------------|
| `app/api/poe/chat/route.ts`    | Route handler: Poe → OpenClaw        |
| `components/chat/PoeChat.tsx`   | Chat UI component                    |
| `hooks/usePoeChat.ts`          | Client-side chat state hook          |
| `lib/personas.ts`              | Persona definitions + system prompts |

---

## Paperclip (AI Agent Orchestration)

### Service

| Field         | Value                                                    |
|---------------|----------------------------------------------------------|
| systemd unit  | `/etc/systemd/system/paperclip.service`                  |
| Run as        | `neal`                                                   |
| ExecStart     | `/usr/bin/npx paperclipai run`                           |
| Port          | `127.0.0.1:3100` (localhost only, no Caddy exposure yet) |
| Version       | 2026.325.0                                               |
| Deployment    | `local_trusted` (private)                                |
| Database      | Embedded PostgreSQL (port 54329, data in `~/.paperclip/instances/default/db`) |

### Common commands

```bash
sudo systemctl status paperclip --no-pager
sudo systemctl restart paperclip
journalctl -u paperclip --no-pager -n 50

curl -sS http://127.0.0.1:3100/api/health
```

### Company & Agent

| Entity                    | Value                                          |
|---------------------------|-------------------------------------------------|
| Company                   | Nevlunghavn Gjestgiveri (`NEV`)                |
| Company ID                | `54cdb0a4-7810-46ad-bd0d-895d630bb698`         |
| Agent                     | Portier Poe                                    |
| Agent ID                  | `24b159a0-493f-4ee8-9566-08a69edc18a3`         |
| Adapter                   | `openclaw_gateway`                             |
| Gateway URL               | `ws://127.0.0.1:18789`                         |
| Session strategy          | `project`                                      |

### Configuration files

| Path                                                | Purpose                    |
|-----------------------------------------------------|----------------------------|
| `~/.paperclip/instances/default/config.json`        | Paperclip server config    |
| `~/.paperclip/instances/default/.env`               | Agent JWT secret           |
| `~/.paperclip/instances/default/logs/server.log`    | Server log                 |
| `~/.paperclip/instances/default/secrets/master.key` | Encryption master key      |

### Known issues (v2026.325.0)

- `PATCH /api/agents/{id}` returns 500 (route likely missing in this version)
- `DELETE /api/companies/{id}` fails with FK constraint on `company_skills`
- Adapter config changes require direct DB update (user `paperclip`, pass `paperclip`, port 54329)

---

## TODO / Future work

- [ ] Add custom domain + HTTPS (Caddy auto-TLS)
- [ ] Connect repo to Vercel project
- [ ] Implement Claude and Chrissie personas
- [ ] Add authentication (Clerk or similar)
- [ ] Move AI_GATEWAY_API_KEY to OIDC/token-based auth
- [ ] Add database for conversation persistence
- [ ] Expose Paperclip UI via Caddy (when ready for external access)
- [ ] Enable Portier Poe heartbeat once OpenClaw wiring is verified end-to-end
- [ ] Upgrade Paperclip when PATCH /api/agents is fixed
