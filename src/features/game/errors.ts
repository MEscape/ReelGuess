import type { Result } from 'neverthrow'

/**
 * Discriminated error union for all game service and DAL operations.
 *
 * Use exhaustive `switch (error.type)` at the action boundary to convert
 * these into user-facing messages. Never expose raw error shapes to components.
 */
export type GameError =
    | { type: 'GAME_NOT_STARTED';      lobbyId: string }
    | { type: 'ROUND_NOT_FOUND';       roundId: string }
    | { type: 'NOT_VOTING_PHASE';      roundId: string; currentStatus: string }
    | { type: 'ALREADY_VOTED';         roundId: string; voterId: string }
    | { type: 'NO_REELS_AVAILABLE';    lobbyId: string }
    | { type: 'GAME_DATABASE_ERROR';   message: string; cause?: unknown }
    | { type: 'GAME_NOT_HOST';         playerId: string }
    | { type: 'GAME_ALREADY_FINISHED'; lobbyId: string }
    | { type: 'HAS_NOT_VOTED';         roundId: string; voterId: string }
    | { type: 'GAME_VALIDATION_ERROR'; message: string }
    | { type: 'INSUFFICIENT_POINTS';   required: number; actual: number }

/** Convenience alias — `Result<T>` with {@link GameError} in the Err channel. */
export type GameResult<T> = Result<T, GameError>