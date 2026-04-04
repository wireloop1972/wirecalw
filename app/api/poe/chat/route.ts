import { NextResponse } from "next/server";
import { POE_SYSTEM_PROMPT } from "@/lib/personas";
import { POE_RUNTIME_MODE, getOpenClawConfig } from "@/lib/poe-runtime";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

export const POST = async (request: Request) => {
  if (POE_RUNTIME_MODE !== "openclaw-direct") {
    return NextResponse.json(
      { error: "Paperclip proxy mode is not yet implemented." },
      { status: 501 },
    );
  }

  const config = getOpenClawConfig();

  if (!config.baseUrl || !config.token) {
    console.error(
      "Missing env vars:",
      !config.baseUrl ? "OPENCLAW_BASE_URL" : "",
      !config.token ? "OPENCLAW_GATEWAY_TOKEN" : "",
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

  const messages = [
    { role: "system" as const, content: POE_SYSTEM_PROMPT },
    ...body.messages,
  ];

  console.log(
    `[poe/chat] mode=${POE_RUNTIME_MODE} `
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
          Authorization: `Bearer ${config.token}`,
          "x-openclaw-agent-id": config.agentId,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
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
  } catch (err) {
    console.error("OpenClaw request failed:", err);
    return NextResponse.json(
      { error: "En uventet feil oppstod. Vennligst forsoek igjen." },
      { status: 500 },
    );
  }
};
