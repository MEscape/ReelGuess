'use server'

/**
 * Lobby Service Layer — all lobby business logic.
 *
 * Dependency direction: actions.ts → service.ts → DAL
 */

import { err, type Result }  from 'neverthrow'
import { getLobbyByCode }        from './queries'
import {
    createLobby as createLobbyMutation,
    addPlayerToLobby,
    updateLobbyStatus,
} from './mutations'
import { getReelOwnersByLobby }  from '@/features/reel-import/queries'
import type { LobbyError }       from './errors'
import type { Lobby }            from './types'
import type { Player }           from '@/features/player/types'

// ─────────────────────────────────────────────────────────────────────────────
// createLobbyWithHost
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new lobby and inserts the host player.
 * Delegates entirely to the mutations layer — no extra business rules needed.
 */
export async function createLobbyWithHost(
    playerName: string,
): Promise<Result<{ lobby: Lobby; player: Player }, LobbyError>> {
    return createLobbyMutation(playerName)
}

// ─────────────────────────────────────────────────────────────────────────────
// joinLobby
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a player to an existing lobby, enforcing all join rules.
 *
 * Business rules:
 * - Lobby must exist and be in `waiting` status.
 * - Max 8 players.
 * - Display name must be unique within the lobby (case-insensitive).
 */
export async function joinLobby(
    code: string,
    playerName: string,
): Promise<Result<Player, LobbyError>> {
    const lobbyResult = await getLobbyByCode(code)
    if (lobbyResult.isErr()) return err(lobbyResult.error)

    const lobby = lobbyResult.value

    if (lobby.status !== 'waiting') return err({ type: 'LOBBY_ALREADY_STARTED' })
    if (lobby.players.length >= 8)  return err({ type: 'LOBBY_FULL', maxPlayers: 8 })

    const trimmedName  = playerName.trim().toLowerCase()
    const nameConflict = lobby.players.some(
        (p) => p.displayName.trim().toLowerCase() === trimmedName,
    )
    if (nameConflict) {
        return err({
            type:    'LOBBY_VALIDATION_ERROR',
            message: `"${playerName.trim()}" is already taken. Choose a different name.`,
            issues:  [],
        })
    }

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
 * - Every player must have submitted their reels (done automatically on join).
 *
 * Uses `getReelOwnersByLobby` — single `.in()` query, O(n) in-memory check.
 * Zero raw Supabase calls in this function.
 *
 * @param lobbyCode    - The 6-char lobby code (also used as the lobby's PK).
 * @param hostPlayerId - Must match lobby.hostId to proceed.
 */
export async function startGame(
    lobbyCode:    string,
    hostPlayerId: string,
): Promise<Result<void, LobbyError>> {
    const lobbyResult = await getLobbyByCode(lobbyCode)
    if (lobbyResult.isErr()) return err(lobbyResult.error)

    const lobby = lobbyResult.value

    if (lobby.hostId !== hostPlayerId) {
        return err({ type: 'NOT_HOST', playerId: hostPlayerId })
    }
    if (lobby.players.length < 2) {
        return err({ type: 'LOBBY_VALIDATION_ERROR', message: 'Need at least 2 players to start', issues: [] })
    }

    // Single DAL call — returns the set of playerIds who have reels in the DB
    const playerIds    = lobby.players.map((p) => p.id)
    const ownersResult = await getReelOwnersByLobby(lobbyCode, playerIds)
    if (ownersResult.isErr()) {
        return err({ type: 'LOBBY_DATABASE_ERROR', message: 'Could not verify reel status' })
    }

    // O(n) in-memory — find players whose reels haven't been submitted yet
    const missingPlayers = lobby.players
        .filter((p) => !ownersResult.value.has(p.id))
        .map((p) => p.displayName)

    if (missingPlayers.length > 0) {
        return err({
            type:    'LOBBY_VALIDATION_ERROR',
            message: `Still waiting for reels from: ${missingPlayers.join(', ')}`,
            issues:  [],
        })
    }

    return updateLobbyStatus(lobby.id, 'playing')
}
