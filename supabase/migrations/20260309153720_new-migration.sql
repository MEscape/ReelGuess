-- ReelGuess Database Schema
-- Run this in your Supabase SQL Editor

-- Enable realtime on all game tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE lobbies, players, reels, rounds, votes, scores;

CREATE TABLE IF NOT EXISTS lobbies (
                                       id            TEXT PRIMARY KEY,
                                       host_id       UUID NOT NULL,
                                       status        TEXT DEFAULT 'waiting'
                                       CHECK (status IN ('waiting','playing','finished')),
    settings      JSONB DEFAULT '{"rounds_count":7,"timer_seconds":15}',
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
    embed_html    TEXT,
    thumbnail_url TEXT,
    caption       TEXT,
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

-- votes table without GENERATED column
CREATE TABLE IF NOT EXISTS votes (
                                     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id       UUID REFERENCES rounds(id) ON DELETE CASCADE,
    voter_id       UUID REFERENCES players(id),
    voted_for_id   UUID REFERENCES players(id),
    is_correct     BOOLEAN,
    submitted_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE(round_id, voter_id)
    );

-- Trigger function to compute is_correct
CREATE OR REPLACE FUNCTION set_is_correct()
RETURNS TRIGGER AS $$
BEGIN
SELECT r.correct_player_id
INTO STRICT NEW.is_correct
FROM rounds r
WHERE r.id = NEW.round_id;

NEW.is_correct := (NEW.voted_for_id = NEW.is_correct);

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to fire BEFORE INSERT or UPDATE on votes
CREATE TRIGGER votes_set_is_correct
    BEFORE INSERT OR UPDATE ON votes
                         FOR EACH ROW
                         EXECUTE FUNCTION set_is_correct();

CREATE TABLE IF NOT EXISTS scores (
                                      player_id   UUID REFERENCES players(id) ON DELETE CASCADE,
    lobby_id    TEXT REFERENCES lobbies(id) ON DELETE CASCADE,
    points      INT DEFAULT 0,
    streak      INT DEFAULT 0,
    PRIMARY KEY (player_id, lobby_id)
    );

-- Enable Row Level Security (permissive for now)
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Permissive policies (allow all for anon key - adjust for production)
CREATE POLICY "Allow all" ON lobbies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON scores FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies, players, reels, rounds, votes, scores;
