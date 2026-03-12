-- ─────────────────────────────────────────────────────────────────────────────
-- Lobby retention policy via pg_cron
--
-- Replaces the /api/cron/cleanup-lobbies Next.js route handler.
--
-- Benefits over a cron HTTP endpoint:
--   - Runs entirely inside the database — no cold-start latency, no network hop
--   - Survives Vercel free-plan limitations (no cron on free tier)
--   - Atomic deletion with ON DELETE CASCADE — no orphaned rows possible
--   - pg_cron is enabled by default on all Supabase projects
--
-- Retention policy (mirrors the old route):
--   - `waiting`  lobbies older than 2h  → abandoned before game started
--   - `playing`  lobbies older than 24h → crashed mid-game
--   - `finished` lobbies older than 7d  → data retention window
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 0. Ensure pg_cron extension and cron schema exist ─────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE SCHEMA IF NOT EXISTS cron;

-- ── 1. Cleanup function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_lobbies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER   -- runs as the function owner (postgres), bypasses RLS
AS $$
BEGIN
    -- Abandoned waiting lobbies (2 hours)
    DELETE FROM lobbies
    WHERE status    = 'waiting'
      AND created_at < NOW() - INTERVAL '2 hours';

    -- Crashed mid-game lobbies (24 hours)
    DELETE FROM lobbies
    WHERE status    = 'playing'
      AND created_at < NOW() - INTERVAL '24 hours';

    -- Finished lobbies past retention window (7 days)
    DELETE FROM lobbies
    WHERE status    = 'finished'
      AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ── 2. Schedule with pg_cron (runs daily at 03:00 UTC) ───────────────────────
--
-- pg_cron is enabled by default on Supabase. If the extension is not yet
-- installed, run: CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- NOTE: cron.schedule is idempotent when the job name already exists — it
--       will update the schedule. Safe to run multiple times.

SELECT cron.schedule(
    'cleanup-old-lobbies',     -- job name (unique identifier)
    '0 3 * * *',               -- every day at 03:00 UTC
    'SELECT cleanup_old_lobbies()'
);

-- ── Verification ─────────────────────────────────────────────────────────────
-- Run this query in Supabase SQL Editor to confirm the job is registered:
--   SELECT jobid, jobname, schedule, command, active FROM cron.job;
--
-- To run immediately for testing:
--   SELECT cleanup_old_lobbies();
--
-- To remove the job:
--   SELECT cron.unschedule('cleanup-old-lobbies');

