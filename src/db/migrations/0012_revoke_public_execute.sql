-- The prior REVOKE targeted anon/authenticated directly, but Postgres grants EXECUTE
-- to PUBLIC by default when a function is created. anon and authenticated inherit
-- from PUBLIC, so we must revoke from PUBLIC to actually block REST API access.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
