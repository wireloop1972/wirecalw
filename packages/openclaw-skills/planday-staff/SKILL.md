---
name: planday-staff
description: Look up employee details, department rosters, and staffing information for Nevlunghavn Gjestgiveri.
metadata: {"openclaw": {"always": true}}
---

# Planday Staff Lookup

You have access to employee and department data from Planday via the `planday_query` tool.

## When to use this skill

Use when the user asks about:
- Employee contact details, roles, or departments
- How many staff members total or per department
- Department listings
- Employee groups (for pay rate purposes)
- Who is in a specific department

### Example queries

**All active employees by department:**
```sql
SELECT e.first_name, e.last_name, e.email, d.name AS department
FROM planday_employees e
LEFT JOIN planday_departments d ON d.id = e.primary_department_id
WHERE e.deactivation_date IS NULL
ORDER BY d.name, e.last_name
```

**Staff count per department:**
```sql
SELECT d.name AS department, COUNT(e.id) AS staff_count
FROM planday_employees e
JOIN planday_departments d ON d.id = e.primary_department_id
WHERE e.deactivation_date IS NULL
GROUP BY d.name
ORDER BY staff_count DESC
```

**Find a specific employee:**
```sql
SELECT e.first_name, e.last_name, e.email, e.cell_phone,
       e.hired_from, d.name AS department
FROM planday_employees e
LEFT JOIN planday_departments d ON d.id = e.primary_department_id
WHERE lower(e.first_name) LIKE lower('%maria%')
   OR lower(e.last_name) LIKE lower('%maria%')
```

## Presentation rules

- Don't expose sensitive fields (SSN is not synced, by design)
- Phone numbers and emails should only be shared with admin users
- Note total headcount when answering "how many" questions
