/**
 * Reel Player feature — public API.
 *
 * Handles Instagram Reel display and data fetching.
 * Import from `@/features/reel-player` instead of reaching into internal files.
 */

export type { ReelData } from './types'
export { ReelDisplay } from './components/reel-display'
export { useReelData } from './hooks/use-reel-data'