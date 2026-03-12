-- ─────────────────────────────────────────────────────────────────────────────
-- Reactions: ephemeral emoji reactions during the reveal phase
--
-- These rows are short-lived — a pg_cron job purges them after 5 minutes.
-- Realtime is enabled so all clients receive reactions instantly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Table ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reactions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id   TEXT        NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    player_id  UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    emoji      TEXT        NOT NULL CHECK (emoji IN ('😂','🤯','🔥','👏','🧠')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reactions_lobby_id   ON reactions (lobby_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions (created_at);

-- ── 3. Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Anon key: read-only (allows Realtime subscriptions with the anon key)
CREATE POLICY "reactions_select_anon"
    ON reactions FOR SELECT TO anon USING (true);

-- Service role: write access (used by the API route)
CREATE POLICY "reactions_insert_service"
    ON reactions FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "reactions_delete_service"
    ON reactions FOR DELETE TO service_role USING (true);

-- ── 4. Realtime ───────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- ── 5. Retention — purge reactions older than 5 minutes via pg_cron ──────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION cleanup_old_reactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM reactions
    WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Runs every minute — keeps the table lean at all times.
SELECT cron.schedule(
    'cleanup-old-reactions',
    '* * * * *',
    'SELECT cleanup_old_reactions()'
);
