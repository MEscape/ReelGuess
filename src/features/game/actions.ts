'use server'

/**
 * Game Server Actions — thin controllers.
 *
 * Each action:
 * 1. Applies rate limiting via Upstash Redis.
 * 2. Validates raw input with Zod.
 * 3. Delegates to the service layer.
 * 4. Serialises the Result to a plain SerializedResult safe for the Action boundary.
 *
 * No business logic lives here.
 */

import { SubmitVoteSchema, StartNextRoundSchema, RevealRoundSchema } from './validations'
import { startNextRound, submitVote, revealRound,
    completeRound, getScoresForLobby }                         from './service'
import { getVotesForRound }                                          from './queries'
import type { GameError }                                            from './errors'
import type { SerializedResult }                                     from '@/lib/errors/error-handler'
import type { Vote, RoundReveal, ScoreEntry,
    StartRoundActionResult }                               from './types'
import { rateLimitFromIP }                                           from '@/lib/rate-limit'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts the next round.
 *
 * Rate limited per hostPlayerId: 20 starts per minute.
 * Only the host may call this — validated server-side.
 */
export async function startNextRoundAction(
    lobbyId:      string,
    hostPlayerId: string,
): Promise<SerializedResult<StartRoundActionResult, GameError>> {
    const rl = await rateLimitFromIP('startRound', hostPlayerId)
    if (!rl.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Too many requests. Please wait.' } }
    }

    const parsed = StartNextRoundSchema.safeParse({ lobbyId, hostPlayerId })
    if (!parsed.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
    }

    const result = await startNextRound(parsed.data.lobbyId, parsed.data.hostPlayerId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: result.value }
}

/**
 * Submits a vote for the current round.
 *
 * Rate limited per voterId: 20 votes per minute.
 * Returns `ALREADY_VOTED` if the player has already voted this round.
 */
export async function submitVoteAction(
    roundId:    string,
    voterId:    string,
    votedForId: string,
): Promise<SerializedResult<Vote, GameError>> {
    const rl = await rateLimitFromIP('submitVote', voterId)
    if (!rl.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Too many requests. Please wait.' } }
    }

    const parsed = SubmitVoteSchema.safeParse({ roundId, voterId, votedForId })
    if (!parsed.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
    }

    const result = await submitVote(parsed.data.roundId, parsed.data.voterId, parsed.data.votedForId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: result.value }
}

/**
 * Reveals a round — transitions status to `reveal` and computes scores.
 * Idempotent: safe to call multiple times.
 *
 * Rate limited per IP: 20 reveals per minute.
 */
export async function revealRoundAction(
    roundId: string,
): Promise<SerializedResult<RoundReveal, GameError>> {
    const rl = await rateLimitFromIP('revealRound')
    if (!rl.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Too many requests. Please wait.' } }
    }

    const parsed = RevealRoundSchema.safeParse({ roundId })
    if (!parsed.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid round ID' } }
    }

    const result = await revealRound(parsed.data.roundId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: result.value }
}

/**
 * Marks a round as complete. Called by the host after the reveal countdown.
 *
 * Rate limited per IP: 20 completions per minute.
 */
export async function completeRoundAction(
    roundId: string,
): Promise<SerializedResult<void, GameError>> {
    const rl = await rateLimitFromIP('completeRound')
    if (!rl.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Too many requests. Please wait.' } }
    }

    const result = await completeRound(roundId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: undefined }
}

/**
 * Returns the current scores for a lobby.
 */
export async function getScoresAction(
    lobbyId: string,
): Promise<SerializedResult<ScoreEntry[], GameError>> {
    const result = await getScoresForLobby(lobbyId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: result.value }
}

/**
 * Checks whether a player has already voted in a round.
 *
 * Replaces the previous direct Supabase client call in `useRound` —
 * keeping all DB access server-side so the anon key is never used for
 * sensitive queries from the browser.
 *
 * @param roundId  - The round to check.
 * @param playerId - The player whose vote to look up.
 */
export async function checkExistingVoteAction(
    roundId:  string,
    playerId: string,
): Promise<SerializedResult<boolean, GameError>> {
    const votesResult = await getVotesForRound(roundId)
    if (votesResult.isErr()) return { ok: false, error: votesResult.error }
    const hasVoted = votesResult.value.some((v) => v.voterId === playerId)
    return { ok: true, value: hasVoted }
}
