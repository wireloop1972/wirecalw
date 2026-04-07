import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAccessToken } from "@/lib/planday/client";

export const GET = async () => {
  const results: Record<string, unknown> = {};

  try {
    await getAccessToken();
    results.planday_auth = "ok";
  } catch (err) {
    results.planday_auth = {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: logs } = await supabase
    .from("planday_sync_log")
    .select("entity_type, status, completed_at, records_synced, error_message")
    .order("completed_at", { ascending: false })
    .limit(20);

  const latestByType: Record<string, unknown> = {};
  for (const log of logs ?? []) {
    if (!latestByType[log.entity_type]) {
      latestByType[log.entity_type] = log;
    }
  }
  results.last_syncs = latestByType;

  const tables = [
    "planday_departments",
    "planday_employees",
    "planday_shifts",
    "planday_time_and_cost",
    "planday_punchclock",
    "planday_payroll_snapshots",
  ];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    counts[table] = count ?? 0;
  }
  results.row_counts = counts;

  return NextResponse.json(results);
};
