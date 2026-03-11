'use server'

/**
 * Game Server Actions — thin controllers.
 *
 * Each action:
 * 1. Applies rate limiting via Upstash Redis.
 * 2. Validates raw input with Zod.
 * 3. Delegates to the service layer.
 * 4. Serialises the Result to a plain `SerializedResult` safe for the Action boundary.
 *
 * No business logic lives here.
 */

import { SubmitVoteSchema, StartNextRoundSchema, RevealRoundSchema } from './validations'
import { startNextRound, submitVote, revealRound, completeRound, getScoresForLobby } from './service'
import type { GameError }        from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import type { Vote, RoundReveal, ScoreEntry, StartRoundActionResult } from './types'
import { rateLimitFromIP }       from '@/lib/rate-limit'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts the next round.
 *
 * Rate limited per hostPlayerId: 5 starts per minute.
 * Only the host may call this — `hostPlayerId` is validated server-side.
 */
export async function startNextRoundAction(
    lobbyId: string,
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
    roundId: string,
    voterId: string,
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
 */
export async function revealRoundAction(
    roundId: string,
): Promise<SerializedResult<RoundReveal, GameError>> {
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
 */
export async function completeRoundAction(
    roundId: string,
): Promise<SerializedResult<void, GameError>> {
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