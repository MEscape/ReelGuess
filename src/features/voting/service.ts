import { ok, err }              from 'neverthrow'
import { getRoundById }          from '@/features/round'
import { getPlayerCount }        from '@/features/lobby'
import { revealRound }           from '@/features/reveal'
import { getVotesForRound }      from './queries'
import { updateVoteDouble, insertVote }      from './mutations'
import type { GameResult }       from '@/features/game'
import type { Vote }             from './types'

// ─────────────────────────────────────────────────────────────────────────────
// submitVote
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Records a player's vote for the current round.
 *
 * Business rules:
 * - Round must be in `voting` status.
 * - A player may only vote once per round (`ALREADY_VOTED` on repeat).
 * - Automatically triggers reveal when all lobby players have voted.
 *
 * ### Auto-reveal race prevention
 * Votes are re-fetched AFTER the insert to get the true post-insert count,
 * avoiding the N-1 TOCTOU race when two players vote simultaneously.
 * The predicated `WHERE status = 'voting'` inside `revealRound` ensures only
 * one concurrent caller wins the status transition.
 *
 * ### Why auto-reveal is awaited (not fire-and-forget)
 * Next.js Server Actions tear down the serverless function as soon as the
 * response is sent. Fire-and-forget async work is silently dropped on
 * Vercel/Edge runtimes. We must await before returning.
 *
 * @param roundId    - Target round UUID.
 * @param voterId    - The voting player's UUID.
 * @param votedForId - The player UUID being voted for.
 */
export async function submitVote(
    roundId:    string,
    voterId:    string,
    votedForId: string,
): Promise<GameResult<Vote>> {
    const roundResult = await getRoundById(roundId)
    if (roundResult.isErr()) return err(roundResult.error)

    const round = roundResult.value
    if (round.status !== 'voting') {
        return err({ type: 'NOT_VOTING_PHASE', roundId, currentStatus: round.status })
    }

    const existingVotesResult = await getVotesForRound(roundId)
    if (existingVotesResult.isErr()) return err(existingVotesResult.error)

    if (existingVotesResult.value.some((v) => v.voterId === voterId)) {
        return err({ type: 'ALREADY_VOTED', roundId, voterId })
    }

    const voteResult = await insertVote(
        roundId,
        voterId,
        votedForId,
        votedForId === round.correctPlayerId,
        Math.max(0, Date.now() - round.startedAt.getTime()),
    )
    if (voteResult.isErr()) return err(voteResult.error)

    // ── Auto-reveal ───────────────────────────────────────────────────────────
    // Non-fatal: the host timer is the guaranteed reveal fallback.
    // Errors are logged (not swallowed) so production issues remain visible.
    try {
        const [countResult, freshVotesResult] = await Promise.all([
            getPlayerCount(round.lobbyId),
            getVotesForRound(roundId),
        ])
        if (countResult.isOk() && freshVotesResult.isOk()) {
            if (freshVotesResult.value.length >= countResult.value) {
                await revealRound(roundId)
            }
        }
    } catch (e) {
        // Non-fatal — host timer will trigger reveal as a fallback.
        console.error('[game-vote] auto-reveal failed', e)
    }

    return ok(voteResult.value)
}

// ─────────────────────────────────────────────────────────────────────────────
// submitDouble
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activates the Double-or-Nothing mechanic for a player's vote.
 *
 * Business rules:
 * - Round must still be in `voting` status (doubles lock at reveal).
 * - Player must have already voted this round (`HAS_NOT_VOTED` otherwise).
 * - Idempotent — activating twice is safe (DB predicate guards the update).
 *
 * `HAS_NOT_VOTED` is a domain rule error, not a DB error. The hook can
 * switch on it without fragile message-string matching.
 *
 * @param roundId - Target round UUID.
 * @param voterId - The player activating Double-or-Nothing.
 */
export async function submitDouble(
    roundId: string,
    voterId: string,
): Promise<GameResult<void>> {
    const roundResult = await getRoundById(roundId)
    if (roundResult.isErr()) return err(roundResult.error)

    const round = roundResult.value
    if (round.status !== 'voting') {
        return err({ type: 'NOT_VOTING_PHASE', roundId, currentStatus: round.status })
    }

    const existingVotesResult = await getVotesForRound(roundId)
    if (existingVotesResult.isErr()) return err(existingVotesResult.error)

    if (!existingVotesResult.value.some((v) => v.voterId === voterId)) {
        return err({ type: 'HAS_NOT_VOTED', roundId, voterId })
    }

    const result = await updateVoteDouble(roundId, voterId)
    if (result.isErr()) return err(result.error)
    return ok(undefined)
}