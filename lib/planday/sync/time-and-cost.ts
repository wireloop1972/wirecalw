import { plandayGet } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayTimeAndCostEntry {
  shiftId?: number;
  employeeId?: number;
  departmentId?: number;
  date: string;
  scheduledHours?: number;
  wageCost?: number;
  shiftTypeId?: number;
  positionId?: number;
}

export const syncTimeAndCost = async (
  departmentId: number,
  from: string,
  to: string,
): Promise<number> => {
  const response = await plandayGet<{ data: PlandayTimeAndCostEntry[] }>({
    path: "/scheduling/v1/TimeAndCost",
    params: {
      departmentId: String(departmentId),
      from,
      to,
    },
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = (response.data ?? []).map((e) => ({
    shift_id: e.shiftId ?? null,
    employee_id: e.employeeId ?? null,
    department_id: e.departmentId ?? departmentId,
    date: e.date,
    scheduled_hours: e.scheduledHours ?? null,
    wage_cost: e.wageCost ?? null,
    shift_type_id: e.shiftTypeId ?? null,
    position_id: e.positionId ?? null,
    synced_at: now,
  }));

  await supabase
    .from("planday_time_and_cost")
    .delete()
    .eq("department_id", departmentId)
    .gte("date", from)
    .lte("date", to);

  if (rows.length > 0) {
    const { error } = await supabase.from("planday_time_and_cost").insert(rows);
    if (error) throw new Error(`Time-and-cost sync failed: ${error.message}`);
  }

  return rows.length;
};
