import { plandayGetAll } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayDepartment {
  id: number;
  name: string;
  number?: string;
}

export const syncDepartments = async (): Promise<number> => {
  const departments = await plandayGetAll<PlandayDepartment>({
    path: "/hr/v1/Departments",
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = departments.map((d) => ({
    id: d.id,
    name: d.name,
    number: d.number ?? null,
    synced_at: now,
  }));

  const { error } = await supabase
    .from("planday_departments")
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`Department sync failed: ${error.message}`);
  return rows.length;
};
