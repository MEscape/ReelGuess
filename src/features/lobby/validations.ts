import { z } from 'zod'

export const LobbyCodeSchema = z
  .string()
  .length(6)
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format')

export const CreateLobbySchema = z.object({
  playerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(16, 'Name must be at most 16 characters')
    .trim(),
})

export const JoinLobbySchema = z.object({
  code: LobbyCodeSchema,
  playerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(16, 'Name must be at most 16 characters')
    .trim(),
})

export type CreateLobbyInput = z.infer<typeof CreateLobbySchema>
export type JoinLobbyInput = z.infer<typeof JoinLobbySchema>

