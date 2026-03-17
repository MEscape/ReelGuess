'use server'

import { submitVote, submitDouble }   from './service'
import { checkPlayerVoted }           from './queries'
import { SubmitVoteSchema,
    SubmitDoubleSchema,
    CheckExistingVoteSchema }     from './validations'
import { rateLimitFromIP }            from '@/lib/rate-limit'
import { withSentry }                 from '@/lib/sentry-action'
import type { GameError }             from '@/features/game'
import type { SerializedResult }      from '@/lib/errors/error-handler'
import type { Vote }                  from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submits a vote for the current round.
 *
 * Rate limited per player: 20 votes per minute.
 * The second argument to `rateLimitFromIP` is the **bucket key** — it
 * namespaces the counter per player so concurrent sessions for the same
 * player share the same limit. The IP is sourced from the request context
 * inside `rateLimitFromIP` itself.
 *
 * Returns `ALREADY_VOTED` if the player has already voted this round.
 */
export const submitVoteAction = withSentry(
    'submitVoteAction',
    async (
        roundId:    string,
        voterId:    string,
        votedForId: string,
    ): Promise<SerializedResult<Vote, GameError>> => {
        const rl = await rateLimitFromIP('submitVote', voterId)
        if (!rl.success) {
            return { ok: false, error: { type: 'RATE_LIMITED', message: 'Too many requests. Please wait.' } }
        }

        const parsed = SubmitVoteSchema.safeParse({ roundId, voterId, votedForId })
        if (!parsed.success) {
            return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
        }

        const result = await submitVote(parsed.data.roundId, parsed.data.voterId, parsed.data.votedForId)
        if (result.isErr()) return { ok: false, error: result.error }
        return { ok: true, value: result.value }
    },
)

/**
 * Activates Double-or-Nothing for a player's vote.
 *
 * Rate limited per player: 10 doubles per minute (prevents exploit spam).
 * Only valid while the round is in `voting` status.
 * Player must have already submitted a vote (`HAS_NOT_VOTED` otherwise).
 */
export const submitDoubleAction = withSentry(
    'submitDoubleAction',
    async (
        roundId: string,
        voterId: string,
    ): Promise<SerializedResult<void, GameError>> => {
        const rl = await rateLimitFromIP('submitDouble', voterId)
        if (!rl.success) {
            return { ok: false, error: { type: 'RATE_LIMITED' } }
        }

        const parsed = SubmitDoubleSchema.safeParse({ roundId, voterId })
        if (!parsed.success) {
            return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
        }

        const result = await submitDouble(parsed.data.roundId, parsed.data.voterId)
        if (result.isErr()) return { ok: false, error: result.error }
        return { ok: true, value: undefined }
    },
)

/**
 * Checks whether a player has already voted in a round.
 *
 * Used by `useVote` on mount and round-change to restore vote state after a
 * page refresh mid-round. All DB access stays server-side.
 *
 * Uses a targeted `SELECT id … LIMIT 1` query rather than loading the full
 * votes array — avoids an unnecessary over-fetch for a boolean answer.
 */
export const checkExistingVoteAction = withSentry(
    'checkExistingVoteAction',
    async (
        roundId:  string,
        playerId: string,
    ): Promise<SerializedResult<boolean, GameError>> => {
        const parsed = CheckExistingVoteSchema.safeParse({ roundId, playerId })
        if (!parsed.success) {
            return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
        }

        const result = await checkPlayerVoted(parsed.data.roundId, parsed.data.playerId)
        if (result.isErr()) return { ok: false, error: result.error }
        return { ok: true, value: result.value }
    },
)
