ALTER TABLE public.lantern_patients
  ADD COLUMN IF NOT EXISTS episode_state text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admission_stage text,
  ADD COLUMN IF NOT EXISTS referred_at timestamptz,
  ADD COLUMN IF NOT EXISTS transfer_stage text,
  ADD COLUMN IF NOT EXISTS transfer_destination text,
  ADD COLUMN IF NOT EXISTS transfer_eta text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS device_issue text,
  ADD COLUMN IF NOT EXISTS device_data_age_minutes integer,
  ADD COLUMN IF NOT EXISTS device_next_action text,
  ADD COLUMN IF NOT EXISTS device_owner text;

ALTER TABLE public.lantern_patients
  ADD CONSTRAINT lantern_patients_episode_state_check
  CHECK (episode_state IN ('active','admission_pending'));

-- Transfer detail for the 21 patients already in transfer
WITH t AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM public.lantern_patients WHERE transfer_in_progress
)
UPDATE public.lantern_patients p
SET transfer_stage = (ARRAY['Preparing handover','Awaiting transport','En route','Arrival confirmation'])[(t.rn % 4) + 1],
    transfer_destination = CASE p.region
      WHEN 'Metro North' THEN 'Metro North ED'
      WHEN 'Metro South' THEN 'Metro South ED'
      WHEN 'Western Region' THEN 'Western Acute'
      WHEN 'Regional Coastal' THEN 'Coastal Base Hospital'
      WHEN 'Regional Inland' THEN 'Inland Base Hospital'
      ELSE 'Partner Receiving Unit' END,
    transfer_eta = (ARRAY['Now','8 min','14 min','Confirmation due'])[(t.rn % 4) + 1]
FROM t WHERE t.id = p.id;

-- Device detail for every patient with a device concern
WITH d AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM public.lantern_patients WHERE device_concern
)
UPDATE public.lantern_patients p
SET device_type = (ARRAY['Pulse oximeter','Blood pressure cuff','Thermometer','Weight scale'])[(d.rn % 4) + 1],
    device_issue = CASE
      WHEN d.rn % 8 = 0 THEN 'Contact required'
      WHEN d.rn % 8 IN (1,2) THEN 'No data > 2 h'
      WHEN d.rn % 8 = 3 THEN 'Replacement'
      ELSE 'Low quality' END,
    device_data_age_minutes = 15 + ((d.rn * 37) % 320),
    device_next_action = CASE
      WHEN d.rn % 8 = 0 THEN 'Contact patient/caregiver'
      WHEN d.rn % 8 IN (1,2) THEN 'Request repeat observation'
      WHEN d.rn % 8 = 3 THEN 'Dispatch replacement'
      ELSE 'Repeat reading' END,
    device_owner = (ARRAY['Amir Haddad','Jo Reed','Device support pool','Unassigned'])[(d.rn % 4) + 1]
FROM d WHERE d.id = p.id;

-- The 72 referred patients awaiting admission
WITH quota(region, team, n) AS (
  VALUES ('Metro North','Intake North',16),('Metro South','Intake South',14),
         ('Hospital Partner Network','Partner Intake',13),('Western Region','Intake West',11),
         ('Regional Coastal','Intake Coast',10),('Regional Inland','Intake Inland',8)
), spread AS (
  SELECT q.region, q.team, g,
         row_number() OVER (ORDER BY q.region, g) AS i
  FROM quota q, generate_series(1, q.n) g
)
INSERT INTO public.lantern_patients
  (id, name, age, pronouns, diagnosis, pathway, status, score, region, team, owner,
   last_observation, reason, episode_state, admission_stage, referred_at)
SELECT
  'adm-' || lpad(i::text, 4, '0'),
  (ARRAY['Eleanor','William','Sofia','George','Amara','Hugh','Nina','Peter','Grace','Tomas','Ivy','Rashid'])[(i % 12) + 1]
    || ' ' ||
  (ARRAY['Price','Hart','Martin','Liu','Okonkwo','Bennett','Gupta','Shaw','Nolan','Vargas','Doyle','Karim'])[((i * 7) % 12) + 1],
  58 + (i % 30),
  (ARRAY['she/her','he/him','they/them'])[(i % 3) + 1],
  (ARRAY['COPD exacerbation','Heart failure','Cellulitis','Post-operative recovery'])[(i % 4) + 1],
  (ARRAY['Respiratory virtual ward','Cardiac virtual ward','IV antibiotics at home','Surgical step-down'])[(i % 4) + 1],
  'stable',
  15 + (i % 20),
  region, team,
  CASE WHEN i % 7 = 0 THEN 'Unassigned'
       ELSE (ARRAY['Mia Chen','Luca Patel','Priya Nair','Sam Webb','Leo Morgan'])[(i % 5) + 1] END,
  to_char(now() - (interval '1 minute' * (20 + i * 3)), 'HH24:MI') || ' AEST',
  'Referred for hospital-level care at home; awaiting admission steps',
  'admission_pending',
  CASE WHEN i <= 12 THEN 'Eligibility review'
       WHEN i <= 31 THEN 'Onboarding incomplete'
       WHEN i <= 49 THEN 'Kit not assigned'
       ELSE 'First observation' END,
  now() - (interval '1 minute' * (20 + i * 3))
FROM spread
ON CONFLICT (id) DO NOTHING;

-- Read-only lookups for the prototype console (synthetic records only)
CREATE OR REPLACE FUNCTION public.lantern_admission_worklist()
RETURNS TABLE (id text, name text, region text, pathway text, stage text, owner text, referred_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, region, pathway, admission_stage, owner, referred_at
  FROM public.lantern_patients
  WHERE episode_state = 'admission_pending'
  ORDER BY referred_at
$$;

CREATE OR REPLACE FUNCTION public.lantern_transfer_worklist()
RETURNS TABLE (id text, name text, status text, reason text, destination text, stage text, eta text, owner text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, status, reason, transfer_destination, transfer_stage, transfer_eta, owner
  FROM public.lantern_patients
  WHERE transfer_in_progress
  ORDER BY id
$$;

CREATE OR REPLACE FUNCTION public.lantern_device_worklist()
RETURNS TABLE (id text, name text, status text, device_type text, issue text, data_age_minutes integer, next_action text, owner text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, status, device_type, device_issue, device_data_age_minutes, device_next_action, device_owner
  FROM public.lantern_patients
  WHERE device_concern
  ORDER BY device_data_age_minutes DESC
$$;

CREATE OR REPLACE FUNCTION public.lantern_worklist_summary()
RETURNS TABLE (kind text, bucket text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'admissions', admission_stage, count(*) FROM public.lantern_patients
    WHERE episode_state = 'admission_pending' GROUP BY admission_stage
  UNION ALL
  SELECT 'transfers', transfer_stage, count(*) FROM public.lantern_patients
    WHERE transfer_in_progress GROUP BY transfer_stage
  UNION ALL
  SELECT 'devices', device_issue, count(*) FROM public.lantern_patients
    WHERE device_concern GROUP BY device_issue
  UNION ALL
  SELECT 'network', s.bucket, s.total FROM (
    SELECT 'active' AS bucket, count(*) AS total FROM public.lantern_patients WHERE episode_state = 'active'
    UNION ALL SELECT status, count(*) FROM public.lantern_patients WHERE episode_state = 'active' GROUP BY status
    UNION ALL SELECT 'discharge_ready', count(*) FROM public.lantern_patients WHERE discharge_ready AND episode_state = 'active'
    UNION ALL SELECT 'device_concern', count(*) FROM public.lantern_patients WHERE device_concern
    UNION ALL SELECT 'admissions_pending', count(*) FROM public.lantern_patients WHERE episode_state = 'admission_pending'
    UNION ALL SELECT 'transfers_in_progress', count(*) FROM public.lantern_patients WHERE transfer_in_progress
  ) s
$$;

GRANT EXECUTE ON FUNCTION public.lantern_admission_worklist() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lantern_transfer_worklist() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lantern_device_worklist() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lantern_worklist_summary() TO anon, authenticated;