/**
 * Data Access Layer — single import point for all database operations.
 *
 * Consumers import from `@/lib/dal` rather than reaching into feature modules.
 * All functions return NeverThrow `Result` types for type-safe error handling.
 *
 * @example
 * ```ts
 * import { getLobbyByCode, getScores } from '@/lib/dal'
 * ```
 */

// ── Lobby ──────────────────────────────────────────────────────────────────
export { getLobbyByCode }                                          from '@/features/lobby/queries'
export { createLobby, addPlayerToLobby, updateLobbyStatus }       from '@/features/lobby/mutations'

// ── Reels ──────────────────────────────────────────────────────────────────
export { getReelsByPlayer }                          from '@/features/reel-import/queries'
export { insertReels }           from '@/features/reel-import/mutations'

// ── Game ───────────────────────────────────────────────────────────────────
export { getCurrentRound, getRoundById, getVotesForRound, getScores, getReelForRound } from '@/features/game/queries'
export { createRound, updateRoundStatus, insertVote, batchUpsertScores, updateVoteDouble } from '@/features/game/mutations'