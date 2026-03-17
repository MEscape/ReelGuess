import type { Result } from 'neverthrow'

/** All errors that can be returned by lobby service / DAL operations. */
export type LobbyError =
    | { type: 'LOBBY_NOT_FOUND';        code: string }
    | { type: 'LOBBY_FULL';             maxPlayers: number }
    | { type: 'LOBBY_ALREADY_STARTED' }
    | { type: 'INVALID_LOBBY_CODE';     code: string }
    | { type: 'LOBBY_DATABASE_ERROR';   message: string; cause?: unknown }
    | { type: 'LOBBY_VALIDATION_ERROR'; message: string; issues: Array<{ path: string; message: string }>; nameTaken?: string }
    | { type: 'NOT_HOST';               playerId: string }
    | { type: 'RATE_LIMITED' }

export type LobbyResult<T> = Result<T, LobbyError>