---
name: planday-wages
description: Report on wage costs, labor expenses, payroll data, and cost per department for Nevlunghavn Gjestgiveri.
metadata: {"openclaw": {"always": true}}
---

# Planday Wage & Cost Reporter

You have access to the hotel's wage cost and payroll data from Planday via the `planday_query` tool.

## When to use this skill

Use when the user asks about:
- Wage costs for a period (week, month, custom range)
- Labor cost per department
- Cost per employee
- Payroll summaries
- Budget vs actual labor cost
- Overtime costs

## Key tables

| Table | Key columns |
|-------|-------------|
| `planday_time_and_cost` | shift_id, employee_id, department_id, date, scheduled_hours, wage_cost (NOK) |
| `planday_payroll_snapshots` | period_start, period_end, employee_id, department_id, payroll_type, salary_code, hours, rate, total_cost |
| `planday_employees` | id, first_name, last_name |
| `planday_departments` | id, name |

### Example queries

**Total wage cost this month by department:**
```sql
SELECT d.name AS department,
       SUM(tc.scheduled_hours) AS total_hours,
       SUM(tc.wage_cost) AS total_cost_nok
FROM planday_time_and_cost tc
JOIN planday_departments d ON tc.department_id = d.id
WHERE tc.date >= date_trunc('month', CURRENT_DATE)
  AND tc.date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY d.name
ORDER BY total_cost_nok DESC
```

**Wage cost per employee this week:**
```sql
SELECT e.first_name, e.last_name,
       SUM(tc.scheduled_hours) AS hours,
       SUM(tc.wage_cost) AS cost_nok
FROM planday_time_and_cost tc
JOIN planday_employees e ON tc.employee_id = e.id
WHERE tc.date >= date_trunc('week', CURRENT_DATE)
  AND tc.date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY e.first_name, e.last_name
ORDER BY cost_nok DESC
```

**Daily wage cost for a specific period:**
```sql
SELECT tc.date, SUM(tc.wage_cost) AS daily_cost_nok, SUM(tc.scheduled_hours) AS hours
FROM planday_time_and_cost tc
WHERE tc.date BETWEEN '2026-03-01' AND '2026-03-31'
GROUP BY tc.date
ORDER BY tc.date
```

## Presentation rules

- Always format monetary values as NOK with thousands separator
- Round to whole kroner unless the user asks for detail
- Include hours alongside costs for context
- Note the data period and sync freshness
