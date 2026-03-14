'use server'

import { startNextRound, completeRound } from './service'
import { getCurrentRound }               from './queries'
import {
    StartNextRoundSchema,
    CompleteRoundSchema, GetCurrentRoundSchema
} from './validations'
import { rateLimitFromIP }               from '@/lib/rate-limit'
import type { GameError }                from '@/features/game'
import type { SerializedResult }         from '@/lib/errors/error-handler'
import type { StartRoundActionResult,
    Round }                        from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts the next round for a lobby.
 *
 * Rate limited per `hostPlayerId`: 20 starts per minute.
 * Host identity is verified server-side against the DB — not trusted from client.
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
 * Marks a round as complete. Called by the host after the reveal countdown.
 *
 * If this was the final round, the service transitions the lobby to `finished`.
 * Rate limited per `roundId`: 20 completions per minute per round — prevents
 * a global shared bucket being exhausted by a single caller.
 */
export async function completeRoundAction(
    roundId: string,
): Promise<SerializedResult<void, GameError>> {
    const rl = await rateLimitFromIP('completeRound', roundId)
    if (!rl.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Too many requests. Please wait.' } }
    }

    const parsed = CompleteRoundSchema.safeParse({ roundId })
    if (!parsed.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid round ID' } }
    }

    const result = await completeRound(parsed.data.roundId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: undefined }
}

/**
 * Returns the current round for a lobby.
 *
 * Used as a post-vote polling fallback when Realtime delivery is slow.
 * No rate limit — this is a read-only HEAD-equivalent call.
 */
export async function getCurrentRoundAction(
    lobbyId: string,
): Promise<SerializedResult<Round | null, GameError>> {
    const parsed = GetCurrentRoundSchema.safeParse({ lobbyId })
    if (!parsed.success) {
        return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid lobby code' } }
    }

    const result = await getCurrentRound(parsed.data.lobbyId)
    if (result.isErr()) return { ok: false, error: result.error }
    return { ok: true, value: result.value }
}