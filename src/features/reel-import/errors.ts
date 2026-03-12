/**
 * Reel Import — DB errors.
 *
 * NOTE: `REELS_ALREADY_IMPORTED` has been removed — the "import once" check
 * only applies to the game layer (selecting reels on lobby join), not here.
 */

import type { Result } from 'neverthrow'

export type ReelImportError =
    | { type: 'INVALID_PAYLOAD';     message: string }
    | { type: 'REEL_DATABASE_ERROR'; message: string; cause?: unknown }

export type ReelImportResult<T> = Result<T, ReelImportError>