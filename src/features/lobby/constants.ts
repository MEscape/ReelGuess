/** Default game settings applied to every new lobby. */
export const DEFAULT_SETTINGS = { rounds_count: 50, timer_seconds: 60 } as const

/**
 * Placeholder UUID written to `lobbies.host_id` on initial insert.
 * Immediately overwritten with the real player UUID in a subsequent PATCH.
 * A nil UUID is used so FK constraints succeed until the real ID is known.
 */
export const PLACEHOLDER_HOST_ID = '00000000-0000-0000-0000-000000000000' as const

/**
 * Lobby code generation and validation utilities.
 *
 * Ambiguous characters (0/O, 1/I, L) are excluded to prevent read errors
 * when codes are shared verbally or written by hand.
 */
export const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'