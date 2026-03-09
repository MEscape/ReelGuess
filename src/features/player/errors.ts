import type { Result } from 'neverthrow'

export type PlayerError =
    | { type: 'PLAYER_DATABASE_ERROR'; message: string; cause?: unknown }
    | { type: 'PLAYER_NAME_TAKEN'; name: string }
    | { type: 'PLAYER_NOT_FOUND'; playerId: string }

export type PlayerResult<T> = Result<T, PlayerError>