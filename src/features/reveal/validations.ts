import { z } from 'zod'

/**
 * Validates input for `revealRoundAction`.
 *
 * Lives here — not in `game-round/validations` — because reveal is a distinct
 * phase with its own action, service, and lifecycle. `game-reveal` owns its
 * own input validation.
 */
export const RevealRoundSchema = z.object({
    roundId: z.string().uuid('roundId must be a UUID'),
})

export type RevealRoundInput = z.infer<typeof RevealRoundSchema>