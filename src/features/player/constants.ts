/**
 * Minimum and maximum allowed player display name lengths.
 *
 * Single source of truth — used by:
 * - `PlayerNameForm` for client-side guard and validation message
 * - `PlayerError` variants (`PLAYER_NAME_TOO_SHORT`, `PLAYER_NAME_TOO_LONG`)
 * - Server-side validation in player mutations
 *
 * Changing either constant here automatically tightens both client and server
 * constraints without any other edits.
 */
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 16