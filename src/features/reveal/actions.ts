'use server'

import { revealRound }           from './service'
import { RevealRoundSchema }     from './validations'
import { rateLimitFromIP }       from '@/lib/rate-limit'
import { withSentry }            from '@/lib/sentry-action'
import type { GameError }        from '@/features/game'
import type { SerializedResult } from '@/lib/errors/error-handler'
import type { RoundReveal }      from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reveals a round, calculates scores, and returns the full reveal snapshot.
 *
 * Called in two scenarios:
 * 1. Host's round timer fires (`onTimerComplete` in `use-game-orchestration`).
 * 2. Auto-reveal in `submitVoteAction` when all players have voted.
 *
 * Rate limited per IP: 20 reveals per minute.
 * The underlying service is idempotent — concurrent calls are safe.
 */
export const revealRoundAction = withSentry(
    'revealRoundAction',
    async (roundId: string): Promise<SerializedResult<RoundReveal, GameError>> => {
        const rl = await rateLimitFromIP('revealRound')
        if (!rl.success) {
            return { ok: false, error: { type: 'RATE_LIMITED', message: 'Too many requests. Please wait.' } }
        }

        const parsed = RevealRoundSchema.safeParse({ roundId })
        if (!parsed.success) {
            return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid round ID' } }
        }

        const result = await revealRound(parsed.data.roundId)
        if (result.isErr()) return { ok: false, error: result.error }
        return { ok: true, value: result.value }
    },
)
