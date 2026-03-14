/**
 * Scoring feature — public API.
 *
 * Pure scoring calculation and achievement detection.
 * Import from `@/features/scoring` instead of reaching into internal files.
 */

export { StreakIndicator } from './components/streak-indicator'
export type { ScoreEntry, Achievement } from './types'
export { HeroOverlay } from './components/hero-overlay'
export { detectAchievements } from './achievements'
export { calculateRoundScores } from './service'
export { batchUpsertScores } from './mutations'
export { getScoresForLobby } from './queries'
export { useScores } from './hooks/use-scores'