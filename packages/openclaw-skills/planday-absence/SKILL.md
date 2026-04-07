---
name: planday-absence
description: Check sick leave, absence patterns, and who is off work at Nevlunghavn Gjestgiveri.
metadata: {"openclaw": {"always": true}}
---

# Planday Absence & Sick Leave Checker

You have access to absence and sick leave data from Planday via the `planday_query` tool.

## When to use this skill

Use when the user asks about:
- Who is off sick today/this week
- Sick leave patterns or trends
- Total sick days per employee or period
- Any type of absence (vacation, leave, sick)
- Coverage issues due to absence

## Important: How sick leave works in Planday

Sick leave is tracked via **shift types**, not a separate absence system. Shifts marked with sick leave shift types (e.g., "Sykefravær", "Sykemelding", "Sick leave") indicate absence. Query `planday_shift_types` first to find the relevant type IDs.

### Key tables

Same as planday-schedule, plus shift type filtering.

### Example queries

**Find sick leave shift types:**
```sql
SELECT id, name, salary_code FROM planday_shift_types
WHERE lower(name) LIKE '%syk%' OR lower(name) LIKE '%sick%'
   OR lower(name) LIKE '%fravær%' OR lower(name) LIKE '%absence%'
```

**Who is off sick this week?**
```sql
SELECT e.first_name, e.last_name, s.start_time::date AS date,
       st.name AS absence_type
FROM planday_shifts s
JOIN planday_employees e ON s.employee_id = e.id
JOIN planday_shift_types st ON s.shift_type_id = st.id
WHERE st.name ILIKE '%syk%' OR st.name ILIKE '%sick%'
  AND s.start_time >= date_trunc('week', CURRENT_DATE)
  AND s.start_time < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
ORDER BY s.start_time
```

**Sick days per employee this month:**
```sql
SELECT e.first_name, e.last_name,
       COUNT(DISTINCT s.start_time::date) AS sick_days
FROM planday_shifts s
JOIN planday_employees e ON s.employee_id = e.id
JOIN planday_shift_types st ON s.shift_type_id = st.id
WHERE (st.name ILIKE '%syk%' OR st.name ILIKE '%sick%')
  AND s.start_time >= date_trunc('month', CURRENT_DATE)
  AND s.start_time < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY e.first_name, e.last_name
ORDER BY sick_days DESC
```

## Presentation rules

- Always check shift type names first — they vary per hotel configuration
- Report both count and dates for transparency
- Note if data may be incomplete (sync window is 1 week back to 2 weeks forward)
- Be sensitive — sick leave data is personal information
