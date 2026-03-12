'use server'

/**
 * Game Service Layer — all game business logic lives here.
 *
 * Server Actions are thin controllers that validate input then delegate here.
 *
 * Return types are `Promise<Result<T, E>>` — a synchronous NeverThrow Result
 * wrapped in a Promise. Callers `await` the Promise, then use `.isOk()` /
 * `.isErr()` on the resulting Result. Do NOT return `ResultAsync` from service
 * functions — it causes a double-wrapping bug.
 *
 * Dependency direction:  Actions → Service → DAL (queries / mutations)
 */

import { ok, err, type Result }          from 'neverthrow'
import { getCurrentRound, getRoundById,
    getVotesForRound, getScores }   from './queries'
import { createRound, updateRoundStatus,
    insertVote, batchUpsertScores } from './mutations'
import { getLobbyByCode, getPlayerCount } from '@/features/lobby/queries'
import { getUnusedReels }                from '@/features/reel-import/queries'
import { markReelUsed, unmarkReelUsed }  from '@/features/reel-import/mutations'
import type { GameError }                from './errors'
import type { Vote, RoundReveal, ScoreEntry,
    StartRoundActionResult }   from './types'

// ─────────────────────────────────────────────────────────────────────────────
// startNextRound
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts the next round for a lobby.
 *
 * Business rules:
 * - Caller must be the lobby host (verified server-side against DB).
 * - Round count must not exceed `lobby.settings.roundsCount`.
 * - A random unused reel is selected and marked used.
 *
 * @param lobbyId      - Lobby identifier (6-char code).
 * @param hostPlayerId - Must match `lobby.hostId` in the DB.
 */
export async function startNextRound(
    lobbyId:      string,
    hostPlayerId: string,
): Promise<Result<StartRoundActionResult, GameError>> {
    const lobbyResult = await getLobbyByCode(lobbyId)
    if (lobbyResult.isErr()) return err({ type: 'GAME_DATABASE_ERROR', message: 'Lobby not found' })

    const lobby = lobbyResult.value
    if (lobby.hostId !== hostPlayerId) return err({ type: 'GAME_NOT_HOST', playerId: hostPlayerId })

    const currentRoundResult = await getCurrentRound(lobbyId)
    if (currentRoundResult.isErr()) return err(currentRoundResult.error)

    const nextRoundNumber = (currentRoundResult.value?.roundNumber ?? 0) + 1
    if (nextRoundNumber > lobby.settings.roundsCount) {
        return err({ type: 'GAME_ALREADY_FINISHED', lobbyId })
    }

    const unusedReelsResult = await getUnusedReels(lobbyId)
    if (unusedReelsResult.isErr()) return err({ type: 'NO_REELS_AVAILABLE', lobbyId })

    const unusedReels = unusedReelsResult.value
    if (unusedReels.length === 0) return err({ type: 'NO_REELS_AVAILABLE', lobbyId })

    // Reel rotation: exclude the last-used reel so the same reel never appears
    // twice in a row. If only 1 reel remains, we have no choice but to reuse it.
    const lastReelId = currentRoundResult.value?.reelId ?? null
    const candidates = unusedReels.length > 1 && lastReelId
        ? unusedReels.filter((r) => r.id !== lastReelId)
        : unusedReels

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]

    const markResult = await markReelUsed(chosen.id)
    if (markResult.isErr()) return err({ type: 'GAME_DATABASE_ERROR', message: 'Failed to mark reel used' })

    const roundResult = await createRound(lobbyId, nextRoundNumber, chosen.id, chosen.ownerId)
    if (roundResult.isErr()) {
        // Roll back the reel mark to avoid consuming a reel with no round created.
        // This handles the TOCTOU race where two concurrent host clicks both
        // read the same roundNumber and race to insert the same round.
        await unmarkReelUsed(chosen.id)
        return err(roundResult.error)
    }

    return ok({ ...roundResult.value, instagramUrl: chosen.instagramUrl })
}

// ─────────────────────────────────────────────────────────────────────────────
// submitVote
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Records a player's vote for the current round.
 *
 * Business rules:
 * - Round must be in `voting` status.
 * - A player may only vote once per round.
 * - Auto-triggers reveal when all lobby players have voted.
 *
 * @param roundId    - Target round.
 * @param voterId    - The voting player's UUID.
 * @param votedForId - The player UUID being voted for.
 */
export async function submitVote(
    roundId:    string,
    voterId:    string,
    votedForId: string,
): Promise<Result<Vote, GameError>> {
    const roundResult = await getRoundById(roundId)
    if (roundResult.isErr()) return err(roundResult.error)

    const round = roundResult.value
    if (round.status !== 'voting') {
        return err({ type: 'NOT_VOTING_PHASE', roundId, currentStatus: round.status })
    }

    const existingVotes = await getVotesForRound(roundId)
    if (existingVotes.isErr()) return err(existingVotes.error)

    if (existingVotes.value.some((v) => v.voterId === voterId)) {
        return err({ type: 'ALREADY_VOTED', roundId, voterId })
    }

    const voteResult = await insertVote(
        roundId,
        voterId,
        votedForId,
        votedForId === round.correctPlayerId,
    )
    if (voteResult.isErr()) return err(voteResult.error)

    // ── Auto-reveal when every player has voted ───────────────────────────────
    //
    // IMPORTANT: this MUST be awaited before returning — NOT fire-and-forget.
    //
    // In Next.js Server Actions the serverless function is torn down as soon as
    // the response is sent. Any `void` / fire-and-forget async work is silently
    // dropped in production (Vercel/Edge), meaning auto-reveal never fired.
    //
    // We re-fetch votes AFTER the insert (not before) to get the true post-
    // insert count, avoiding the N-1 TOCTOU race when two players vote
    // simultaneously. The predicated UPDATE in updateRoundStatus (`WHERE status
    // = 'voting'`) guarantees only one concurrent caller wins the transition.
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
    } catch {
        // Non-fatal — host timer is the guaranteed fallback.
    }

    return ok(voteResult.value)
}

// ─────────────────────────────────────────────────────────────────────────────
// revealRound
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transitions a round to `reveal` state and computes scores.
 *
 * Idempotent: if round is already `reveal` or `complete`, returns existing data
 * WITHOUT re-scoring (scores are only written once, on the first transition).
 *
 * Uses {@link batchUpsertScores}: 2 DB calls total regardless of player count.
 *
 * @param roundId - The round to reveal.
 */
export async function revealRound(
    roundId: string,
): Promise<Result<RoundReveal, GameError>> {
    const roundResult = await getRoundById(roundId)
    if (roundResult.isErr()) return err(roundResult.error)

    const round = roundResult.value

    // Idempotency guard — already revealed, return data without re-scoring
    if (round.status === 'complete' || round.status === 'reveal') {
        const [votesResult, scoresResult, lobbyResult] = await Promise.all([
            getVotesForRound(roundId),
            getScores(round.lobbyId),
            getLobbyByCode(round.lobbyId),
        ])
        const scores        = scoresResult.isOk() ? scoresResult.value : []
        const correctPlayer = lobbyResult.isOk()
            ? lobbyResult.value.players.find((p) => p.id === round.correctPlayerId)
            : null

        return ok({
            round,
            correctPlayerName: correctPlayer?.displayName ?? 'Unknown',
            scores,
            votes: votesResult.isOk() ? votesResult.value : [],
        })
    }

    if (round.status !== 'voting') {
        return err({
            type:    'GAME_DATABASE_ERROR',
            message: `Cannot reveal round in "${round.status}" status`,
        })
    }

    // ── voting → reveal ───────────────────────────────────────────────────────
    const statusResult = await updateRoundStatus(roundId, 'reveal')
    if (statusResult.isErr()) return err(statusResult.error)

    const votesResult = await getVotesForRound(roundId)
    if (votesResult.isErr()) return err(votesResult.error)

    // 2 DB calls total via batchUpsertScores regardless of player count
    const scoreResult = await batchUpsertScores(
        votesResult.value.map((v) => ({ voterId: v.voterId, isCorrect: v.isCorrect })),
        round.lobbyId,
    )
    if (scoreResult.isErr()) return err(scoreResult.error)

    const [updatedScores, lobbyResult] = await Promise.all([
        getScores(round.lobbyId),
        getLobbyByCode(round.lobbyId),
    ])

    const scores: ScoreEntry[] = updatedScores.isOk() ? updatedScores.value : []
    const correctPlayer = lobbyResult.isOk()
        ? lobbyResult.value.players.find((p) => p.id === round.correctPlayerId)
        : null

    return ok({
        round,
        correctPlayerName: correctPlayer?.displayName ?? 'Unknown',
        scores,
        votes: votesResult.value,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// completeRound / getScoresForLobby
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marks a round as `complete`. Called by the host after the reveal timer ends.
 *
 * @param roundId - The round to complete.
 */
export async function completeRound(roundId: string): Promise<Result<void, GameError>> {
    return updateRoundStatus(roundId, 'complete')
}

/**
 * Returns current scores for a lobby, ordered by points descending.
 *
 * @param lobbyId - Target lobby.
 */
export async function getScoresForLobby(lobbyId: string): Promise<Result<ScoreEntry[], GameError>> {
    return getScores(lobbyId)
}