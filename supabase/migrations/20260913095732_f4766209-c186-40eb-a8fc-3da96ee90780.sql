CREATE TABLE public.lantern_enquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organisation text,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.lantern_enquiries TO anon, authenticated;
GRANT ALL ON public.lantern_enquiries TO service_role;
ALTER TABLE public.lantern_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an enquiry" ON public.lantern_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

DO $do$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lantern_patients'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lantern_patients', p.policyname);
  END LOOP;
END $do$;
REVOKE SELECT ON public.lantern_patients FROM anon;
CREATE POLICY "Signed-in users can view patients" ON public.lantern_patients FOR SELECT TO authenticated USING (true);