-- ─────────────────────────────────────────────────────────────────────────────
-- ReelGuess: Full Database Migration
-- This migration creates all tables, indexes, and production-ready RLS policies.
-- Any broken triggers/functions are removed.
-- Designed for Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Tables ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lobbies (
                                       id            TEXT PRIMARY KEY,
                                       host_id       UUID NOT NULL,
                                       status        TEXT DEFAULT 'waiting'
                                       CHECK (status IN ('waiting','playing','finished')),
    settings      JSONB DEFAULT '{"rounds_count":50,"timer_seconds":60}',
    created_at    TIMESTAMPTZ DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS players (
                                       id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id      TEXT REFERENCES lobbies(id) ON DELETE CASCADE,
    display_name  TEXT NOT NULL,
    avatar_seed   TEXT NOT NULL,
    is_host       BOOLEAN DEFAULT false,
    joined_at     TIMESTAMPTZ DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS reels (
                                     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id      TEXT REFERENCES lobbies(id) ON DELETE CASCADE,
    owner_id      UUID REFERENCES players(id),
    instagram_url TEXT NOT NULL,
    used          BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS rounds (
                                      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id          TEXT REFERENCES lobbies(id) ON DELETE CASCADE,
    round_number      INT NOT NULL,
    reel_id           UUID REFERENCES reels(id),
    correct_player_id UUID REFERENCES players(id),
    status            TEXT DEFAULT 'voting'
    CHECK (status IN ('countdown','voting','reveal','complete')),
    started_at        TIMESTAMPTZ DEFAULT now(),
    revealed_at       TIMESTAMPTZ,
    UNIQUE(lobby_id, round_number)
    );

CREATE TABLE IF NOT EXISTS votes (
                                     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id       UUID REFERENCES rounds(id) ON DELETE CASCADE,
    voter_id       UUID REFERENCES players(id),
    voted_for_id   UUID REFERENCES players(id),
    is_correct     BOOLEAN,
    submitted_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE(round_id, voter_id)
    );

CREATE TABLE IF NOT EXISTS scores (
                                      player_id   UUID REFERENCES players(id) ON DELETE CASCADE,
    lobby_id    TEXT REFERENCES lobbies(id) ON DELETE CASCADE,
    points      INT DEFAULT 0,
    streak      INT DEFAULT 0,
    PRIMARY KEY (player_id, lobby_id)
    );

-- ─── 2. Indexes for performance ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rounds_lobby_id ON rounds (lobby_id);
CREATE INDEX IF NOT EXISTS idx_votes_round_id   ON votes (round_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id   ON votes (voter_id);
CREATE INDEX IF NOT EXISTS idx_reels_lobby_id_used ON reels (lobby_id, used);
CREATE INDEX IF NOT EXISTS idx_scores_lobby_id  ON scores (lobby_id);
CREATE INDEX IF NOT EXISTS idx_players_lobby_id ON players (lobby_id);

-- ─── 3. Enable Row Level Security (RLS) ─────────────────────────────────────
ALTER TABLE lobbies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE players  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds   ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores   ENABLE ROW LEVEL SECURITY;

-- ─── 4. Production-ready RLS policies ────────────────────────────────────────
-- Anon key: read-only access
CREATE POLICY "lobbies_select_anon" ON lobbies FOR SELECT TO anon USING (true);
CREATE POLICY "players_select_anon" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "reels_select_anon" ON reels FOR SELECT TO anon USING (true);
CREATE POLICY "rounds_select_anon" ON rounds FOR SELECT TO anon USING (true);
CREATE POLICY "votes_select_anon" ON votes FOR SELECT TO anon USING (true);
CREATE POLICY "scores_select_anon" ON scores FOR SELECT TO anon USING (true);

-- ─── 5. Enable Realtime for all game tables ──────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies, players, reels, rounds, votes, scores;