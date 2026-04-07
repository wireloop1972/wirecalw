import { plandayGetAll } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PlandayEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  cellPhone?: string;
  employeeTypeId?: number;
  salaryIdentifier?: string;
  hiredFrom?: string;
  deactivationDate?: string;
  primaryDepartmentId?: number;
  departments?: number[];
  employeeGroups?: number[];
}

export const syncEmployees = async (): Promise<number> => {
  const employees = await plandayGetAll<PlandayEmployee>({
    path: "/hr/v1/Employees",
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = employees.map((e) => ({
    id: e.id,
    first_name: e.firstName,
    last_name: e.lastName,
    email: e.email ?? null,
    cell_phone: e.cellPhone ?? null,
    employee_type_id: e.employeeTypeId ?? null,
    salary_identifier: e.salaryIdentifier ?? null,
    hired_from: e.hiredFrom ?? null,
    deactivation_date: e.deactivationDate ?? null,
    primary_department_id: e.primaryDepartmentId ?? null,
    departments: e.departments ?? [],
    employee_groups: e.employeeGroups ?? [],
    synced_at: now,
  }));

  const { error } = await supabase
    .from("planday_employees")
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`Employee sync failed: ${error.message}`);
  return rows.length;
};
