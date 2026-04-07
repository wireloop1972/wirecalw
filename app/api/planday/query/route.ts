import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const getExpectedGatewayToken = (): string | undefined =>
  process.env.OPENCLAW_GATEWAY_TOKEN ?? process.env.OPENCLAW_API_KEY;

export const POST = async (request: Request) => {
  const authHeader = request.headers.get("authorization");
  const expectedToken = getExpectedGatewayToken();

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sql?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sql || typeof body.sql !== "string") {
    return NextResponse.json(
      { error: "Missing 'sql' field" },
      { status: 400 },
    );
  }

  const normalized = body.sql.trim().toLowerCase();
  if (!normalized.startsWith("select")) {
    return NextResponse.json(
      { error: "Only SELECT queries are allowed" },
      { status: 403 },
    );
  }

  const forbidden = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "create",
    "truncate",
  ];
  for (const keyword of forbidden) {
    if (normalized.includes(keyword)) {
      return NextResponse.json(
        { error: `Forbidden keyword: ${keyword}` },
        { status: 403 },
      );
    }
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { data, error } = await supabase.rpc("execute_planday_query", {
      query_text: body.sql,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
};
