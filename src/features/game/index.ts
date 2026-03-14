/**
 * Game feature — public API.
 *
 * Import from `@/features/game-board` instead of reaching into internal files.
 */

export { useGameSession, useGameRound } from './game-context'
export type { GameError, GameResult } from './errors'
export type { GamePhase } from './types'

export { GameBoard } from './components/game-board'