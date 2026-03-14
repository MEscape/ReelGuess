// ─────────────────────────────────────────────────────────────────────────────
// Reel Player — constants
// ─────────────────────────────────────────────────────────────────────────────

/** How long we wait before treating a load as failed. Starts fresh per attempt. */
export const LOAD_TIMEOUT_MS = 12_000

/**
 * How many consecutive failures before showing the permanent error UI.
 * After this many failures the user is directed to open Instagram directly.
 */
export const MAX_CONSECUTIVE_FAILS = 3

/**
 * Fixed height of the iframe container.
 * Cannot grow — the embed player has a fixed aspect ratio.
 */
export const EMBED_FRAME_HEIGHT = 560

/**
 * Minimum height of the "unavailable" card.
 * Uses min-height (not height) so the card can grow if its content overflows
 * on small viewports without being clipped.
 */
export const UNAVAILABLE_MIN_HEIGHT = 560