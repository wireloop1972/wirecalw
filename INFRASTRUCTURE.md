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
- `agents.defaults.model.primary`: `vercel-ai-gateway/google/gemini-3.1-flash-lite-preview`

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

## TODO / Future work

- [ ] Add custom domain + HTTPS (Caddy auto-TLS)
- [ ] Connect repo to Vercel project
- [ ] Implement Claude and Chrissie personas
- [ ] Add authentication (Clerk or similar)
- [ ] Move AI_GATEWAY_API_KEY to OIDC/token-based auth
- [ ] Add database for conversation persistence
