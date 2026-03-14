import type { ReelData }    from '@/features/reel-player'

// ─────────────────────────────────────────────────────────────────────────────
// Domain type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All possible DB round states.
 *
 * Mirrors the `rounds.status` check constraint.
 * `countdown` is UI-only and intentionally absent — see {@link GamePhase}.
 */
export type RoundStatus = 'voting' | 'reveal' | 'complete'

/** A single game round — camelCase representation of the `rounds` table row. */
export type Round = {
    id:              string
    lobbyId:         string
    roundNumber:     number
    reelId:          string
    /** UUID of the player whose reel is being shown. */
    correctPlayerId: string | null
    status:          RoundStatus
    startedAt:       Date
    revealedAt:      Date | null
}

/**
 * Return type of {@link startNextRoundAction} — the new round plus the
 * Instagram URL needed to display the reel immediately on the host's client.
 */
export type StartRoundActionResult = Round & ReelData
