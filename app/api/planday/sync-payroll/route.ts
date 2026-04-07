import { NextResponse } from "next/server";
import { syncPayroll } from "@/lib/planday/sync/payroll";
import {
  logSyncStart,
  logSyncComplete,
  logSyncError,
} from "@/lib/planday/sync/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const isAuthorized = (request: Request): boolean => {
  if (process.env.NODE_ENV === "development") return true;
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  return false;
};

const formatDate = (date: Date): string => date.toISOString().split("T")[0];

export const GET = async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const from = formatDate(monthStart);
  const to = formatDate(monthEnd);

  const logId = await logSyncStart("payroll");
  try {
    const supabase = createSupabaseAdminClient();
    const { data: depts } = await supabase.from("planday_departments").select("id");
    const deptIds = (depts ?? []).map((d) => Number(d.id));

    const count =
      deptIds.length > 0 ? await syncPayroll(deptIds, from, to) : 0;

    await logSyncComplete(logId, count);

    return NextResponse.json({
      synced_at: new Date().toISOString(),
      period: { from, to },
      records: count,
      status: "success",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSyncError(logId, msg);
    return NextResponse.json(
      { error: msg, status: "error" },
      { status: 500 },
    );
  }
};
