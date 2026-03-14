/**
 * Client-side game phase.
 *
 * - `voting`    — active round, accepting votes
 * - `reveal`    — host has triggered reveal, waiting for votes to settle
 * - `complete`  — reveal complete, showing results
 * - `pregame`   — lobby is open, no round has started yet
 * - `finished`  — lobby.status transitioned to `finished`
 */
export type GamePhase = 'voting' | 'reveal' | 'complete' | 'pregame' | 'finished'
