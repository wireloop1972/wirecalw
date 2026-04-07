---
name: planday-schedule
description: Look up who is working when — shifts, schedules, rosters, and staffing for Nevlunghavn Gjestgiveri.
metadata: {"openclaw": {"always": true}}
---

# Planday Schedule Reader

You have access to the hotel's shift schedule from Planday via the `planday_query` tool.

## When to use this skill

Use when the user asks about:
- Who is working today, tomorrow, or any specific date
- The weekly or daily schedule/roster
- Which department is staffed and when
- Open or unassigned shifts
- A specific employee's upcoming shifts

## How to use

Call the `planday_query` tool with a SQL SELECT query. The data is in PostgreSQL (Supabase).

### Key tables

| Table | Key columns |
|-------|-------------|
| `planday_shifts` | id, employee_id, department_id, shift_type_id, start_time (timestamptz), end_time (timestamptz), status |
| `planday_employees` | id, first_name, last_name, email, departments (bigint[]), employee_groups (bigint[]) |
| `planday_departments` | id, name, number |
| `planday_shift_types` | id, name, salary_code, is_active |

### Example queries

**Who is working tomorrow?**
```sql
SELECT e.first_name, e.last_name, d.name AS department,
       s.start_time, s.end_time, st.name AS shift_type
FROM planday_shifts s
JOIN planday_employees e ON s.employee_id = e.id
JOIN planday_departments d ON s.department_id = d.id
LEFT JOIN planday_shift_types st ON s.shift_type_id = st.id
WHERE s.start_time::date = CURRENT_DATE + INTERVAL '1 day'
ORDER BY s.start_time, e.last_name
```

**This week's full schedule:**
```sql
SELECT e.first_name, e.last_name, d.name AS department,
       s.start_time, s.end_time, st.name AS shift_type
FROM planday_shifts s
JOIN planday_employees e ON s.employee_id = e.id
JOIN planday_departments d ON s.department_id = d.id
LEFT JOIN planday_shift_types st ON s.shift_type_id = st.id
WHERE s.start_time >= date_trunc('week', CURRENT_DATE)
  AND s.start_time < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
ORDER BY s.start_time, e.last_name
```

**Is a specific person working on a date?**
```sql
SELECT s.start_time, s.end_time, d.name AS department, st.name AS shift_type
FROM planday_shifts s
JOIN planday_employees e ON s.employee_id = e.id
JOIN planday_departments d ON s.department_id = d.id
LEFT JOIN planday_shift_types st ON s.shift_type_id = st.id
WHERE lower(e.first_name) = lower('Maria')
  AND s.start_time::date = '2026-04-08'
ORDER BY s.start_time
```

**Open/unassigned shifts:**
```sql
SELECT s.start_time, s.end_time, d.name AS department, st.name AS shift_type
FROM planday_shifts s
JOIN planday_departments d ON s.department_id = d.id
LEFT JOIN planday_shift_types st ON s.shift_type_id = st.id
WHERE s.employee_id IS NULL
  AND s.start_time >= CURRENT_DATE
ORDER BY s.start_time
```

## Presentation rules

- Always format times in Norwegian style (24-hour clock)
- Group by date when showing multi-day schedules
- Note that data is from the last sync (not real-time): check `planday_sync_log` if freshness matters
- If no shifts are found, say so clearly — don't speculate
