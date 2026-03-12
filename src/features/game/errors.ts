import type { Result } from 'neverthrow'

// ─────────────────────────────────────────────────────────────────────────────
// Error union
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All errors that can be returned by game service / DAL operations.
 * Use discriminated union `type` for exhaustive switch handling.
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

/** Convenience alias — Result with {@link GameError} in the Err channel. */
export type GameResult<T> = Result<T, GameError>