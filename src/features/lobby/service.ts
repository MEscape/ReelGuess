
/**
 * Lobby Service Layer — all lobby business logic.
 *
 * Dependency direction: actions.ts → service.ts → DAL
 */

import { ok, err, type Result }  from 'neverthrow'
import { getLobbyByCode }        from './queries'
import {
    createLobby as createLobbyMutation,
    addPlayerToLobby,
    updateLobbyStatus,
    createRematchLobby,
    setRematchId,
} from './mutations'
import { getReelOwnersByLobby } from '@/features/reel-import'
import type { LobbyError }       from './errors'
import type { Lobby }            from './types'
import type { Player }           from '@/features/player'

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

// ─────────────────────────────────────────────────────────────────────────────
// createRematch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a rematch lobby, or joins an existing one if another player already
 * triggered the rematch (idempotent).
 *
 * ## Flow
 *
 * - **First caller** creates a new lobby for themselves as host, then atomically
 *   stamps the old lobby with the new lobby code via `setRematchId`.
 * - **Subsequent callers** (or a first caller who lost the creation race) find
 *   `rematch_id` already set and join the existing lobby instead.
 *
 * Players join themselves — the lobby waiting-room fills naturally as each
 * player presses "Rematch", and the host starts the game once everyone is in.
 *
 * @param oldLobbyId         - Code of the finished lobby.
 * @param requestingPlayerId - The player who pressed "Rematch" / "Join Rematch".
 * @returns `{ newLobbyCode, newPlayerId }` — the client stores the new player ID
 *          and navigates to `/lobby/{newLobbyCode}`.
 */
export async function createRematch(
    oldLobbyId:          string,
    requestingPlayerId:  string,
): Promise<Result<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> {
    // 1. Fetch old lobby
    const oldLobbyResult = await getLobbyByCode(oldLobbyId)
    if (oldLobbyResult.isErr()) return err(oldLobbyResult.error)

    const oldLobby = oldLobbyResult.value

    const requestingPlayer = oldLobby.players.find((p) => p.id === requestingPlayerId)
    if (!requestingPlayer) {
        return err({
            type:    'LOBBY_VALIDATION_ERROR',
            message: 'Player is not a member of this lobby.',
            issues:  [],
        })
    }

    // 2. Rematch lobby already exists — join it
    if (oldLobby.settings.rematchId) {
        return joinExistingRematch(oldLobby.settings.rematchId, requestingPlayer)
    }

    // 3. Create new rematch lobby with only the requesting player as host
    const rematchResult = await createRematchLobby(
        requestingPlayer,
        {
            roundsCount:  oldLobby.settings.roundsCount,
            timerSeconds: oldLobby.settings.timerSeconds,
        },
    )
    if (rematchResult.isErr()) return err(rematchResult.error)

    const { lobby: newLobby, newPlayerId } = rematchResult.value

    // 4. Atomically stamp the old lobby with the new lobby code.
    //    If we lose the race, another caller already created the rematch lobby —
    //    re-fetch to get their code and join it instead.
    const setResult = await setRematchId(oldLobbyId, newLobby.id)
    if (setResult.isOk() && !setResult.value) {
        const latestOldLobby = await getLobbyByCode(oldLobbyId)
        if (latestOldLobby.isOk() && latestOldLobby.value.settings.rematchId) {
            return joinExistingRematch(latestOldLobby.value.settings.rematchId, requestingPlayer)
        }
    }

    return ok({ newLobbyCode: newLobby.id, newPlayerId })
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a player to an already-created rematch lobby, or returns their existing
 * entry if they already joined (idempotent).
 *
 * Idempotency is checked by display name — if a player with the same name is
 * already in the new lobby, their existing ID is returned without a second insert.
 *
 * @param newLobbyId - Code of the rematch lobby to join.
 * @param oldPlayer  - The player from the finished lobby (preserves display_name + avatar_seed).
 * @returns `{ newLobbyCode, newPlayerId }`.
 */
async function joinExistingRematch(
    newLobbyId: string,
    oldPlayer:  Player,
): Promise<Result<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> {
    const newLobbyResult = await getLobbyByCode(newLobbyId)
    if (newLobbyResult.isErr()) return err(newLobbyResult.error)

    const newLobby = newLobbyResult.value

    // Already joined — return existing ID without re-inserting
    const existingPlayer = newLobby.players.find((p) => p.displayName === oldPlayer.displayName)
    if (existingPlayer) {
        return ok({ newLobbyCode: newLobbyId, newPlayerId: existingPlayer.id })
    }

    const addResult = await addPlayerToLobby(newLobbyId, oldPlayer.displayName, oldPlayer.avatarSeed)
    if (addResult.isErr()) return err(addResult.error)

    return ok({ newLobbyCode: newLobbyId, newPlayerId: addResult.value.id })
}
