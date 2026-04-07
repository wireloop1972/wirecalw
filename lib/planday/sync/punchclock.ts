import { plandayGetAll } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayPunchclockEntry {
  id: number;
  employeeId?: number;
  shiftId?: number;
  startDateTime?: string;
  endDateTime?: string;
  isApproved?: boolean;
}

export const syncPunchclock = async (from: string, to: string): Promise<number> => {
  const entries = await plandayGetAll<PlandayPunchclockEntry>({
    path: "/punchclock/v1/PunchclockShifts",
    params: { from, to },
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = entries.map((e) => ({
    id: e.id,
    employee_id: e.employeeId ?? null,
    shift_id: e.shiftId ?? null,
    start_time: e.startDateTime ?? null,
    end_time: e.endDateTime ?? null,
    is_approved: e.isApproved ?? false,
    synced_at: now,
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("planday_punchclock")
      .upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Punchclock sync failed: ${error.message}`);
  }

  return rows.length;
};
