import type { Result } from 'neverthrow'

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

/** All errors that can be returned by reel-import operations. */
export type ReelImportError =
    | { type: 'INVALID_PAYLOAD';       message: string }
    | { type: 'INVALID_REEL_URL';      url: string }
    | { type: 'TOO_FEW_REELS';         count: number; minimum: number }
    | { type: 'OEMBED_FETCH_ERROR';    url: string; message: string }
    | { type: 'REEL_DATABASE_ERROR';   message: string; cause?: unknown }
    | { type: 'REELS_ALREADY_IMPORTED'; playerId: string }

export type ReelImportResult<T> = Result<T, ReelImportError>