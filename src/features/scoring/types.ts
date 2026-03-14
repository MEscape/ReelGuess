// ─────────────────────────────────────────────────────────────────────────────
// Scoring types
// ─────────────────────────────────────────────────────────────────────────────

export type ScoreEntry = {
    playerId:    string
    displayName: string
    avatarSeed:  string
    /** Total accumulated points in this lobby. */
    points:      number
    /** Consecutive correct-vote streak. Resets to 0 on a wrong vote. */
    streak:      number
}

/**
 * Raw DB write shape for the scores upsert.
 *
 * `lobby_id` is intentionally absent — it is a write-time concern supplied
 * by the caller of `batchUpsertScores`, not a scoring calculation concern.
 * Keeping it off this type enforces a single source of truth at the call site.
 *
 * @internal
 */
export type ScoreRow = {
    player_id: string
    points:    number
    streak:    number
    players?: {
        display_name: string
        avatar_seed:  string
    }
}

/** Input parameters for the scoring calculation function. */
export type ScoreInput = {
    /** Whether the player guessed correctly this round. */
    isCorrect:  boolean
    /** Milliseconds elapsed between round start and vote submission. Null if unknown. */
    voteTimeMs: number | null
    /** Player's current consecutive-correct-guess streak BEFORE this vote. */
    streak:     number
    /** Whether the player activated the Double-or-Nothing mechanic this round. */
    usedDouble: boolean
    /** Player's current total points BEFORE this round (used for wrong-double penalty). */
    currentPoints: number
}

/** Output of the scoring calculation function. */
export type ScoreOutput = {
    /** Final points awarded (may be negative if double-wrong). */
    pointsEarned:     number
    /** New streak value after this vote. */
    newStreak:        number
    /** Streak multiplier applied (1.0 – 2.0). */
    streakMultiplier: number
    /** Speed multiplier applied (1.0 – 1.5). Only > 1 on fast correct votes. */
    speedMultiplier:  number
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An achievement event generated during round scoring.
 * `playerName` is populated by the service layer from lobby player data.
 *
 * Note: achievement keys combine `type` and `playerId`. If the same player
 * earns the same achievement type in two consecutive rounds (e.g. STREAK_5
 * after a streak reset), add `roundId` to this union to make keys unique
 * across rounds.
 */
export type Achievement =
    | { type: 'STREAK_5';       playerId: string; playerName: string; streak: number }
    | { type: 'STREAK_10';      playerId: string; playerName: string; streak: number }
    | { type: 'DOUBLE_SUCCESS'; playerId: string; playerName: string; pointsEarned: number }
    | { type: 'BIG_POINTS';     playerId: string; playerName: string; pointsEarned: number }
