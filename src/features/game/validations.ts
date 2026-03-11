import { z } from 'zod'

/**
 * Validates the input for {@link submitVoteAction}.
 * All three IDs must be UUIDs — rejects spoofed/garbage strings early.
 */
export const SubmitVoteSchema = z.object({
    roundId:    z.string().uuid('roundId must be a UUID'),
    voterId:    z.string().uuid('voterId must be a UUID'),
    votedForId: z.string().uuid('votedForId must be a UUID'),
})

/**
 * Validates the input for {@link startNextRoundAction}.
 * `lobbyId` is the 6-char alphanumeric code.
 */
export const StartNextRoundSchema = z.object({
    lobbyId:      z.string().length(6, 'lobbyId must be exactly 6 characters'),
    hostPlayerId: z.string().uuid('hostPlayerId must be a UUID'),
})

/**
 * Validates the input for {@link revealRoundAction}.
 */
export const RevealRoundSchema = z.object({
    roundId: z.string().uuid('roundId must be a UUID'),
})

export type SubmitVoteInput    = z.infer<typeof SubmitVoteSchema>
export type StartNextRoundInput = z.infer<typeof StartNextRoundSchema>