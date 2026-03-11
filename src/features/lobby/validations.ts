import { z } from 'zod'

/** Validates a 6-character alphanumeric lobby code. */
export const LobbyCodeSchema = z
    .string()
    .length(6)
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format')

/** Validates the player name field used in both create and join flows. */
const PlayerNameSchema = z
    .string()
    .min(2,  'Name must be at least 2 characters')
    .max(16, 'Name must be at most 16 characters')
    .trim()

/** Input for {@link createLobbyAction}. */
export const CreateLobbySchema = z.object({ playerName: PlayerNameSchema })

/** Input for {@link joinLobbyAction}. */
export const JoinLobbySchema = z.object({
    code:       LobbyCodeSchema,
    playerName: PlayerNameSchema,
})

export type CreateLobbyInput = z.infer<typeof CreateLobbySchema>
export type JoinLobbyInput   = z.infer<typeof JoinLobbySchema>
