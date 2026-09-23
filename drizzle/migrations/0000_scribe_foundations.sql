CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'solo' CHECK (type IN ('solo','practice','health_service')),
  country text NOT NULL DEFAULT 'AU' CHECK (country IN ('AU','NZ')),
  plan text NOT NULL DEFAULT 'free',
  parent_id uuid REFERENCES public.organisations(id),
  audio_retention text NOT NULL DEFAULT 'on_sign' CHECK (audio_retention IN ('on_sign','7_days','30_days')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.org_modules (
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('scribe','hith')),
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (organisation_id, module)
);
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','practice_owner','practice_admin','clinician','registrar','assistant')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','suspended')),
  supervisor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);
CREATE TABLE public.clinicians (
  user_id uuid PRIMARY KEY,
  full_name text NOT NULL,
  profession text NOT NULL,
  registration_body text NOT NULL CHECK (registration_body IN ('Ahpra','MCNZ','NCNZ')),
  registration_number text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX clinicians_registration_unique ON public.clinicians (registration_body, upper(registration_number));

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES public.organisations(id),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scribe_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  clinician_id uuid NOT NULL,
  patient_label text NOT NULL,
  patient_id text,
  episode_id text,
  context text NOT NULL DEFAULT 'in_person' CHECK (context IN ('in_person','telehealth','home_visit','dictation')),
  template_id text NOT NULL DEFAULT 'soap',
  status text NOT NULL DEFAULT 'consent_pending' CHECK (status IN ('consent_pending','recording','drafting','review','signed','draft_failed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.scribe_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.scribe_sessions(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  script_version text NOT NULL,
  script_text text NOT NULL,
  captured_by uuid NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.scribe_audio_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scribe_sessions(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  seq integer NOT NULL,
  storage_path text,
  bytes integer NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (session_id, seq)
);
CREATE TABLE public.scribe_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scribe_sessions(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  seq integer NOT NULL,
  t_start numeric NOT NULL DEFAULT 0,
  t_end numeric NOT NULL DEFAULT 0,
  speaker text NOT NULL DEFAULT 'unlabelled' CHECK (speaker IN ('unlabelled','clinician','patient','carer','other')),
  kind text NOT NULL DEFAULT 'speech' CHECK (kind IN ('speech','silence','off_record','failed')),
  text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);
CREATE TABLE public.scribe_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.scribe_sessions(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  template_id text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed')),
  model text,
  consent_statement text,
  generated_at timestamptz,
  signed_by uuid,
  signed_name text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.scribe_sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.scribe_notes(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  section text NOT NULL,
  section_order integer NOT NULL,
  position integer NOT NULL,
  text text NOT NULL,
  source_seqs integer[] NOT NULL DEFAULT '{}',
  origin text NOT NULL DEFAULT 'machine' CHECK (origin IN ('machine','clinician')),
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  resolution text CHECK (resolution IN ('accepted','edited','deleted')),
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.scribe_addenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.scribe_notes(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.organisations, public.org_modules, public.memberships, public.clinicians, public.scribe_sessions, public.scribe_consents, public.scribe_audio_chunks, public.scribe_segments, public.scribe_notes, public.scribe_sentences, public.scribe_addenda TO authenticated;
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.organisations, public.org_modules, public.memberships, public.clinicians, public.audit_events, public.scribe_sessions, public.scribe_consents, public.scribe_audio_chunks, public.scribe_segments, public.scribe_notes, public.scribe_sentences, public.scribe_addenda TO service_role;

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships m WHERE m.organisation_id = _org AND m.user_id = auth.uid() AND m.status = 'active')
$$;
CREATE OR REPLACE FUNCTION public.is_clinical_member(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships m WHERE m.organisation_id = _org AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','practice_owner','clinician','registrar','assistant'))
$$;
CREATE OR REPLACE FUNCTION public.is_org_admin(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships m WHERE m.organisation_id = _org AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','practice_owner','practice_admin'))
$$;

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_audio_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribe_addenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view their organisations" ON public.organisations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "Admins update their organisations" ON public.organisations FOR UPDATE TO authenticated USING (public.is_org_admin(id)) WITH CHECK (public.is_org_admin(id));
CREATE POLICY "Members view modules" ON public.org_modules FOR SELECT TO authenticated USING (public.is_org_member(organisation_id));
CREATE POLICY "Members view memberships in their organisations" ON public.memberships FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_org_member(organisation_id));
CREATE POLICY "Clinicians view own profile" ON public.clinicians FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships a JOIN public.memberships b ON a.organisation_id = b.organisation_id WHERE a.user_id = auth.uid() AND b.user_id = clinicians.user_id AND a.status='active'));
CREATE POLICY "Clinicians update own profile" ON public.clinicians FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND verification_status = 'pending');
CREATE POLICY "Members view audit of their organisations" ON public.audit_events FOR SELECT TO authenticated USING (public.is_org_member(organisation_id) OR actor_id = auth.uid());
CREATE POLICY "Members append audit events" ON public.audit_events FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND (organisation_id IS NULL OR public.is_org_member(organisation_id)));

CREATE POLICY "Clinical members read sessions" ON public.scribe_sessions FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members create sessions" ON public.scribe_sessions FOR INSERT TO authenticated WITH CHECK (public.is_clinical_member(organisation_id) AND clinician_id = auth.uid());
CREATE POLICY "Clinical members update sessions" ON public.scribe_sessions FOR UPDATE TO authenticated USING (public.is_clinical_member(organisation_id)) WITH CHECK (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members read consents" ON public.scribe_consents FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members capture consent" ON public.scribe_consents FOR INSERT TO authenticated WITH CHECK (public.is_clinical_member(organisation_id) AND captured_by = auth.uid());
CREATE POLICY "Clinical members read chunks" ON public.scribe_audio_chunks FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members read segments" ON public.scribe_segments FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members update segments" ON public.scribe_segments FOR UPDATE TO authenticated USING (public.is_clinical_member(organisation_id)) WITH CHECK (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members read notes" ON public.scribe_notes FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members read sentences" ON public.scribe_sentences FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members edit draft sentences" ON public.scribe_sentences FOR UPDATE TO authenticated USING (public.is_clinical_member(organisation_id)) WITH CHECK (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members add sentences" ON public.scribe_sentences FOR INSERT TO authenticated WITH CHECK (public.is_clinical_member(organisation_id) AND origin = 'clinician');
CREATE POLICY "Clinical members read addenda" ON public.scribe_addenda FOR SELECT TO authenticated USING (public.is_clinical_member(organisation_id));
CREATE POLICY "Clinical members add addenda" ON public.scribe_addenda FOR INSERT TO authenticated WITH CHECK (public.is_clinical_member(organisation_id) AND author_id = auth.uid());

-- Signed notes are locked: sentences cannot change once the note is signed
CREATE OR REPLACE FUNCTION public.scribe_lock_signed_sentences()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.scribe_notes n WHERE n.id = COALESCE(NEW.note_id, OLD.note_id) AND n.status = 'signed') THEN
    RAISE EXCEPTION 'Signed notes are locked. Add an addendum instead.';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER scribe_sentences_lock BEFORE INSERT OR UPDATE ON public.scribe_sentences FOR EACH ROW EXECUTE FUNCTION public.scribe_lock_signed_sentences();

CREATE OR REPLACE FUNCTION public.scribe_lock_signed_note()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'signed' THEN
    RAISE EXCEPTION 'Signed notes are locked. Add an addendum instead.';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER scribe_notes_lock BEFORE UPDATE ON public.scribe_notes FOR EACH ROW EXECUTE FUNCTION public.scribe_lock_signed_note();

CREATE TRIGGER organisations_updated_at BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.set_lantern_updated_at();
CREATE TRIGGER scribe_sessions_updated_at BEFORE UPDATE ON public.scribe_sessions FOR EACH ROW EXECUTE FUNCTION public.set_lantern_updated_at();

-- Self-serve solo sign-up: creates clinician, organisation of one, owner membership, scribe module, audit
CREATE OR REPLACE FUNCTION public.create_solo_organisation(_full_name text, _profession text, _registration_body text, _registration_number text, _country text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _org uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.memberships WHERE user_id = _uid AND status = 'active') THEN
    SELECT organisation_id INTO _org FROM public.memberships WHERE user_id = _uid AND status = 'active' ORDER BY created_at LIMIT 1;
    RETURN _org;
  END IF;
  INSERT INTO public.clinicians (user_id, full_name, profession, registration_body, registration_number)
  VALUES (_uid, trim(_full_name), trim(_profession), _registration_body, upper(trim(_registration_number)))
  ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, profession = EXCLUDED.profession;
  INSERT INTO public.organisations (name, type, country, plan, created_by)
  VALUES (trim(_full_name), 'solo', _country, 'free', _uid) RETURNING id INTO _org;
  INSERT INTO public.memberships (organisation_id, user_id, role) VALUES (_org, _uid, 'owner');
  INSERT INTO public.org_modules (organisation_id, module) VALUES (_org, 'scribe');
  INSERT INTO public.audit_events (organisation_id, actor_id, action, entity_type, entity_id, detail)
  VALUES (_org, _uid, 'organisation.created', 'organisation', _org::text, jsonb_build_object('type','solo'));
  RETURN _org;
END; $$;
REVOKE EXECUTE ON FUNCTION public.create_solo_organisation(text,text,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_solo_organisation(text,text,text,text,text) TO authenticated;
