import { ok, err }              from 'neverthrow'
import { getRoundById, updateRoundStatus }         from '@/features/round'
import { getVotesForRound, batchUpdateVotePoints } from '@/features/voting'
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

    // Load votes and PRE-REVEAL scores BEFORE the status transition.
    // This snapshot is used as the achievement baseline by BOTH the winner
    // and the non-winner path — ensuring consistent achievement detection
    // regardless of which concurrent caller "won" the race.
    const [votesResult, priorScoresResult] = await Promise.all([
        getVotesForRound(roundId),
        getScoresForLobby(round.lobbyId),
    ])

    if (votesResult.isErr())       return err(votesResult.error)
    if (priorScoresResult.isErr()) return err(priorScoresResult.error)

    const votes       = votesResult.value
    const priorScores = priorScoresResult.value

    // If already past voting, this is a late/retry caller — skip the transition.
    const alreadyPastVoting = round.status === 'reveal' || round.status === 'complete'
    let thisCallerTransitioned = false

    if (!alreadyPastVoting) {
        // Predicated UPDATE: only succeeds when status = 'voting'.
        // Returns { transitioned: true } if WE made the transition,
        // { transitioned: false } if a concurrent caller already did.
        const statusResult = await updateRoundStatus(roundId, 'reveal')
        if (statusResult.isErr()) return err(statusResult.error)
        thisCallerTransitioned = statusResult.value.transitioned
    }

    // Non-winner path: scores and points_awarded are being written by the winner
    // concurrently. Re-read both so we have the final persisted values.
    if (!thisCallerTransitioned) {
        const [freshVotesResult, persistedScoresResult] = await Promise.all([
            getVotesForRound(roundId),
            getScoresForLobby(round.lobbyId),
        ])
        if (freshVotesResult.isErr())      return err(freshVotesResult.error)
        if (persistedScoresResult.isErr()) return err(persistedScoresResult.error)

        const freshVotes      = freshVotesResult.value
        const persistedScores = persistedScoresResult.value
        // priorScores (loaded before transition) is the correct baseline for
        // detecting which thresholds were newly crossed this round.
        const achievements = detectAchievements(roundId, freshVotes, persistedScores, priorScores)
        return ok({ round, votes: freshVotes, scores: persistedScores, achievements })
    }

    // Winner path — calculate, persist scores, and write points_awarded to DB.
    const { updatedVotes, updatedScores, scoreRows } = calculateRoundScores(votes, priorScores, round.roundNumber)

    // Persist scores and points_awarded in parallel.
    // points_awarded on the vote row is the source of truth for the reveal UI —
    // every client (including non-winners) reads it from the DB.
    const [upsertResult, pointsResult] = await Promise.all([
        batchUpsertScores(round.lobbyId, scoreRows),
        batchUpdateVotePoints(updatedVotes.map((v) => ({ id: v.id, pointsAwarded: v.pointsAwarded }))),
    ])
    if (upsertResult.isErr()) return err(upsertResult.error)
    if (pointsResult.isErr()) return err(pointsResult.error)

    const achievements = detectAchievements(roundId, updatedVotes, updatedScores, priorScores)

    return ok({
        round,
        votes:        updatedVotes,
        scores:       updatedScores,
        achievements,
    })
}