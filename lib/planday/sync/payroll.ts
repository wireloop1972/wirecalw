import { plandayGet } from "@/lib/planday/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PayrollShiftItem {
  employeeId: number;
  departmentId?: number;
  salaryCode?: string;
  hours?: number;
  rate?: number;
  wageCost?: number;
}

interface PayrollResponse {
  shiftsPayroll: PayrollShiftItem[];
  supplementsPayroll: PayrollShiftItem[];
  salariedPayroll: Array<{
    employeeId: number;
    salaryCode?: string;
    hours?: number;
    rate?: number;
    wage?: number;
  }>;
}

export const syncPayroll = async (
  departmentIds: number[],
  from: string,
  to: string,
): Promise<number> => {
  const response = await plandayGet<PayrollResponse>({
    path: "/payroll/v1/Payroll",
    params: {
      departmentIds: departmentIds.join(","),
      from,
      to,
    },
  });

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("planday_payroll_snapshots")
    .delete()
    .eq("period_start", from)
    .eq("period_end", to);

  const rows: Array<Record<string, unknown>> = [];

  for (const item of response.shiftsPayroll ?? []) {
    rows.push({
      period_start: from,
      period_end: to,
      department_id: item.departmentId ?? null,
      employee_id: item.employeeId,
      payroll_type: "shifts",
      salary_code: item.salaryCode ?? null,
      hours: item.hours ?? null,
      rate: item.rate ?? null,
      total_cost: item.wageCost ?? null,
      synced_at: now,
    });
  }

  for (const item of response.supplementsPayroll ?? []) {
    rows.push({
      period_start: from,
      period_end: to,
      department_id: item.departmentId ?? null,
      employee_id: item.employeeId,
      payroll_type: "supplements",
      salary_code: item.salaryCode ?? null,
      hours: item.hours ?? null,
      rate: item.rate ?? null,
      total_cost: item.wageCost ?? null,
      synced_at: now,
    });
  }

  for (const item of response.salariedPayroll ?? []) {
    rows.push({
      period_start: from,
      period_end: to,
      department_id: null,
      employee_id: item.employeeId,
      payroll_type: "salaried",
      salary_code: item.salaryCode ?? null,
      hours: item.hours ?? null,
      rate: item.rate ?? null,
      total_cost: item.wage ?? null,
      synced_at: now,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("planday_payroll_snapshots").insert(rows);
    if (error) throw new Error(`Payroll sync failed: ${error.message}`);
  }

  return rows.length;
};
