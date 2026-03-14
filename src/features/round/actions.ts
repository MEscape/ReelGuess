'use server'

import { startNextRound, completeRound } from './service'
import { getCurrentRound }               from './queries'
import {
    StartNextRoundSchema,
    CompleteRoundSchema, GetCurrentRoundSchema
} from './validations'
import { rateLimitFromIP }               from '@/lib/rate-limit'
import { withSentry }                    from '@/lib/sentry-action'
import type { GameError }                from '@/features/game'
import type { SerializedResult }         from '@/lib/errors/error-handler'
import type { StartRoundActionResult,
    Round }                        from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

export const startNextRoundAction = withSentry(
    'startNextRoundAction',
    async (
        lobbyId:      string,
        hostPlayerId: string,
    ): Promise<SerializedResult<StartRoundActionResult, GameError>> => {
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
    },
)

export const completeRoundAction = withSentry(
    'completeRoundAction',
    async (roundId: string): Promise<SerializedResult<void, GameError>> => {
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
    },
)

export const getCurrentRoundAction = withSentry(
    'getCurrentRoundAction',
    async (lobbyId: string): Promise<SerializedResult<Round | null, GameError>> => {
        const parsed = GetCurrentRoundSchema.safeParse({ lobbyId })
        if (!parsed.success) {
            return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid lobby code' } }
        }

        const result = await getCurrentRound(parsed.data.lobbyId)
        if (result.isErr()) return { ok: false, error: result.error }
        return { ok: true, value: result.value }
    },
)
