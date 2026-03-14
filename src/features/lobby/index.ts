/**
 * Lobby feature — public API.
 *
 * Import from `@/features/lobby` instead of reaching into internal files.
 */

export { getPlayerCount } from './queries'
export { updateLobbyStatus } from './mutations'
export { getLobbyByCode } from './queries'
export type { Lobby, GameSettings } from './types'
export { submitLocalReelsToDB } from './utils'
export { createRematchAction } from './actions'
export { LobbyRoom } from './components/lobby-room'