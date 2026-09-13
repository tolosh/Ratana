ALTER TABLE public.lantern_role_assignments
  ADD COLUMN user_id uuid;

CREATE UNIQUE INDEX lantern_role_assignments_user_role_scope_idx
  ON public.lantern_role_assignments (user_id, role, COALESCE(region, ''), COALESCE(team, ''))
  WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS "Signed-in users can view patients" ON public.lantern_patients;
CREATE POLICY "Staff can view patients in their scope"
ON public.lantern_patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lantern_role_assignments assignment
    WHERE assignment.user_id = auth.uid()
      AND (assignment.expires_at IS NULL OR assignment.expires_at > now())
      AND (
        assignment.role IN ('Network controller', 'Operations manager', 'Governance lead', 'Workforce administrator')
        OR assignment.region = lantern_patients.region
        OR assignment.team = lantern_patients.team
      )
  )
);

DROP POLICY IF EXISTS "Synthetic role assignments are public" ON public.lantern_role_assignments;
REVOKE SELECT ON public.lantern_role_assignments FROM anon;
CREATE POLICY "Staff can view their own role assignments"
ON public.lantern_role_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());