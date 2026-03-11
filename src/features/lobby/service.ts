'use server'

/**
 * Lobby Service Layer — all lobby business logic.
 *
 * Dependency direction:  Actions → Service → DAL
 */

import { err, type Result }  from 'neverthrow'
import { getLobbyByCode }    from './queries'
import { createLobby as createLobbyMutation, addPlayerToLobby, updateLobbyStatus } from './mutations'
import { getReelOwnersByLobby } from '@/features/reel-import/queries'
import type { LobbyError }   from './errors'
import type { Lobby }        from './types'
import type { Player }       from '@/features/player/types'

// ─────────────────────────────────────────────────────────────────────────────
// createLobbyWithHost
// ─────────────────────────────────────────────────────────────────────────────

export async function createLobbyWithHost(
    playerName: string,
): Promise<Result<{ lobby: Lobby; player: Player }, LobbyError>> {
    return createLobbyMutation(playerName)
}

// ─────────────────────────────────────────────────────────────────────────────
// joinLobby
// ─────────────────────────────────────────────────────────────────────────────

export async function joinLobby(
    code: string,
    playerName: string,
): Promise<Result<Player, LobbyError>> {
    const lobbyResult = await getLobbyByCode(code)
    if (lobbyResult.isErr()) return err(lobbyResult.error)

    const lobby = lobbyResult.value
    if (lobby.status !== 'waiting') return err({ type: 'LOBBY_ALREADY_STARTED' })
    if (lobby.players.length >= 8)  return err({ type: 'LOBBY_FULL', maxPlayers: 8 })

    return addPlayerToLobby(lobby.id, playerName)
}

// ─────────────────────────────────────────────────────────────────────────────
// startGame
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transitions a lobby from `waiting` to `playing`.
 *
 * Business rules:
 * - Only the host may start.
 * - At least 2 players must be present.
 * - Every player must have imported at least 1 reel.
 *
 * Uses getReelOwnersByLobby (DAL) — single .in() query, O(n) in-memory check.
 * Zero raw Supabase calls in this service function.
 */
export async function startGame(
    lobbyId: string,
    hostPlayerId: string,
): Promise<Result<void, LobbyError>> {
    const lobbyResult = await getLobbyByCode(lobbyId)
    if (lobbyResult.isErr()) return err(lobbyResult.error)

    const lobby = lobbyResult.value
    if (lobby.hostId !== hostPlayerId) return err({ type: 'NOT_HOST', playerId: hostPlayerId })
    if (lobby.players.length < 2) {
        return err({ type: 'LOBBY_VALIDATION_ERROR', message: 'Need at least 2 players to start', issues: [] })
    }

    // Single DAL call returns the set of player IDs who have imported reels
    const playerIds    = lobby.players.map((p) => p.id)
    const ownersResult = await getReelOwnersByLobby(lobbyId, playerIds)
    if (ownersResult.isErr()) {
        return err({ type: 'LOBBY_DATABASE_ERROR', message: 'Could not check reel import status' })
    }

    // O(n) in memory — find players missing from the owners set
    const missingPlayers = lobby.players
        .filter((p) => !ownersResult.value.has(p.id))
        .map((p) => p.displayName)

    if (missingPlayers.length > 0) {
        return err({
            type:    'LOBBY_VALIDATION_ERROR',
            message: `These players haven't imported their Reels yet: ${missingPlayers.join(', ')}`,
            issues:  [],
        })
    }

    return updateLobbyStatus(lobby.id, 'playing')
}
