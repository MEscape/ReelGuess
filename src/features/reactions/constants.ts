/** Total animation duration for floating reaction in seconds. */
export const DURATION = 2.2

/** Extra buffer (ms) to ensure the floating reaction animation fully completes before removal. */
export const CLEANUP_BUFFER_MS = 100

/**
 * Maximum number of reaction IDs retained in the dedup set.
 * When exceeded, the oldest half is pruned to keep memory bounded.
 * 200 entries × ~36 bytes per UUID ≈ 7 KB ceiling.
 */
export const MAX_PROCESSED_IDS = 200

/** Milliseconds a player must wait between reactions. */
export const COOLDOWN_MS = 1500

/**
 * Allowed reaction emojis.
 */
export const REACTION_EMOJIS = ['😂', '🤯', '🔥', '👏', '🧠'] as const