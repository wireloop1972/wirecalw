/**
 * Poe runtime configuration.
 *
 * Current architecture (2026-04-04):
 *   Browser → /api/poe/chat (Vercel) → Caddy :80 → OpenClaw :18789 → Model
 *
 * Paperclip is installed and has Portier Poe configured with an
 * openclaw_gateway adapter, but is NOT yet in the live chat path.
 * The Next.js route calls the OpenClaw HTTP chat completions
 * endpoint directly.
 *
 * To add Paperclip-backed orchestration later, set the env var
 * POE_RUNTIME_MODE=paperclip-proxy and implement the proxy handler.
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

// TODO: When Paperclip is ready for live chat, add:
// export const getPaperclipConfig = () => ({
//   baseUrl: "http://127.0.0.1:3100",
//   agentSlug: "portier-poe",
//   companySlug: "nevlunghavn-gjestgiveri",
// });
