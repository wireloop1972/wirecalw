import { NextResponse } from "next/server";
import { syncDepartments } from "@/lib/planday/sync/departments";
import { syncEmployeeGroups } from "@/lib/planday/sync/employee-groups";
import { syncShiftTypes } from "@/lib/planday/sync/shift-types";
import { syncEmployees } from "@/lib/planday/sync/employees";
import { syncShifts } from "@/lib/planday/sync/shifts";
import { syncTimeAndCost } from "@/lib/planday/sync/time-and-cost";
import { syncPunchclock } from "@/lib/planday/sync/punchclock";
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

  const results: Record<string, { count: number; status: string; error?: string }> =
    {};

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksOut = new Date(today);
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  const fromDate = formatDate(weekAgo);
  const toDate = formatDate(twoWeeksOut);

  for (const [name, fn] of [
    ["departments", syncDepartments],
    ["employee_groups", syncEmployeeGroups],
    ["shift_types", syncShiftTypes],
    ["employees", syncEmployees],
  ] as const) {
    const logId = await logSyncStart(name);
    try {
      const count = await fn();
      await logSyncComplete(logId, count);
      results[name] = { count, status: "success" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logSyncError(logId, msg);
      results[name] = { count: 0, status: "error", error: msg };
    }
  }

  {
    const logId = await logSyncStart("shifts");
    try {
      const count = await syncShifts(fromDate, toDate);
      await logSyncComplete(logId, count);
      results.shifts = { count, status: "success" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logSyncError(logId, msg);
      results.shifts = { count: 0, status: "error", error: msg };
    }
  }

  {
    const logId = await logSyncStart("time_and_cost");
    try {
      const supabase = createSupabaseAdminClient();
      const { data: depts } = await supabase.from("planday_departments").select("id");
      let totalCount = 0;
      for (const dept of depts ?? []) {
        totalCount += await syncTimeAndCost(Number(dept.id), fromDate, toDate);
      }
      await logSyncComplete(logId, totalCount);
      results.time_and_cost = { count: totalCount, status: "success" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logSyncError(logId, msg);
      results.time_and_cost = { count: 0, status: "error", error: msg };
    }
  }

  {
    const logId = await logSyncStart("punchclock");
    try {
      const count = await syncPunchclock(fromDate, toDate);
      await logSyncComplete(logId, count);
      results.punchclock = { count, status: "success" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logSyncError(logId, msg);
      results.punchclock = { count: 0, status: "error", error: msg };
    }
  }

  const hasErrors = Object.values(results).some((r) => r.status === "error");

  return NextResponse.json(
    { synced_at: new Date().toISOString(), results },
    { status: hasErrors ? 207 : 200 },
  );
};
