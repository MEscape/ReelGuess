/**
 * Game Round feature — public API.
 *
 * Manages the round lifecycle: start, complete, and round-level DB reads.
 * Import from `@/features/game-round` instead of reaching into internal files.
 */

export { getRoundById, getReelForRound, getCurrentRound, getVoteCountForRound } from './queries'
export { getCurrentRoundAction } from './actions'
export { updateRoundStatus } from './mutations'
export type { Round } from './types'
export { RoundCompleteScreen } from './components/round-complete-screen'
export { useStartRound } from './hooks/use-start-round'
export { completeRoundAction } from './actions'
export { mapRoundRow } from './mappers'