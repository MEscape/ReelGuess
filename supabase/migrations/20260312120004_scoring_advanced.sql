-- ─────────────────────────────────────────────────────────────────────────────
-- Advanced Scoring System Migration
-- Adds vote_time_ms, used_double, and points_awarded columns to votes.
-- These values are computed and stored during the reveal phase.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE votes
    ADD COLUMN IF NOT EXISTS vote_time_ms  INT,
    ADD COLUMN IF NOT EXISTS used_double   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS points_awarded INT;
