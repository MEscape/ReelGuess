// ─────────────────────────────────────────────────────────────────────────────
// Round
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All possible DB round states (mirrors the `rounds.status` check constraint).
 * Note: `countdown` is intentionally absent — it is a UI-only transition phase
 * with no DB equivalent. See {@link GamePhase}.
 */
export type RoundStatus = 'voting' | 'reveal' | 'complete'

/**
 * UI-level game phase.
 * Extends {@link RoundStatus} with lifecycle phases that have no DB equivalent:
 * - `pregame`   — lobby is open, no round has started yet.
 * - `countdown` — host just started a round; reel is loading client-side.
 * - `finished`  — lobby.status transitioned to `finished`.
 */
export type GamePhase = RoundStatus | 'pregame' | 'countdown' | 'finished'

/** A single game round — camelCase representation of the `rounds` table row. */
export type Round = {
    id:               string
    lobbyId:          string
    roundNumber:      number
    reelId:           string
    /** UUID of the player whose reel is being shown. */
    correctPlayerId:  string | null
    status:           RoundStatus
    startedAt:        Date
    revealedAt:       Date | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Reel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal reel display data passed to the client.
 * `embed_html` / `thumbnail_url` / `caption` are always null and are omitted.
 */
export type ReelData = { instagramUrl: string }

/**
 * Return type of {@link startNextRoundAction} — the new round plus the
 * Instagram URL needed to display the reel immediately on the host's client.
 */
export type StartRoundActionResult = Round & { instagramUrl: string }

// ─────────────────────────────────────────────────────────────────────────────
// Vote
// ─────────────────────────────────────────────────────────────────────────────

/** A single player's vote in a round. */
export type Vote = {
    id:         string
    roundId:    string
    voterId:    string
    votedForId: string
    isCorrect:  boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Score
// ─────────────────────────────────────────────────────────────────────────────

/** A player's score entry, joined with their display info. */
export type ScoreEntry = {
    playerId:    string
    displayName: string
    avatarSeed:  string
    /** Total accumulated points in this lobby. */
    points:      number
    /** Consecutive correct-vote streak. Resets to 0 on a wrong vote. */
    streak:      number
}

// ─────────────────────────────────────────────────────────────────────────────
// Reveal
// ─────────────────────────────────────────────────────────────────────────────

/** Everything needed to render {@link RevealScreen}. */
export type RoundReveal = {
    round:             Round
    correctPlayerName: string
    scores:            ScoreEntry[]
    votes:             Vote[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw DB rows  (snake_case — only used inside DAL, never exported to components)
// ─────────────────────────────────────────────────────────────────────────────

/** @internal */
export type RoundRow = {
    id:                string
    lobby_id:          string
    round_number:      number
    reel_id:           string
    correct_player_id: string | null
    status:            string
    started_at:        string
    revealed_at:       string | null
}

/** @internal */
export type VoteRow = {
    id:           string
    round_id:     string
    voter_id:     string
    voted_for_id: string
    is_correct:   boolean
    submitted_at: string
}

/** @internal */
export type ScoreRow = {
    player_id: string
    lobby_id:  string
    points:    number
    streak:    number
    players?: {
        display_name: string
        avatar_seed:  string
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ROUND_STATUSES: ReadonlySet<string> = new Set<RoundStatus>(['voting', 'reveal', 'complete'])

function parseRoundStatus(raw: string): RoundStatus {
    if (VALID_ROUND_STATUSES.has(raw)) return raw as RoundStatus
    // 'countdown' is a DB check-constraint value but UI-only — treat as 'voting'
    if (raw === 'countdown') return 'voting'
    throw new Error(`Unknown round status: "${raw}"`)
}

/** Converts a raw `rounds` DB row to the typed {@link Round} shape. */
export function mapRoundRow(row: RoundRow): Round {
    return {
        id:              row.id,
        lobbyId:         row.lobby_id,
        roundNumber:     row.round_number,
        reelId:          row.reel_id,
        correctPlayerId: row.correct_player_id,
        status:          parseRoundStatus(row.status),
        startedAt:       new Date(row.started_at),
        revealedAt:      row.revealed_at ? new Date(row.revealed_at) : null,
    }
}

/** Converts a raw `votes` DB row to the typed {@link Vote} shape. */
export function mapVoteRow(row: VoteRow): Vote {
    return {
        id:         row.id,
        roundId:    row.round_id,
        voterId:    row.voter_id,
        votedForId: row.voted_for_id,
        isCorrect:  row.is_correct,
    }
}