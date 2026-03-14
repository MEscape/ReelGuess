// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

/** A single player's vote in a round. */
export type Vote = {
    id:            string
    roundId:       string
    voterId:       string
    votedForId:    string
    isCorrect:     boolean
    /** Milliseconds between round start and vote submission. Null if not yet stored. */
    voteTimeMs:    number | null
    /** Whether the player activated Double-or-Nothing for this vote. */
    usedDouble:    boolean
    /** Final points awarded for this vote (computed at reveal). Null until reveal. */
    pointsAwarded: number | null
}