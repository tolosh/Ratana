CREATE TABLE public.lantern_network_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL UNIQUE,
  capacity integer NOT NULL,
  occupied integer NOT NULL,
  stable integer NOT NULL,
  clinical_review integer NOT NULL,
  rapid_response integer NOT NULL,
  no_data integer NOT NULL,
  admissions integer NOT NULL,
  likely_discharges integer NOT NULL,
  transfers integer NOT NULL,
  workload_percent integer NOT NULL,
  device_concerns integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lantern_network_snapshots TO anon, authenticated;
GRANT ALL ON public.lantern_network_snapshots TO service_role;
ALTER TABLE public.lantern_network_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Synthetic network snapshots are public" ON public.lantern_network_snapshots FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.lantern_patients (
  id text PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  pronouns text NOT NULL,
  diagnosis text NOT NULL,
  pathway text NOT NULL,
  status text NOT NULL CHECK (status IN ('stable','review','rapid','nodata')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  region text NOT NULL,
  team text NOT NULL,
  owner text NOT NULL,
  last_observation text NOT NULL,
  reason text NOT NULL,
  heart_rate integer,
  spo2 integer,
  respiratory_rate integer,
  systolic_bp integer,
  temperature numeric(3,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lantern_patients TO anon, authenticated;
GRANT ALL ON public.lantern_patients TO service_role;
ALTER TABLE public.lantern_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Synthetic patients are public" ON public.lantern_patients FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.lantern_scenarios (
  id text PRIMARY KEY,
  name text NOT NULL,
  patient_id text REFERENCES public.lantern_patients(id),
  description text NOT NULL,
  state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','running','paused','complete')),
  duration_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lantern_scenarios TO anon, authenticated;
GRANT ALL ON public.lantern_scenarios TO service_role;
ALTER TABLE public.lantern_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Synthetic scenarios are public" ON public.lantern_scenarios FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.lantern_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  role text NOT NULL,
  organization text NOT NULL,
  region text,
  team text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lantern_role_assignments TO anon, authenticated;
GRANT ALL ON public.lantern_role_assignments TO service_role;
ALTER TABLE public.lantern_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Synthetic role assignments are public" ON public.lantern_role_assignments FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_lantern_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER lantern_network_updated_at BEFORE UPDATE ON public.lantern_network_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_lantern_updated_at();
CREATE TRIGGER lantern_patients_updated_at BEFORE UPDATE ON public.lantern_patients FOR EACH ROW EXECUTE FUNCTION public.set_lantern_updated_at();
CREATE TRIGGER lantern_scenarios_updated_at BEFORE UPDATE ON public.lantern_scenarios FOR EACH ROW EXECUTE FUNCTION public.set_lantern_updated_at();
CREATE TRIGGER lantern_roles_updated_at BEFORE UPDATE ON public.lantern_role_assignments FOR EACH ROW EXECUTE FUNCTION public.set_lantern_updated_at();

INSERT INTO public.lantern_network_snapshots (region, capacity, occupied, stable, clinical_review, rapid_response, no_data, admissions, likely_discharges, transfers, workload_percent, device_concerns) VALUES
('North Metro', 920, 836, 711, 89, 12, 24, 31, 44, 8, 82, 17),
('South Metro', 1080, 987, 844, 105, 14, 24, 38, 51, 11, 91, 21),
('Coastal', 760, 672, 571, 71, 9, 21, 26, 37, 6, 74, 13),
('Central', 980, 901, 761, 101, 15, 24, 34, 48, 12, 88, 19),
('Western', 680, 601, 516, 60, 7, 18, 22, 29, 5, 69, 11),
('Regional', 580, 503, 425, 57, 6, 15, 19, 23, 4, 77, 16);

INSERT INTO public.lantern_patients (id,name,age,pronouns,diagnosis,pathway,status,score,region,team,owner,last_observation,reason,heart_rate,spo2,respiratory_rate,systolic_bp,temperature) VALUES
('pat-1001','Mara Ellis',72,'she/her','COPD exacerbation','Respiratory virtual ward','rapid',82,'South Metro','Respiratory Blue','Dr Asha Rao','08:42 AEST','SpO₂ fell 6 points in 45 min; work of breathing increased',112,88,28,104,37.8),
('pat-1002','John Bell',81,'he/him','Heart failure','Cardiac virtual ward','review',61,'Central','Cardiac West','RN Mia Chen','08:36 AEST','Weight +1.8 kg in 48 h with increasing breathlessness',96,93,22,146,36.7),
('pat-1003','Ana Santos',58,'she/her','Post-operative recovery','Surgical step-down','review',54,'North Metro','Surgical North','RN Leo Morgan','08:31 AEST','Temperature trend and wound pain need review',102,96,20,118,38.1),
('pat-1004','David Okafor',67,'he/him','Cellulitis','IV antibiotics at home','nodata',47,'Regional','Regional Acute','RN Priya Nair','06:10 AEST','No observations received for 2 h 32 min',null,null,null,null,null),
('pat-1005','Mei Tan',76,'she/her','Community-acquired pneumonia','Respiratory virtual ward','stable',24,'Coastal','Respiratory Coast','RN Sam Webb','08:39 AEST','Observations within pathway range',82,96,18,126,36.8);

INSERT INTO public.lantern_scenarios (id,name,patient_id,description,duration_minutes) VALUES
('respiratory-deterioration','Respiratory deterioration','pat-1001','Falling oxygen saturation progresses through ownership, review, escalation and transfer.',12),
('heart-failure-drift','Heart-failure drift','pat-1002','Weight and symptom trend creates a clinical review task.',8),
('post-op-infection','Post-operative infection concern','pat-1003','Temperature and wound symptoms prompt pathway review.',7),
('device-missing','Missing data and device failure','pat-1004','Silence becomes an explicit No data safety state.',6),
('spo2-artifact','False low SpO₂ artifact','pat-1005','Low-quality signal requests repeat measurement instead of transfer.',5),
('patient-help','Patient help request','pat-1005','Patient requests help and receives a named callback commitment.',4),
('discharge-ready','Discharge readiness','pat-1005','Advisory readiness is reviewed and confirmed by a clinician.',6);

INSERT INTO public.lantern_role_assignments (display_name,role,organization,region,team) VALUES
('Dr Asha Rao','Consultant','Lantern Health','South Metro','Respiratory Blue'),
('Mia Chen','Visiting nurse','Lantern Health','Central','Cardiac West'),
('Noah Williams','Network controller','Lantern Health',null,null),
('Elena Park','Operations manager','Lantern Health',null,null),
('Grace Mensah','Governance lead','Lantern Health',null,null),
('Theo Grant','Workforce administrator','Lantern Health',null,null),
('Amir Haddad','Device support','Lantern Health',null,null),
('Ambulance liaison','Emergency services','Metro Ambulance','South Metro',null);