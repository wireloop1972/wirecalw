---
name: planday-punchclock
description: Compare actual worked hours (punchclock) against scheduled shifts — overtime, late arrivals, attendance at Nevlunghavn Gjestgiveri.
metadata: {"openclaw": {"always": true}}
---

# Planday Punchclock Reader

You have access to punchclock (actual clock in/out) data from Planday via the `planday_query` tool.

## When to use this skill

Use when the user asks about:
- Actual vs scheduled hours
- Late arrivals or early departures
- Overtime
- Unapproved punchclock entries
- Attendance compliance

### Key tables

| Table | Key columns |
|-------|-------------|
| `planday_punchclock` | id, employee_id, shift_id, start_time, end_time, is_approved |
| `planday_shifts` | id, employee_id, start_time, end_time |
| `planday_employees` | id, first_name, last_name |

### Example queries

**Actual vs scheduled hours today:**
```sql
SELECT e.first_name, e.last_name,
       s.start_time AS scheduled_start, s.end_time AS scheduled_end,
       p.start_time AS actual_start, p.end_time AS actual_end,
       EXTRACT(EPOCH FROM (p.end_time - p.start_time)) / 3600 AS actual_hours,
       EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 AS scheduled_hours
FROM planday_punchclock p
JOIN planday_employees e ON p.employee_id = e.id
LEFT JOIN planday_shifts s ON p.shift_id = s.id
WHERE p.start_time::date = CURRENT_DATE
ORDER BY e.last_name
```

**Unapproved punchclock entries:**
```sql
SELECT e.first_name, e.last_name, p.start_time, p.end_time
FROM planday_punchclock p
JOIN planday_employees e ON p.employee_id = e.id
WHERE p.is_approved = false
  AND p.start_time >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY p.start_time DESC
```

## Presentation rules

- Show time differences (actual - scheduled) when comparing
- Flag significant deviations (>15 min late, >1 hour overtime)
- Note approval status
