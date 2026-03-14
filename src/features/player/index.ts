/**
 * Player feature — public API.
 *
 * Import from `@/features/player` instead of reaching into internal files.
 */

export { PlayerAvatar } from './components/player-avatar'
export type { Player }       from './types'
export { usePlayers }       from './hooks/use-players'
export { usePlayerStore }     from './stores/player-store'
export { mapPlayerRow }       from './mappers'
export { NAME_MIN_LENGTH, NAME_MAX_LENGTH } from './constants'