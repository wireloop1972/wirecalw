import { plandayGetAll } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayShiftType {
  id: number;
  name: string;
  salaryCode?: string;
  isActive?: boolean;
}

export const syncShiftTypes = async (): Promise<number> => {
  const types = await plandayGetAll<PlandayShiftType>({
    path: "/scheduling/v1/ShiftTypes",
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = types.map((t) => ({
    id: t.id,
    name: t.name,
    salary_code: t.salaryCode ?? null,
    is_active: t.isActive ?? true,
    synced_at: now,
  }));

  const { error } = await supabase
    .from("planday_shift_types")
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`Shift type sync failed: ${error.message}`);
  return rows.length;
};
