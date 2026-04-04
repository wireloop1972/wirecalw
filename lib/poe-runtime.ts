/**
 * Poe runtime configuration.
 *
 * Two runtime modes, controlled by the POE_RUNTIME_MODE env var:
 *
 *   openclaw-direct (default):
 *     Browser → /api/poe/chat (Vercel) → Caddy :80 → OpenClaw :18789 → Model
 *
 *   paperclip-proxy:
 *     Browser → /api/poe/chat (Vercel) → Paperclip :3100 → OpenClaw :18789 → Model
 *
 * See docs/poe-paperclip-proxy.md for the full HTTP contract.
 */

export type PoeRuntimeMode = "openclaw-direct" | "paperclip-proxy";

export const getPoeRuntimeMode = (): PoeRuntimeMode => {
  const raw = process.env.POE_RUNTIME_MODE?.toLowerCase();
  if (raw === "paperclip-proxy") return "paperclip-proxy";
  return "openclaw-direct";
};

export const getOpenClawConfig = () => ({
  baseUrl: process.env.OPENCLAW_BASE_URL!,
  apiKey: process.env.OPENCLAW_API_KEY ?? process.env.OPENCLAW_GATEWAY_TOKEN,
  agentId: "main",
  model: "openclaw",
});

export const getPaperclipConfig = () => ({
  baseUrl: process.env.PAPERCLIP_BASE_URL,
  apiKey: process.env.PAPERCLIP_API_KEY,
  poeAgentId: process.env.PAPERCLIP_POE_AGENT_ID,
} as const);
