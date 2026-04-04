import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { POE_SYSTEM_PROMPT } from "@/lib/personas";
import { getPoeRuntimeMode, getOpenClawConfig } from "@/lib/poe-runtime";

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

export const POST = async (request: Request) => {
  const mode = getPoeRuntimeMode();

  if (mode !== "openclaw-direct") {
    return NextResponse.json(
      {
        error:
          "Paperclip proxy mode is not yet implemented. "
          + "Set POE_RUNTIME_MODE=openclaw-direct or remove the variable.",
      },
      { status: 501 },
    );
  }

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

  const messages = [
    { role: "system" as const, content: POE_SYSTEM_PROMPT },
    ...body.messages,
  ];

  console.log(
    `[poe/chat] mode=${mode} session=${sessionId}${isNew ? " (new)" : ""} `
    + `msgs=${messages.length} (${body.messages.length} client + 1 system) `
    + `roles=[${messages.map((m) => m.role).join(",")}]`,
  );

  try {
    const response = await fetch(
      `${config.baseUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "x-openclaw-agent-id": config.agentId,
          "x-session-key": `poe:${sessionId}`,
        },
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

    const res = NextResponse.json({ assistantMessage });

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
  } catch (err) {
    console.error("OpenClaw request failed:", err);
    return NextResponse.json(
      { error: "En uventet feil oppstod. Vennligst forsoek igjen." },
      { status: 500 },
    );
  }
};
