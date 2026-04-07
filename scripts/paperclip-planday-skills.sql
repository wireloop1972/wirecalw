-- Idempotent inserts for Nevlunghavn (NEV) company skills — Paperclip embedded Postgres
-- Company ID from INFRASTRUCTURE.md

INSERT INTO company_skills (company_id, name, description, config)
SELECT '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid,
       'planday-schedule-reader',
       'Read scheduled shifts from Planday. Answers: who is working when, weekly schedule, open shifts.',
       '{"tables": ["planday_shifts", "planday_employees", "planday_departments", "planday_shift_types"], "queryAgent": "devstral", "presentationAgent": "poe"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM company_skills cs
  WHERE cs.company_id = '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid
    AND cs.name = 'planday-schedule-reader'
);

INSERT INTO company_skills (company_id, name, description, config)
SELECT '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid,
       'planday-payroll-reporter',
       'Report on wage costs and payroll data. Answers: total costs for period, cost per department, cost per employee.',
       '{"tables": ["planday_time_and_cost", "planday_payroll_snapshots", "planday_employees", "planday_departments"], "queryAgent": "devstral", "presentationAgent": "poe"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM company_skills cs
  WHERE cs.company_id = '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid
    AND cs.name = 'planday-payroll-reporter'
);

INSERT INTO company_skills (company_id, name, description, config)
SELECT '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid,
       'planday-absence-checker',
       'Check sick leave and absence data. Answers: who is off sick, absence patterns, sick days per employee.',
       '{"tables": ["planday_shifts", "planday_shift_types", "planday_employees"], "queryAgent": "devstral", "presentationAgent": "poe"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM company_skills cs
  WHERE cs.company_id = '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid
    AND cs.name = 'planday-absence-checker'
);

INSERT INTO company_skills (company_id, name, description, config)
SELECT '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid,
       'planday-staff-lookup',
       'Look up employee and department information. Answers: contact details, department rosters, headcount.',
       '{"tables": ["planday_employees", "planday_departments", "planday_employee_groups"], "queryAgent": "devstral", "presentationAgent": "poe"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM company_skills cs
  WHERE cs.company_id = '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid
    AND cs.name = 'planday-staff-lookup'
);

INSERT INTO company_skills (company_id, name, description, config)
SELECT '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid,
       'planday-punchclock-reader',
       'Compare actual worked hours against scheduled shifts. Answers: overtime, late arrivals, unapproved entries.',
       '{"tables": ["planday_punchclock", "planday_shifts", "planday_employees"], "queryAgent": "devstral", "presentationAgent": "poe"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM company_skills cs
  WHERE cs.company_id = '54cdb0a4-7810-46ad-bd0d-895d630bb698'::uuid
    AND cs.name = 'planday-punchclock-reader'
);
