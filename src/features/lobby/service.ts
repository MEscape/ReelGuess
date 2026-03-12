'use server'

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
import { getReelOwnersByLobby, getAllReelsByLobby } from '@/features/reel-import/queries'
import { copyReelsToNewLobby }   from '@/features/reel-import/mutations'
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

// ─────────────────────────────────────────────────────────────────────────────
// createRematch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a rematch lobby from a finished lobby, or returns the existing one
 * if another player already triggered the rematch (idempotent).
 *
 * Business rules:
 * - Requesting player must be a member of the old lobby.
 * - If `settings.rematchId` is already set, look up the player's new ID in
 *   the existing rematch lobby by display name (no second lobby created).
 * - Otherwise: create a new lobby, copy all players + reels, then atomically
 *   set `settings.rematch_id` on the old lobby to prevent duplicate creation.
 *
 * @param oldLobbyId          - Code of the finished lobby.
 * @param requestingPlayerId  - The player who pressed "Rematch".
 * @returns `{ newLobbyCode, newPlayerId }` — the player stores `newPlayerId`
 *          under `newLobbyCode` in their local player store then navigates.
 */
export async function createRematch(
    oldLobbyId:          string,
    requestingPlayerId:  string,
): Promise<Result<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> {
    // ── 1. Fetch old lobby ────────────────────────────────────────────────────
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

    // ── 2. Idempotency — rematch already created ──────────────────────────────
    if (oldLobby.settings.rematchId) {
        const newLobbyResult = await getLobbyByCode(oldLobby.settings.rematchId)
        if (newLobbyResult.isOk()) {
            const newPlayer = newLobbyResult.value.players.find(
                (p) => p.displayName === requestingPlayer.displayName,
            )
            if (newPlayer) {
                return ok({ newLobbyCode: oldLobby.settings.rematchId, newPlayerId: newPlayer.id })
            }
        }
    }

    // ── 3. Create rematch lobby with all players ──────────────────────────────
    const rematchResult = await createRematchLobby(
        oldLobby.players,
        requestingPlayerId,
        {
            roundsCount:  oldLobby.settings.roundsCount,
            timerSeconds: oldLobby.settings.timerSeconds,
        },
    )
    if (rematchResult.isErr()) return err(rematchResult.error)

    const { lobby: newLobby, playerIdMap, newPlayerId } = rematchResult.value

    // ── 4. Copy reels from old lobby → new lobby ──────────────────────────────
    const reelsResult = await getAllReelsByLobby(oldLobbyId)
    if (reelsResult.isOk() && reelsResult.value.length > 0) {
        // Non-fatal — a rematch without reels still works (host can import new ones)
        await copyReelsToNewLobby(reelsResult.value, newLobby.id, playerIdMap)
    }

    // ── 5. Atomically mark old lobby with new lobby code ──────────────────────
    // If two players pressed rematch simultaneously, only one wins the
    // conditional UPDATE (WHERE rematch_id IS NULL). The losing player's
    // newly-created lobby becomes a short-lived orphan.
    const setResult = await setRematchId(oldLobbyId, newLobby.id)
    if (setResult.isErr()) {
        // Non-fatal — the lobby was created; just proceed.
    } else if (!setResult.value) {
        // Another caller won the race — find the existing rematch lobby
        const latestOldLobby = await getLobbyByCode(oldLobbyId)
        if (latestOldLobby.isOk() && latestOldLobby.value.settings.rematchId) {
            const existingNewLobby = await getLobbyByCode(latestOldLobby.value.settings.rematchId)
            if (existingNewLobby.isOk()) {
                const existingPlayer = existingNewLobby.value.players.find(
                    (p) => p.displayName === requestingPlayer.displayName,
                )
                if (existingPlayer) {
                    return ok({
                        newLobbyCode: latestOldLobby.value.settings.rematchId,
                        newPlayerId:  existingPlayer.id,
                    })
                }
            }
        }
    }

    return ok({ newLobbyCode: newLobby.id, newPlayerId })
}
