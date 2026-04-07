import { plandayGetAll } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayEmployeeGroup {
  id: number;
  name: string;
}

export const syncEmployeeGroups = async (): Promise<number> => {
  const groups = await plandayGetAll<PlandayEmployeeGroup>({
    path: "/hr/v1/EmployeeGroups",
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = groups.map((g) => ({
    id: g.id,
    name: g.name,
    synced_at: now,
  }));

  const { error } = await supabase
    .from("planday_employee_groups")
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`Employee group sync failed: ${error.message}`);
  return rows.length;
};
