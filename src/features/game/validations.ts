import { z } from 'zod'

export const SubmitVoteSchema = z.object({
  roundId: z.string().uuid(),
  voterId: z.string().uuid(),
  votedForId: z.string().uuid(),
})

export const StartNextRoundSchema = z.object({
  lobbyId: z.string().length(6),
  hostPlayerId: z.string().uuid(),
})

export const RevealRoundSchema = z.object({
  roundId: z.string().uuid(),
})

export type SubmitVoteInput = z.infer<typeof SubmitVoteSchema>
export type StartNextRoundInput = z.infer<typeof StartNextRoundSchema>

