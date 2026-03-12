// ─────────────────────────────────────────────────────────────────────────────
// Scoring types
// ─────────────────────────────────────────────────────────────────────────────

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
 */
export type Achievement =
    | { type: 'STREAK_5';      playerId: string; playerName: string; streak: number }
    | { type: 'STREAK_10';     playerId: string; playerName: string; streak: number }
    | { type: 'FASTEST_VOTE';  playerId: string; playerName: string; voteTimeMs: number }
    | { type: 'DOUBLE_SUCCESS'; playerId: string; playerName: string; pointsEarned: number }
    | { type: 'BIG_POINTS';    playerId: string; playerName: string; pointsEarned: number }
