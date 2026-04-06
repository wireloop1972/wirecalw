import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildPoeSystemPrompt } from "@/lib/personas";
import {
  getPoeRuntimeMode,
  getOpenClawConfig,
  getPaperclipConfig,
} from "@/lib/poe-runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

const SESSION_COOKIE = "poe_sid";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const getOrCreateSessionId = async (): Promise<{
  sessionId: string;
  isNew: boolean;
}> => {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return { sessionId: existing, isNew: false };

  const sessionId = `poe-${crypto.randomUUID()}`;
  return { sessionId, isNew: true };
};

const withSessionCookie = (
  res: NextResponse,
  sessionId: string,
  isNew: boolean,
): NextResponse => {
  if (isNew) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }
  return res;
};

const handleOpenClawDirect = async (
  messages: Array<{ role: string; content: string }>,
  sessionId: string,
): Promise<NextResponse> => {
  const config = getOpenClawConfig();

  if (!config.baseUrl || !config.apiKey) {
    console.error(
      "Missing env vars:",
      !config.baseUrl ? "OPENCLAW_BASE_URL" : "",
      !config.apiKey ? "OPENCLAW_GATEWAY_TOKEN" : "",
    );
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    "x-openclaw-agent-id": config.agentId,
    "x-session-key": `poe:${sessionId}`,
  };
  if (config.oidcToken) {
    headers["x-vercel-oidc-token"] = config.oidcToken;
  }

  const response = await fetch(
    `${config.baseUrl}/v1/chat/completions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        user: sessionId,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `OpenClaw returned ${response.status}:`,
      errorText.slice(0, 500),
    );
    return NextResponse.json(
      { error: "Portieren er dessverre utilgjengelig for oieblikket." },
      { status: 500 },
    );
  }

  const data = await response.json();
  const assistantMessage =
    data?.choices?.[0]?.message?.content
    ?? "Jeg beklager, men jeg var ikke i stand til aa formulere et svar.";

  return NextResponse.json({ assistantMessage });
};

const handlePaperclipProxy = async (
  messages: Array<{ role: string; content: string }>,
  sessionId: string,
): Promise<NextResponse> => {
  const pc = getPaperclipConfig();

  if (!pc.baseUrl || !pc.apiKey || !pc.poeAgentId) {
    console.error(
      "Paperclip proxy not configured. Missing:",
      [
        !pc.baseUrl && "PAPERCLIP_BASE_URL",
        !pc.apiKey && "PAPERCLIP_API_KEY",
        !pc.poeAgentId && "PAPERCLIP_POE_AGENT_ID",
      ].filter(Boolean).join(", "),
    );
    return NextResponse.json(
      { error: "Paperclip proxy not configured." },
      { status: 500 },
    );
  }

  const pcRes = await fetch(
    `${pc.baseUrl}/api/agents/${pc.poeAgentId}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pc.apiKey}`,
        "x-session-key": sessionId,
      },
      body: JSON.stringify({
        messages,
        sessionKey: sessionId,
        metadata: {
          source: "nextjs-poe-chat",
          hotel: "Nevlunghavn Gjestgiveri",
        },
      }),
    },
  );

  if (!pcRes.ok) {
    const text = await pcRes.text();
    console.error(
      `Paperclip proxy error ${pcRes.status}:`,
      text.slice(0, 500),
    );
    return NextResponse.json(
      { error: "Portieren er dessverre utilgjengelig for oieblikket." },
      { status: 502 },
    );
  }

  const data = await pcRes.json();

  const assistantMessage =
    data?.assistantMessage
    ?? data?.choices?.[0]?.message?.content
    ?? data?.message?.content
    ?? data?.content
    ?? "Jeg beklager, men jeg var ikke i stand til aa formulere et svar.";

  return NextResponse.json({ assistantMessage });
};

export const POST = async (request: Request) => {
  const mode = getPoeRuntimeMode();

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "Messages array is required and must not be empty." },
      { status: 400 },
    );
  }

  const { sessionId, isNew } = await getOrCreateSessionId();

  let userName: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("title")
        .eq("id", user.id)
        .single();
      userName = profile?.title ?? null;
    }
  } catch {
    // Non-fatal: fall back to generic prompt if profile lookup fails
  }

  const messages = [
    { role: "system" as const, content: buildPoeSystemPrompt(userName) },
    ...body.messages,
  ];

  console.log(
    `[poe/chat] mode=${mode} session=${sessionId}${isNew ? " (new)" : ""} `
    + `msgs=${messages.length} (${body.messages.length} client + 1 system) `
    + `roles=[${messages.map((m) => m.role).join(",")}]`,
  );

  try {
    const result =
      mode === "paperclip-proxy"
        ? await handlePaperclipProxy(messages, sessionId)
        : await handleOpenClawDirect(messages, sessionId);

    result.headers.set("x-poe-runtime-mode", mode);
    return withSessionCookie(result, sessionId, isNew);
  } catch (err) {
    console.error(`[poe/chat] ${mode} request failed:`, err);
    const errRes = NextResponse.json(
      { error: "En uventet feil oppstod. Vennligst forsoek igjen." },
      { status: 500 },
    );
    errRes.headers.set("x-poe-runtime-mode", mode);
    return withSessionCookie(errRes, sessionId, isNew);
  }
};
