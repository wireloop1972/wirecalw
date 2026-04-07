import { plandayGetAll } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayShift {
  id: number;
  employeeId?: number;
  departmentId?: number;
  shiftTypeId?: number;
  positionId?: number;
  startDateTime: string;
  endDateTime: string;
  status?: string;
  comment?: string;
}

export const syncShifts = async (from: string, to: string): Promise<number> => {
  const shifts = await plandayGetAll<PlandayShift>({
    path: "/scheduling/v1/Shifts",
    params: { from, to },
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = shifts.map((s) => ({
    id: s.id,
    employee_id: s.employeeId ?? null,
    department_id: s.departmentId ?? null,
    shift_type_id: s.shiftTypeId ?? null,
    position_id: s.positionId ?? null,
    start_time: s.startDateTime,
    end_time: s.endDateTime,
    status: s.status ?? null,
    comment: s.comment ?? null,
    synced_at: now,
  }));

  await supabase
    .from("planday_shifts")
    .delete()
    .gte("start_time", `${from}T00:00:00Z`)
    .lte("start_time", `${to}T23:59:59.999Z`);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("planday_shifts")
      .upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Shift sync failed: ${error.message}`);
  }

  return rows.length;
};
