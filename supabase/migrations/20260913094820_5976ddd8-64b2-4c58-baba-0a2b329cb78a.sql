-- 1. Make region status counts sum exactly to active patients
UPDATE public.lantern_network_snapshots
SET stable = active_patients - clinical_review - rapid_response - no_data;

-- 2. Extend patient model
ALTER TABLE public.lantern_patients
  ADD COLUMN IF NOT EXISTS device_concern boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discharge_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_in_progress boolean NOT NULL DEFAULT false;

-- 3. Align the five named patients to canonical region names
UPDATE public.lantern_patients SET region = 'Metro South', team = 'Respiratory Blue' WHERE id = 'pat-1001';
UPDATE public.lantern_patients SET region = 'Western Region', team = 'Cardiac West' WHERE id = 'pat-1002';
UPDATE public.lantern_patients SET region = 'Metro North', team = 'Surgical North' WHERE id = 'pat-1003';
UPDATE public.lantern_patients SET region = 'Regional Inland', team = 'Regional Acute' WHERE id = 'pat-1004';
UPDATE public.lantern_patients SET region = 'Regional Coastal', team = 'Respiratory Coast' WHERE id = 'pat-1005';

-- 4. Remove any previously generated cohort so this migration is idempotent
DELETE FROM public.lantern_patients WHERE id LIKE 'pat-2%' OR id LIKE 'pat-3%' OR id LIKE 'pat-4%' OR id LIKE 'pat-5%' OR id LIKE 'pat-6%' OR id LIKE 'pat-7%';

DO $$
DECLARE
  r record;
  i int; k int; d int; need int; seq int := 2000;
  st text; scr int; hr int; sp int; rr int; bp int; tp numeric;
  obs text; rsn text; nm text; pr text;
  fn text[] := ARRAY['Mara','John','Ana','David','Mei','Tomas','Ruth','Ibrahim','Elena','Peter','Sofia','Hamish','Grace','Noor','Liam','Yuki','Colin','Marta','Samuel','Aroha','Vikram','Helen','Dmitri','Fatima','Owen','Bianca','Kwame','Ingrid','Rafael','Nadia','Bruce','Leilani','Otto','Priya','Angus','Rosa','Chen','Maeve','Hugo','Amara','Stefan','Josephine','Ali','Clara','Diego','Wendy','Kofi','Astrid','Tane','Miriam'];
  ln text[] := ARRAY['Ellis','Bell','Santos','Okafor','Tan','Reid','Fletcher','Haddad','Novak','Whitcombe','Moreau','Doyle','Lim','Rahman','Kingsley','Mori','Weir','Kowalski','Abbott','Ngata','Iyer','Brannigan','Volkov','Zahra','Pritchard','Ferraro','Mensah','Solberg','Duarte','Hakim','McAllister','Kealoha','Brenner','Nair','Sinclair','Alvarez','Zhou','Kavanagh','Bertrand','Nwosu','Lindqvist','Cardoso','Yilmaz','Hensley','Marquez','Ashcroft','Boateng','Halvorsen','Rangi','Stein'];
  dx text[] := ARRAY['COPD exacerbation','Heart failure','Community-acquired pneumonia','Cellulitis','Post-operative recovery','Pyelonephritis','Atrial fibrillation','Diabetic foot infection','Bronchiectasis exacerbation','Respiratory viral illness'];
  pw text[] := ARRAY['Respiratory virtual ward','Cardiac virtual ward','Respiratory virtual ward','IV antibiotics at home','Surgical step-down','IV antibiotics at home','Cardiac virtual ward','IV antibiotics at home','Respiratory virtual ward','Respiratory virtual ward'];
  tmbase text[] := ARRAY['Respiratory','Cardiac','Respiratory','Infusion','Surgical','Infusion','Cardiac','Infusion','Respiratory','Respiratory'];
  ow text[] := ARRAY['Dr Asha Rao','RN Mia Chen','RN Leo Morgan','RN Priya Nair','RN Sam Webb','Dr Noah Patel','RN Ines Duarte','Dr Grace Lim','RN Tomas Reid','RN Aiko Mori','Dr Ben Novak','RN Zara Hale','Dr Ruth Adeyemi','RN Callum Frost'];
  suf text[] := ARRAY['Blue','Green','Amber','North','South','West','East','Central'];
  prons text[] := ARRAY['she/her','he/him','they/them'];
BEGIN
  PERFORM setseed(0.42);
  FOR r IN SELECT region, stable, clinical_review, rapid_response, no_data FROM public.lantern_network_snapshots ORDER BY region LOOP
    FOR k IN 1..4 LOOP
      st := (ARRAY['stable','review','rapid','nodata'])[k];
      need := (ARRAY[r.stable, r.clinical_review, r.rapid_response, r.no_data])[k]
              - (SELECT count(*) FROM public.lantern_patients p WHERE p.region = r.region AND p.status = st);
      FOR i IN 1..GREATEST(need, 0) LOOP
        seq := seq + 1;
        d := 1 + floor(random() * 10)::int;
        IF d > 10 THEN d := 10; END IF;
        nm := fn[1 + floor(random() * array_length(fn, 1))::int] || ' ' || ln[1 + floor(random() * array_length(ln, 1))::int];
        pr := prons[1 + floor(random() * 3)::int];
        IF st = 'stable' THEN
          scr := 16 + floor(random() * 22)::int;
          hr := 60 + floor(random() * 26)::int; sp := 94 + floor(random() * 5)::int;
          rr := 14 + floor(random() * 5)::int; bp := 108 + floor(random() * 32)::int;
          tp := round((36.2 + random() * 0.7)::numeric, 1);
          obs := to_char(now() - (floor(random() * 25) || ' minutes')::interval, 'HH24:MI') || ' AEST';
          rsn := 'Observations within pathway range';
        ELSIF st = 'review' THEN
          scr := 40 + floor(random() * 24)::int;
          hr := 86 + floor(random() * 20)::int; sp := 91 + floor(random() * 4)::int;
          rr := 19 + floor(random() * 5)::int; bp := 100 + floor(random() * 48)::int;
          tp := round((37.1 + random() * 1.1)::numeric, 1);
          obs := to_char(now() - (floor(random() * 40) || ' minutes')::interval, 'HH24:MI') || ' AEST';
          rsn := 'Trend outside pathway range; clinical review requested';
        ELSIF st = 'rapid' THEN
          scr := 65 + floor(random() * 30)::int;
          hr := 106 + floor(random() * 28)::int; sp := 83 + floor(random() * 6)::int;
          rr := 24 + floor(random() * 9)::int; bp := 82 + floor(random() * 32)::int;
          tp := round((37.5 + random() * 1.5)::numeric, 1);
          obs := to_char(now() - (floor(random() * 15) || ' minutes')::interval, 'HH24:MI') || ' AEST';
          rsn := 'Rapid deterioration in observations; response required now';
        ELSE
          scr := 40 + floor(random() * 20)::int;
          hr := NULL; sp := NULL; rr := NULL; bp := NULL; tp := NULL;
          obs := to_char(now() - ((120 + floor(random() * 240)) || ' minutes')::interval, 'HH24:MI') || ' AEST';
          rsn := 'No observations received; patient state unknown';
        END IF;
        INSERT INTO public.lantern_patients
          (id, name, age, pronouns, diagnosis, pathway, status, score, region, team, owner,
           last_observation, reason, heart_rate, spo2, respiratory_rate, systolic_bp, temperature)
        VALUES
          ('pat-' || seq, nm, 52 + floor(random() * 40)::int, pr, dx[d], pw[d], st, scr, r.region,
           tmbase[d] || ' ' || suf[1 + floor(random() * array_length(suf, 1))::int],
           ow[1 + floor(random() * array_length(ow, 1))::int],
           obs, rsn, hr, sp, rr, bp, tp);
      END LOOP;
    END LOOP;
  END LOOP;

  -- 5. Flags reconciled to the reported network figures
  UPDATE public.lantern_patients SET device_concern = false, discharge_ready = false, transfer_in_progress = false;
  FOR r IN SELECT region, device_concerns, likely_discharges, transfers_in_progress FROM public.lantern_network_snapshots LOOP
    UPDATE public.lantern_patients SET device_concern = true
    WHERE id IN (SELECT id FROM public.lantern_patients WHERE region = r.region
                 ORDER BY (status = 'nodata') DESC, md5(id) LIMIT r.device_concerns);
    UPDATE public.lantern_patients SET discharge_ready = true
    WHERE id IN (SELECT id FROM public.lantern_patients WHERE region = r.region AND status = 'stable'
                 ORDER BY md5(id || 'discharge') LIMIT r.likely_discharges);
    UPDATE public.lantern_patients SET transfer_in_progress = true
    WHERE id IN (SELECT id FROM public.lantern_patients WHERE region = r.region AND status IN ('rapid', 'review')
                 ORDER BY md5(id || 'transfer') LIMIT r.transfers_in_progress);
  END LOOP;
END $$;