-- P1: Replace auth.uid() with (SELECT auth.uid()) in every RLS policy so Postgres
-- evaluates the current user ID once per query instead of once per row scanned.
-- P3: Consolidate duplicate permissive SELECT policies on coach_messages into one.

-- ── tenants ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read own tenant" ON public.tenants;
CREATE POLICY "members can read own tenant" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT members.tenant_id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

-- ── members ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read own row" ON public.members;
CREATE POLICY "members can read own row" ON public.members
  FOR SELECT USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "members can update own row" ON public.members;
CREATE POLICY "members can update own row" ON public.members
  FOR UPDATE USING (auth_user_id = (SELECT auth.uid()));

-- ── intake_submissions ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read own intake" ON public.intake_submissions;
CREATE POLICY "members can read own intake" ON public.intake_submissions
  FOR SELECT USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "members can insert own intake" ON public.intake_submissions;
CREATE POLICY "members can insert own intake" ON public.intake_submissions
  FOR INSERT WITH CHECK (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

-- ── terms_acceptances ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read own terms" ON public.terms_acceptances;
CREATE POLICY "members can read own terms" ON public.terms_acceptances
  FOR SELECT USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "members can insert own terms" ON public.terms_acceptances;
CREATE POLICY "members can insert own terms" ON public.terms_acceptances
  FOR INSERT WITH CHECK (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

-- ── threads ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read own threads" ON public.threads;
CREATE POLICY "members can read own threads" ON public.threads
  FOR SELECT USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "members can insert own threads" ON public.threads;
CREATE POLICY "members can insert own threads" ON public.threads
  FOR INSERT WITH CHECK (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "members can update own threads" ON public.threads;
CREATE POLICY "members can update own threads" ON public.threads
  FOR UPDATE USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

-- ── messages ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read own messages" ON public.messages;
CREATE POLICY "members can read own messages" ON public.messages
  FOR SELECT USING (
    thread_id IN (
      SELECT threads.id FROM threads
      WHERE threads.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "members can insert own messages" ON public.messages;
CREATE POLICY "members can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT threads.id FROM threads
      WHERE threads.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
  );

-- ── coach_messages — consolidate duplicate SELECT + fix initplan ───────────────
DROP POLICY IF EXISTS "members_read_own_coach_messages"  ON public.coach_messages;
DROP POLICY IF EXISTS "admins_read_all_coach_messages"   ON public.coach_messages;
CREATE POLICY "coach_messages_select" ON public.coach_messages
  FOR SELECT USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );

DROP POLICY IF EXISTS "members_insert_coach_messages" ON public.coach_messages;
CREATE POLICY "members_insert_coach_messages" ON public.coach_messages
  FOR INSERT WITH CHECK (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
    AND sender_role = 'member'
  );

DROP POLICY IF EXISTS "admins_insert_coach_replies" ON public.coach_messages;
CREATE POLICY "admins_insert_coach_replies" ON public.coach_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
    AND sender_role = 'coach'
  );

-- ── exercise_catalog ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read exercise catalog"   ON public.exercise_catalog;
DROP POLICY IF EXISTS "admins can manage exercise catalog"  ON public.exercise_catalog;
CREATE POLICY "exercise_catalog_select" ON public.exercise_catalog
  FOR SELECT USING (
    tenant_id IN (SELECT members.tenant_id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "admins can manage exercise catalog" ON public.exercise_catalog
  FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true)
  );

-- ── workouts ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read published workouts" ON public.workouts;
DROP POLICY IF EXISTS "admins can manage workouts"          ON public.workouts;
CREATE POLICY "workouts_select" ON public.workouts
  FOR SELECT USING (
    (published_at IS NOT NULL AND tenant_id IN (
      SELECT members.tenant_id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "admins can manage workouts" ON public.workouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true)
  );

-- ── workout_blocks ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can read blocks of published workouts" ON public.workout_blocks;
DROP POLICY IF EXISTS "admins can manage workout blocks"              ON public.workout_blocks;
CREATE POLICY "workout_blocks_select" ON public.workout_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts w
      JOIN members m ON m.auth_user_id = (SELECT auth.uid())
      WHERE w.id = workout_blocks.workout_id
        AND w.published_at IS NOT NULL
        AND w.tenant_id = m.tenant_id
    )
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "admins can manage workout blocks" ON public.workout_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true)
  );

-- ── member_workouts ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can manage their own workouts"  ON public.member_workouts;
DROP POLICY IF EXISTS "admins can read all member workouts"    ON public.member_workouts;
CREATE POLICY "member_workouts_select" ON public.member_workouts
  FOR SELECT USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "members can manage their own workouts" ON public.member_workouts
  FOR ALL USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

-- ── member_workout_exercises ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can manage their workout exercises"        ON public.member_workout_exercises;
DROP POLICY IF EXISTS "admins can read all member workout exercises"      ON public.member_workout_exercises;
CREATE POLICY "member_workout_exercises_select" ON public.member_workout_exercises
  FOR SELECT USING (
    member_workout_id IN (
      SELECT member_workouts.id FROM member_workouts
      WHERE member_workouts.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "members can manage their workout exercises" ON public.member_workout_exercises
  FOR ALL USING (
    member_workout_id IN (
      SELECT member_workouts.id FROM member_workouts
      WHERE member_workouts.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
  );

-- ── workout_logs ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can manage their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "admins can read all workout logs"          ON public.workout_logs;
CREATE POLICY "workout_logs_select" ON public.workout_logs
  FOR SELECT USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "members can manage their own workout logs" ON public.workout_logs
  FOR ALL USING (
    member_id IN (SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid()))
  );

-- ── workout_log_exercises ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can manage their log exercises" ON public.workout_log_exercises;
DROP POLICY IF EXISTS "admins can read all log exercises"      ON public.workout_log_exercises;
CREATE POLICY "workout_log_exercises_select" ON public.workout_log_exercises
  FOR SELECT USING (
    workout_log_id IN (
      SELECT workout_logs.id FROM workout_logs
      WHERE workout_logs.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "members can manage their log exercises" ON public.workout_log_exercises
  FOR ALL USING (
    workout_log_id IN (
      SELECT workout_logs.id FROM workout_logs
      WHERE workout_logs.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
  );

-- ── workout_log_sets ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can manage their log sets" ON public.workout_log_sets;
DROP POLICY IF EXISTS "admins can read all log sets"      ON public.workout_log_sets;
CREATE POLICY "workout_log_sets_select" ON public.workout_log_sets
  FOR SELECT USING (
    workout_log_exercise_id IN (
      SELECT wle.id FROM workout_log_exercises wle
      JOIN workout_logs wl ON wl.id = wle.workout_log_id
      WHERE wl.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM members
      WHERE members.auth_user_id = (SELECT auth.uid()) AND members.is_admin = true
    )
  );
CREATE POLICY "members can manage their log sets" ON public.workout_log_sets
  FOR ALL USING (
    workout_log_exercise_id IN (
      SELECT wle.id FROM workout_log_exercises wle
      JOIN workout_logs wl ON wl.id = wle.workout_log_id
      WHERE wl.member_id IN (
        SELECT members.id FROM members WHERE members.auth_user_id = (SELECT auth.uid())
      )
    )
  );
