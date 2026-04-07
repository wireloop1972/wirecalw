-- =============================================================================
-- 005_planday_cache.sql
-- Planday workforce data cache tables.
-- Populated by Next.js API route syncs from Planday API.
-- Read-only for authenticated users; writes use service_role key.
-- =============================================================================

CREATE TABLE planday_departments (
  id            BIGINT PRIMARY KEY,
  name          TEXT NOT NULL,
  number        TEXT,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_employee_groups (
  id            BIGINT PRIMARY KEY,
  name          TEXT NOT NULL,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_shift_types (
  id            BIGINT PRIMARY KEY,
  name          TEXT NOT NULL,
  salary_code   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_employees (
  id                    BIGINT PRIMARY KEY,
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  email                 TEXT,
  cell_phone            TEXT,
  employee_type_id      BIGINT,
  salary_identifier     TEXT,
  hired_from            DATE,
  deactivation_date     DATE,
  primary_department_id BIGINT REFERENCES planday_departments(id),
  departments           BIGINT[],
  employee_groups       BIGINT[],
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_shifts (
  id              BIGINT PRIMARY KEY,
  employee_id     BIGINT REFERENCES planday_employees(id),
  department_id   BIGINT REFERENCES planday_departments(id),
  shift_type_id   BIGINT REFERENCES planday_shift_types(id),
  position_id     BIGINT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  status          TEXT,
  comment         TEXT,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_time_and_cost (
  id              SERIAL PRIMARY KEY,
  shift_id        BIGINT,
  employee_id     BIGINT REFERENCES planday_employees(id),
  department_id   BIGINT REFERENCES planday_departments(id),
  date            DATE NOT NULL,
  scheduled_hours NUMERIC(8,2),
  wage_cost       NUMERIC(12,2),
  currency        TEXT DEFAULT 'NOK',
  shift_type_id   BIGINT,
  position_id     BIGINT,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_punchclock (
  id              BIGINT PRIMARY KEY,
  employee_id     BIGINT REFERENCES planday_employees(id),
  shift_id        BIGINT,
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  is_approved     BOOLEAN DEFAULT FALSE,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_payroll_snapshots (
  id              SERIAL PRIMARY KEY,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  department_id   BIGINT REFERENCES planday_departments(id),
  employee_id     BIGINT REFERENCES planday_employees(id),
  payroll_type    TEXT NOT NULL,
  salary_code     TEXT,
  hours           NUMERIC(8,2),
  rate            NUMERIC(12,2),
  total_cost      NUMERIC(12,2),
  currency        TEXT DEFAULT 'NOK',
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planday_sync_log (
  id              SERIAL PRIMARY KEY,
  entity_type     TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  records_synced  INT DEFAULT 0,
  status          TEXT DEFAULT 'running',
  error_message   TEXT
);

CREATE INDEX idx_pd_shifts_employee   ON planday_shifts(employee_id);
CREATE INDEX idx_pd_shifts_date       ON planday_shifts(start_time);
CREATE INDEX idx_pd_shifts_dept_date  ON planday_shifts(department_id, start_time);
CREATE INDEX idx_pd_tc_date           ON planday_time_and_cost(date);
CREATE INDEX idx_pd_tc_employee       ON planday_time_and_cost(employee_id);
CREATE INDEX idx_pd_payroll_period    ON planday_payroll_snapshots(period_start, period_end);
CREATE INDEX idx_pd_punch_employee    ON planday_punchclock(employee_id);
CREATE INDEX idx_pd_punch_date        ON planday_punchclock(start_time);
CREATE INDEX idx_pd_sync_log_type     ON planday_sync_log(entity_type, started_at);

ALTER TABLE planday_departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_employee_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_shift_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_shifts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_time_and_cost     ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_punchclock        ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_payroll_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE planday_sync_log          ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'planday_departments', 'planday_employee_groups', 'planday_shift_types',
    'planday_employees', 'planday_shifts', 'planday_time_and_cost',
    'planday_punchclock', 'planday_payroll_snapshots', 'planday_sync_log'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated read %s" ON %I FOR SELECT USING (auth.role() = ''authenticated'')',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION execute_planday_query(query_text TEXT)
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT (lower(trim(query_text)) LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are permitted';
  END IF;

  IF query_text ~* '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)' THEN
    RAISE EXCEPTION 'Write operations are not permitted';
  END IF;

  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t'
    INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION execute_planday_query(TEXT) TO service_role;
