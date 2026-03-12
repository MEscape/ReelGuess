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
import { getReelOwnersByLobby, getUnusedReelsByPlayer } from '@/features/reel-import/queries'
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
 * Creates a rematch lobby, or joins an existing one if another player already
 * triggered the rematch (idempotent).
 *
 * ## Key design decisions
 *
 * **Players join themselves.**
 * Only the first caller (typically the host) creates the new lobby — and only
 * for themselves. Every subsequent player calls this function too, which adds
 * them as a regular player to the *existing* rematch lobby. This means the
 * lobby waiting-room is used as intended: players arrive, the host sees them
 * join, and then starts the game.
 *
 * **Reel seeding.**
 * Each caller's *unused* reels from the finished lobby are copied into the new
 * lobby as a server-side fallback. The client (`RematchButton`) also fires
 * `submitReelsOnJoinAction` with the player's fresh local reel pool, so in
 * practice the new lobby gets a mix of fresh + old-unused reels with no
 * duplicates within the session (the game picks by the `used` flag).
 *
 * @param oldLobbyId          - Code of the finished lobby.
 * @param requestingPlayerId  - The player who pressed "Rematch" / "Join Rematch".
 * @returns `{ newLobbyCode, newPlayerId }` — the client stores the ID and
 *          navigates to `/lobby/{newLobbyCode}`.
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

    // ── 2. Idempotency — rematch lobby already exists ─────────────────────────
    if (oldLobby.settings.rematchId) {
        return joinExistingRematch(
            oldLobby.settings.rematchId,
            requestingPlayer,
            oldLobbyId,
        )
    }

    // ── 3. Create new rematch lobby with ONLY the requesting player ───────────
    //
    // Other players call createRematch themselves (Bug 1 fix): they are added
    // to the lobby via the `joinExistingRematch` path below once `rematch_id`
    // is set on the old lobby.
    const rematchResult = await createRematchLobby(
        [requestingPlayer],   // only this player — others join themselves
        requestingPlayerId,
        {
            roundsCount:  oldLobby.settings.roundsCount,
            timerSeconds: oldLobby.settings.timerSeconds,
        },
    )
    if (rematchResult.isErr()) return err(rematchResult.error)

    const { lobby: newLobby, playerIdMap, newPlayerId } = rematchResult.value

    // ── 4. Seed unused reels from old game as a fallback ──────────────────────
    //
    // The client will also submit fresh local reels via submitReelsOnJoinAction.
    // Having both sources is fine — the game just picks from all unused rows.
    const unusedReelsResult = await getUnusedReelsByPlayer(oldLobbyId, requestingPlayerId)
    if (unusedReelsResult.isOk() && unusedReelsResult.value.length > 0) {
        await copyReelsToNewLobby(unusedReelsResult.value, newLobby.id, playerIdMap)
    }

    // ── 5. Atomically mark old lobby with new lobby code ──────────────────────
    const setResult = await setRematchId(oldLobbyId, newLobby.id)
    if (setResult.isOk() && !setResult.value) {
        // Lost the race — another caller already created the rematch lobby.
        // Re-fetch old lobby to get the winner's new lobby code, then join it.
        const latestOldLobby = await getLobbyByCode(oldLobbyId)
        if (latestOldLobby.isOk() && latestOldLobby.value.settings.rematchId) {
            return joinExistingRematch(
                latestOldLobby.value.settings.rematchId,
                requestingPlayer,
                oldLobbyId,
            )
        }
    }

    return ok({ newLobbyCode: newLobby.id, newPlayerId })
}

// ─────────────────────────────────────────────────────────────────────────────
// joinExistingRematch (private helper)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a player to an already-created rematch lobby, or returns their existing
 * entry if they already joined (idempotent).
 *
 * Also seeds the player's unused reels from the old lobby so they have
 * something to play with even if their local reel pool is empty.
 */
async function joinExistingRematch(
    newLobbyId:    string,
    oldPlayer:     Player,
    oldLobbyId:    string,
): Promise<Result<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> {
    const newLobbyResult = await getLobbyByCode(newLobbyId)
    if (newLobbyResult.isErr()) return err(newLobbyResult.error)

    const newLobby = newLobbyResult.value

    // Already in the rematch lobby — return existing player ID (idempotent).
    const existingPlayer = newLobby.players.find(
        (p) => p.displayName === oldPlayer.displayName,
    )
    if (existingPlayer) {
        return ok({ newLobbyCode: newLobbyId, newPlayerId: existingPlayer.id })
    }

    // Join the lobby, preserving the player's avatar seed from the old lobby.
    const addResult = await addPlayerToLobby(newLobbyId, oldPlayer.displayName, oldPlayer.avatarSeed)
    if (addResult.isErr()) return err(addResult.error)

    const newPlayerId = addResult.value.id

    // Seed the player's unused reels as fallback (non-fatal).
    const unusedReels = await getUnusedReelsByPlayer(oldLobbyId, oldPlayer.id)
    if (unusedReels.isOk() && unusedReels.value.length > 0) {
        const idMap = new Map([[oldPlayer.id, newPlayerId]])
        await copyReelsToNewLobby(unusedReels.value, newLobbyId, idMap)
    }

    return ok({ newLobbyCode: newLobbyId, newPlayerId })
}
