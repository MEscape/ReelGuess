/**
 * Reel Import — validation constants.
 *
 * Two separate limits exist with different purposes:
 *
 * LOCAL_MAX_REELS — local pool (localStorage only)
 *   How many reels a user can store locally. Set high so a full Instagram
 *   liked_posts.json export can be saved without truncation. The local pool
 *   is never sent to the DB at import time — only at join/create time.
 *
 * MAX_REELS — DB / game session cap
 *   How many reels are submitted to the DB when a player joins or creates a
 *   lobby. Keeps the game balanced and DB costs low regardless of local pool size.
 */

/** Maximum reels stored in the local localStorage pool. No game-balance concern here. */
export const LOCAL_MAX_REELS = 500

/** Minimum reels in the local pool before a player can join / create a lobby. */
export const MIN_REELS = 3

/** Maximum reels submitted per player per game session (DB cap). */
export const MAX_REELS = 50

/**
 * Recommended local pool size. Below this, a warning is shown in the UI
 * because the game always picks up to MAX_REELS for a session — having fewer
 * reduces variety. 50 is the sweet-spot (= MAX_REELS).
 */
export const RECOMMENDED_REELS = 50

/**
 * Soft local storage cap shown in the UI.
 * Once reached, user is prompted to watch a Rewarded Ad to unlock more slots.
 */
export const SOFT_LOCAL_LIMIT = 500

/**
 * How many extra slots are granted per watched Rewarded Ad.
 * Stored in localStorage so it persists across sessions.
 */
export const REWARD_EXTRA_SLOTS = 10

/** localStorage key tracking how many bonus slots were earned via rewarded ads. */
export const REWARD_SLOTS_KEY = 'rg_reward_slots'

/** Versioned localStorage key for storing imported reels. */
export const STORAGE_KEY     = 'rg_reels_v1'
export const CURRENT_STORAGE_VERSION = 1

/** Alias for STORAGE_KEY. Used for events. */
export const STORAGE_EVENT_KEY = 'rg_reels_v1'