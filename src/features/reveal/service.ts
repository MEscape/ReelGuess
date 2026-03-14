import { ok, err }              from 'neverthrow'
import { getRoundById, updateRoundStatus }         from '@/features/round'
import { getVotesForRound }     from '@/features/voting'
import { detectAchievements, calculateRoundScores, batchUpsertScores, getScoresForLobby }   from '@/features/scoring'
import type { GameResult }      from '@/features/game'
import type { RoundReveal }     from './types'

// ─────────────────────────────────────────────────────────────────────────────
// revealRound
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transitions a round from `voting` → `reveal`, calculates scores and
 * achievements, and persists scores in a single logical unit.
 *
 * ### Idempotency
 * `updateRoundStatus` uses a predicated `WHERE status = 'voting'` UPDATE.
 * If two concurrent callers (e.g. auto-reveal racing with the host's timer)
 * both call `revealRound`, only one wins the transition. The second sees a
 * no-op from the predicated update but still re-derives and returns reveal
 * data from the latest vote snapshot — safe for both callers.
 *
 * ### Known partial-failure risk
 * If `updateRoundStatus` succeeds but the subsequent `Promise.all` or
 * `batchUpsertScores` fails, the round is left in `reveal` status with no
 * scores persisted. The predicated update means a retry cannot re-transition
 * the status. Resolving this requires either:
 * - Wrapping the entire operation in a DB transaction (preferred long-term), or
 * - Adding a compensating `updateRoundStatus(roundId, 'voting')` on error.
 * This is deferred — it requires changes to `game-round/mutations` outside
 * this feature's boundary. Tracked as tech debt.
 *
 * ### Score calculation
 * Delegates to `scoring/service.calculateRoundScores` which applies:
 * - Base points for a correct vote
 * - Streak multiplier
 * - Speed bonus (voteTimeMs)
 * - Double-or-Nothing modifier
 *
 * ### Achievements
 * `detectAchievements` is called for in-round UI animations only.
 * Achievements are intentionally NOT persisted — see `types.ts` for rationale.
 *
 * ### Why this lives in game-reveal and not game-round
 * Reveal is a distinct phase: it reads votes, scores them, persists results,
 * detects achievements, and returns an aggregated snapshot. None of that
 * belongs to the round lifecycle (start/complete) or vote submission.
 *
 * @param roundId - The round to reveal.
 */
export async function revealRound(roundId: string): Promise<GameResult<RoundReveal>> {
    const roundResult = await getRoundById(roundId)
    if (roundResult.isErr()) return err(roundResult.error)

    const round = roundResult.value

    // Transition to reveal (idempotent — predicate prevents double-transition).
    const statusResult = await updateRoundStatus(roundId, 'reveal')
    if (statusResult.isErr()) return err(statusResult.error)

    // NOTE: If either of these fails after the status transition above, the
    // round will be stuck in `reveal` with no scores. See the partial-failure
    // risk note in the JSDoc above.
    const [votesResult, priorScoresResult] = await Promise.all([
        getVotesForRound(roundId),
        getScoresForLobby(round.lobbyId),
    ])

    if (votesResult.isErr())       return err(votesResult.error)
    if (priorScoresResult.isErr()) return err(priorScoresResult.error)

    const votes       = votesResult.value
    const priorScores = priorScoresResult.value

    const { updatedVotes, updatedScores, scoreRows } = calculateRoundScores(votes, priorScores)

    // Persist scores (idempotent upsert).
    const upsertResult = await batchUpsertScores(round.lobbyId, scoreRows)
    if (upsertResult.isErr()) return err(upsertResult.error)

    // Achievements are ephemeral — computed for this session's UI only, not persisted.
    const achievements = detectAchievements(updatedVotes, updatedScores, priorScores)

    return ok({
        round,
        votes:        updatedVotes,
        scores:       updatedScores,
        achievements,
    })
}