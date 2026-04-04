/**
 * Poe runtime configuration.
 *
 * Current architecture (2026-04-04):
 *   Next.js (Vercel) → Caddy :80 → OpenClaw :18789 → model
 *
 * Paperclip is installed and has Portier Poe configured with an
 * openclaw_gateway adapter, but is NOT yet in the live chat path.
 * The Next.js route calls the OpenClaw HTTP chat completions
 * endpoint directly.
 *
 * Conversation continuity comes from the client sending the full
 * message history on every request. OpenClaw creates a new session
 * per HTTP request (no session reuse via the /v1/chat/completions
 * endpoint). The gateway's session store accumulates orphaned
 * single-turn sessions as a side effect.
 *
 * To add Paperclip-backed orchestration later, switch the runtime
 * mode to "paperclip-proxy" and route through Paperclip's agent
 * runtime API instead of calling OpenClaw directly.
 */

export type PoeRuntimeMode = "openclaw-direct" | "paperclip-proxy";

export const POE_RUNTIME_MODE: PoeRuntimeMode = "openclaw-direct";

export const getOpenClawConfig = () => ({
  baseUrl: process.env.OPENCLAW_BASE_URL,
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  agentId: "main",
  model: "openclaw",
});

// TODO: When Paperclip is ready for live chat, add:
// export const getPaperclipConfig = () => ({
//   baseUrl: "http://127.0.0.1:3100",
//   agentSlug: "portier-poe",
//   companySlug: "nevlunghavn-gjestgiveri",
// });
