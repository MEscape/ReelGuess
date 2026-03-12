import { ResultAsync }            from 'neverthrow'
import { createServiceClient }   from '@/lib/supabase/service'
import { mapLobbyRow }            from './types'
import { mapPlayerRow }           from '@/features/player/types'
import type { Lobby, LobbyRow }   from './types'
import type { LobbyError }        from './errors'
import type { Player }            from '@/features/player/types'
import type { PlayerRow }         from '@/features/player/types'
import { generateLobbyCode }      from './utils/lobby-code'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default game settings applied to every new lobby. */
const DEFAULT_SETTINGS = { rounds_count: 50, timer_seconds: 60 } as const

/**
 * Placeholder UUID written to `lobbies.host_id` on initial insert.
 * Immediately overwritten with the real player UUID in a subsequent PATCH.
 * A nil UUID is used so FK constraints succeed until the real ID is known.
 */
const PLACEHOLDER_HOST_ID = '00000000-0000-0000-0000-000000000000' as const

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new lobby and inserts the host player in two sequential queries.
 *
 * Steps:
 * 1. Insert the lobby with a placeholder `host_id`.
 * 2. Insert the host player.
 * 3. Patch `lobbies.host_id` to the real player UUID.
 *
 * Supabase REST does not support multi-table transactions, so step 3 is a
 * separate UPDATE. A failure there leaves an orphaned player row — acceptable
 * given the low risk and the lobby's short TTL.
 *
 * @param hostName - Display name for the host player.
 */
export function createLobby(
    hostName: string,
): ResultAsync<{ lobby: Lobby; player: Player }, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase   = createServiceClient()
            const code       = generateLobbyCode()
            const avatarSeed = Math.random().toString(36).substring(2, 10)

            // 1. Insert lobby with placeholder host_id
            const { data: lobbyData, error: lobbyError } = await supabase
                .from('lobbies')
                .insert({
                    id:       code,
                    host_id:  PLACEHOLDER_HOST_ID,
                    status:   'waiting',
                    settings: DEFAULT_SETTINGS,
                })
                .select()
                .single()

            if (lobbyError || !lobbyData) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: lobbyError?.message ?? 'Failed to create lobby',
                } satisfies LobbyError
            }

            // 2. Insert host player
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .insert({
                    lobby_id:     code,
                    display_name: hostName,
                    avatar_seed:  avatarSeed,
                    is_host:      true,
                })
                .select()
                .single()

            if (playerError || !playerData) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: playerError?.message ?? 'Failed to create host player',
                } satisfies LobbyError
            }

            // 3. Patch lobby.host_id to real player UUID
            const { error: patchError } = await supabase
                .from('lobbies')
                .update({ host_id: playerData.id })
                .eq('id', code)

            if (patchError) {
                throw { type: 'LOBBY_DATABASE_ERROR', message: patchError.message } satisfies LobbyError
            }

            const player: Player = mapPlayerRow(playerData as unknown as PlayerRow)
            const lobbyRow: LobbyRow = {
                ...(lobbyData as unknown as LobbyRow),
                host_id: playerData.id,
                players: [playerData as unknown as PlayerRow],
            }
            return { lobby: mapLobbyRow(lobbyRow), player }
        })(),
        (e) => e as LobbyError,
    )
}

/**
 * Inserts a new (non-host) player into an existing lobby.
 *
 * @param lobbyId    - Target lobby code.
 * @param playerName - Display name for the joining player.
 */
export function addPlayerToLobby(
    lobbyId:    string,
    playerName: string,
): ResultAsync<Player, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase   = createServiceClient()
            const avatarSeed = Math.random().toString(36).substring(2, 10)

            const { data, error } = await supabase
                .from('players')
                .insert({
                    lobby_id:     lobbyId,
                    display_name: playerName,
                    avatar_seed:  avatarSeed,
                    is_host:      false,
                })
                .select()
                .single()

            if (error || !data) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: error?.message ?? 'Failed to add player',
                } satisfies LobbyError
            }
            return mapPlayerRow(data as unknown as PlayerRow)
        })(),
        (e) => e as LobbyError,
    )
}

/**
 * Updates the status of a lobby.
 *
 * @param lobbyId - Target lobby.
 * @param status  - New status value.
 */
export function updateLobbyStatus(
    lobbyId: string,
    status:  'waiting' | 'playing' | 'finished',
): ResultAsync<void, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()
            const { error } = await supabase
                .from('lobbies')
                .update({ status })
                .eq('id', lobbyId)

            if (error) throw { type: 'LOBBY_DATABASE_ERROR', message: error.message } satisfies LobbyError
        })(),
        (e) => e as LobbyError,
    )
}

/**
 * Atomically sets `settings.rematch_id` on a lobby using a conditional UPDATE.
 *
 * Only writes if `settings->>'rematch_id'` is currently NULL — prevents two
 * concurrent rematch presses from creating two separate lobbies.
 *
 * @param lobbyId   - The finished lobby to annotate.
 * @param rematchId - The new lobby code to store.
 * @returns `true` if the update succeeded (this caller won the race),
 *          `false` if another caller already set a rematch_id.
 */
export function setRematchId(
    lobbyId:   string,
    rematchId: string,
): ResultAsync<boolean, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()

            // Fetch current settings first so we can merge the new field without
            // losing rounds_count / timer_seconds (JSONB || operator not always
            // available via the REST API without RPC).
            const { data: existing, error: fetchErr } = await supabase
                .from('lobbies')
                .select('settings')
                .eq('id', lobbyId)
                .single()

            if (fetchErr || !existing) {
                throw { type: 'LOBBY_DATABASE_ERROR', message: fetchErr?.message ?? 'Lobby not found' } satisfies LobbyError
            }

            const currentSettings = existing.settings as Record<string, unknown>
            // Someone else already won the race
            if (currentSettings.rematch_id) return false

            const newSettings = { ...currentSettings, rematch_id: rematchId }

            const { data, error } = await supabase
                .from('lobbies')
                .update({ settings: newSettings })
                .eq('id', lobbyId)
                // Predicated update — only succeeds if rematch_id is still absent
                .is('settings->>rematch_id', null)
                .select('id')

            if (error) throw { type: 'LOBBY_DATABASE_ERROR', message: error.message } satisfies LobbyError

            // No rows returned means the predicate failed — another concurrent caller
            // already set rematch_id. Return false so createRematch can resolve
            // to the existing rematch lobby instead of the one we just created.
            return (data ?? []).length > 0
        })(),
        (e) => e as LobbyError,
    )
}

/**
 * Creates a rematch lobby that mirrors an existing lobby's players and settings.
 *
 * Steps:
 * 1. Insert a new lobby with the same settings (rounds_count, timer_seconds).
 * 2. Bulk-insert all players from the old lobby, preserving display_name +
 *    avatar_seed. The player whose `oldPlayerId` matches `requestingPlayerId`
 *    is marked `is_host = true`.
 * 3. Patch `lobbies.host_id` to the new host player UUID.
 *
 * @param oldPlayers          - All players from the finished lobby.
 * @param requestingPlayerId  - Old player ID of whoever initiated the rematch
 *                             (becomes host of the new lobby).
 * @param settingsOverride    - Game settings to apply (inherits from old lobby).
 * @returns New lobby + a map of old player UUID → new player UUID.
 */
export function createRematchLobby(
    oldPlayers:          Player[],
    requestingPlayerId:  string,
    settingsOverride:    { roundsCount: number; timerSeconds: number },
): ResultAsync<{ lobby: Lobby; playerIdMap: Map<string, string>; newPlayerId: string }, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()
            const code     = generateLobbyCode()

            // 1. Insert lobby with placeholder host_id
            const { data: lobbyData, error: lobbyError } = await supabase
                .from('lobbies')
                .insert({
                    id:       code,
                    host_id:  PLACEHOLDER_HOST_ID,
                    status:   'waiting',
                    settings: {
                        rounds_count:  settingsOverride.roundsCount,
                        timer_seconds: settingsOverride.timerSeconds,
                    },
                })
                .select()
                .single()

            if (lobbyError || !lobbyData) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: lobbyError?.message ?? 'Failed to create rematch lobby',
                } satisfies LobbyError
            }

            // 2. Bulk-insert all players preserving display_name + avatar_seed
            const requestingOldPlayer = oldPlayers.find((p) => p.id === requestingPlayerId)
            const playerRows = oldPlayers.map((p) => ({
                lobby_id:     code,
                display_name: p.displayName,
                avatar_seed:  p.avatarSeed,
                is_host:      p.id === requestingPlayerId,
            }))

            const { data: newPlayers, error: playersError } = await supabase
                .from('players')
                .insert(playerRows)
                .select()

            if (playersError || !newPlayers || newPlayers.length === 0) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: playersError?.message ?? 'Failed to insert rematch players',
                } satisfies LobbyError
            }

            // Build old → new player ID map by matching display_name
            const playerIdMap = new Map<string, string>()
            for (const oldPlayer of oldPlayers) {
                const newPlayer = (newPlayers as unknown as PlayerRow[]).find(
                    (p) => p.display_name === oldPlayer.displayName,
                )
                if (newPlayer) playerIdMap.set(oldPlayer.id, newPlayer.id)
            }

            const newHostPlayer = (newPlayers as unknown as PlayerRow[]).find(
                (p) => p.display_name === requestingOldPlayer?.displayName && p.is_host,
            )
            if (!newHostPlayer) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: 'Failed to find new host player after insert',
                } satisfies LobbyError
            }

            // 3. Patch lobby.host_id to real player UUID
            const { error: patchError } = await supabase
                .from('lobbies')
                .update({ host_id: newHostPlayer.id })
                .eq('id', code)

            if (patchError) {
                throw { type: 'LOBBY_DATABASE_ERROR', message: patchError.message } satisfies LobbyError
            }

            const lobbyRow: LobbyRow = {
                ...(lobbyData as unknown as LobbyRow),
                host_id: newHostPlayer.id,
                players: newPlayers as unknown as PlayerRow[],
            }
            return {
                lobby:       mapLobbyRow(lobbyRow),
                playerIdMap,
                newPlayerId: newHostPlayer.id,
            }
        })(),
        (e) => e as LobbyError,
    )
}