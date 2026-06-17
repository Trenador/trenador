-- Index for members.assigned_coach_id — enables fast coach→member lookups
-- (FK exists but Postgres does not auto-index FK columns on the referencing side)
CREATE INDEX IF NOT EXISTS idx_members_assigned_coach_id ON public.members(assigned_coach_id);
