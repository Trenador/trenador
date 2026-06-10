-- S1: Fix handle_new_user — add SET search_path to prevent mutable search_path exploit
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.members (tenant_id, auth_user_id, display_name)
  VALUES (
    '17eb3c23-6574-4a23-8b09-a3e51b5bb853',
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- S1+S2: Revoke direct REST-API invocability from both SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- S3: member_codes had RLS enabled with no policies (deny-all was accidental).
-- Add an explicit admin-only policy so intent is clear and future changes don't silently break.
CREATE POLICY "admins can manage member_codes"
  ON public.member_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid())
        AND members.is_admin = true
    )
  );
