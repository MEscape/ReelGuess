import type { Result } from 'neverthrow'

// ─────────────────────────────────────────────────────────────────────────────
// Error union
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All errors that can be returned by player-related operations.
 */
export type PlayerError =
    | { type: 'PLAYER_NOT_FOUND';      playerId: string }
    | { type: 'PLAYER_DATABASE_ERROR'; message: string; cause?: unknown }
    | { type: 'PLAYER_NAME_TOO_SHORT'; name: string; minimum: number }
    | { type: 'PLAYER_NAME_TOO_LONG';  name: string; maximum: number }

export type PlayerResult<T> = Result<T, PlayerError>