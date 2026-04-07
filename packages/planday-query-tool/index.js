// OpenClaw plugin: planday_query tool — POST to Vercel /api/planday/query
// Auth: ~/.openclaw/planday-query.json { "queryUrl", "bearerToken" } (no env in this file — OpenClaw install scanner)

import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";

const DEFAULT_VERCEL = "https://wirecalw.vercel.app";

const loadQueryConfig = () => {
  const p = path.join(homedir(), ".openclaw", "planday-query.json");
  try {
    const raw = fs.readFileSync(p, "utf8");
    const cfg = JSON.parse(raw);
    return {
      queryUrl: typeof cfg.queryUrl === "string" ? cfg.queryUrl : DEFAULT_VERCEL,
      bearerToken:
        typeof cfg.bearerToken === "string" ? cfg.bearerToken : "",
    };
  } catch {
    return { queryUrl: DEFAULT_VERCEL, bearerToken: "" };
  }
};

export default definePluginEntry({
  id: "planday-query",
  name: "Planday Query",
  description:
    "Execute read-only SQL SELECT queries against Planday workforce data cached in Supabase",

  register(api) {
    api.registerTool({
      name: "planday_query",
      description:
        "Execute a read-only SQL SELECT query against the Planday workforce data tables. " +
        "Available tables: planday_employees (id, first_name, last_name, email, departments, employee_groups), " +
        "planday_shifts (id, employee_id, department_id, shift_type_id, start_time, end_time, status), " +
        "planday_departments (id, name, number), " +
        "planday_shift_types (id, name, salary_code, is_active), " +
        "planday_time_and_cost (shift_id, employee_id, department_id, date, scheduled_hours, wage_cost), " +
        "planday_punchclock (id, employee_id, shift_id, start_time, end_time, is_approved), " +
        "planday_payroll_snapshots (period_start, period_end, employee_id, payroll_type, hours, rate, total_cost), " +
        "planday_sync_log (entity_type, status, completed_at, records_synced). " +
        "Only SELECT queries are allowed. Data is synced from Planday every 30 minutes.",

      parameters: Type.Object({
        sql: Type.String({
          description:
            "A PostgreSQL SELECT query against the planday_* tables. " +
            "Use JOINs to combine tables (e.g. shifts JOIN employees). " +
            "Use date functions for time-based queries. " +
            "Example: SELECT e.first_name, e.last_name, s.start_time, s.end_time " +
            "FROM planday_shifts s JOIN planday_employees e ON s.employee_id = e.id " +
            "WHERE s.start_time::date = CURRENT_DATE + INTERVAL '1 day' " +
            "ORDER BY s.start_time",
        }),
      }),

      async execute(_id, params) {
        const { queryUrl, bearerToken } = loadQueryConfig();
        if (!bearerToken) {
          return {
            content: [
              {
                type: "text",
                text:
                  "Missing bearer token. Create ~/.openclaw/planday-query.json with " +
                  '{"queryUrl":"https://wirecalw.vercel.app","bearerToken":"<same as Vercel OPENCLAW_GATEWAY_TOKEN>"}',
              },
            ],
          };
        }
        const base = queryUrl.replace(/\/$/, "");
        try {
          const response = await fetch(`${base}/api/planday/query`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${bearerToken}`,
            },
            body: JSON.stringify({ sql: params.sql }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return {
              content: [
                {
                  type: "text",
                  text: `Query failed (${response.status}): ${errorText}`,
                },
              ],
            };
          }

          const result = await response.json();
          const data = result.data;

          if (!data || (Array.isArray(data) && data.length === 0)) {
            return {
              content: [{ type: "text", text: "Query returned no results." }],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text",
                text: `Error executing Planday query: ${msg}`,
              },
            ],
          };
        }
      },
    });
  },
});
