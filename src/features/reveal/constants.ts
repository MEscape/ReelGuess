// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Duration of the post-reveal countdown in seconds.
 *
 * Not currently threaded through `LobbySettings` — if the reveal timer is made
 * configurable, read it from `useGameSession().settings` instead.
 */
export const REVEAL_SECONDS = 6