import type { Achievement, ScoreEntry } from '@/features/scoring'
import type { Round }                   from '@/features/round'
import type { Vote }                    from '@/features/voting'

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

/** Everything needed to render {@link RevealScreen}. */
export type RoundReveal = {
    round:        Round
    scores:       ScoreEntry[]
    votes:        Vote[]
    /**
     * Achievements earned this round — used to trigger hero overlays.
     *
     * @remarks
     * Achievements are intentionally ephemeral: they are computed in
     * `revealRound` for this session only and are not persisted to the
     * database. They exist solely to drive in-round UI animations. If a
     * player disconnects and reconnects mid-reveal, achievements will not
     * reappear — this is an accepted trade-off.
     */
    achievements: Achievement[]
}