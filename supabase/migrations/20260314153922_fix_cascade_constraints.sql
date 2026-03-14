-- ─────────────────────────────────────────────────────────────
-- Migration: Fix missing cascading deletes
-- Ensures lobby cleanup works (cron job + manual deletes)
-- ─────────────────────────────────────────────────────────────

-- ── 1. Fix votes → players relationships ─────────────────────

ALTER TABLE votes
DROP CONSTRAINT IF EXISTS votes_voter_id_fkey;

ALTER TABLE votes
    ADD CONSTRAINT votes_voter_id_fkey
        FOREIGN KEY (voter_id)
            REFERENCES players(id)
            ON DELETE CASCADE;

ALTER TABLE votes
DROP CONSTRAINT IF EXISTS votes_voted_for_id_fkey;

ALTER TABLE votes
    ADD CONSTRAINT votes_voted_for_id_fkey
        FOREIGN KEY (voted_for_id)
            REFERENCES players(id)
            ON DELETE CASCADE;


-- ── 2. Fix rounds → players relationship ─────────────────────

ALTER TABLE rounds
DROP CONSTRAINT IF EXISTS rounds_correct_player_id_fkey;

ALTER TABLE rounds
    ADD CONSTRAINT rounds_correct_player_id_fkey
        FOREIGN KEY (correct_player_id)
            REFERENCES players(id)
            ON DELETE CASCADE;


-- ── 3. Ensure reels owner also cascades ───────

ALTER TABLE reels
DROP CONSTRAINT IF EXISTS reels_owner_id_fkey;

ALTER TABLE reels
    ADD CONSTRAINT reels_owner_id_fkey
        FOREIGN KEY (owner_id)
            REFERENCES players(id)
            ON DELETE CASCADE;
