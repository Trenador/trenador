-- P2: Add indexes on all foreign key columns flagged by Supabase performance advisor.
-- These prevent sequential scans on joins and lookups.
CREATE INDEX IF NOT EXISTS idx_coach_messages_member_id        ON public.coach_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_tenant_id        ON public.coach_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coaches_tenant_id               ON public.coaches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_member_id    ON public.intake_submissions(member_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_tenant_id    ON public.intake_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_codes_used_by            ON public.member_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_member_workout_exercises_ex_id  ON public.member_workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_member_workouts_source_id       ON public.member_workouts(source_workout_id);
CREATE INDEX IF NOT EXISTS idx_member_workouts_tenant_id       ON public.member_workouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_members_tenant_id               ON public.members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_member_id     ON public.terms_acceptances(member_id);
CREATE INDEX IF NOT EXISTS idx_threads_tenant_id               ON public.threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_ex_id     ON public.workout_log_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_tenant_id          ON public.workout_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workouts_coach_id               ON public.workouts(coach_id);
