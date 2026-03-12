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
                    host_id:  '00000000-0000-0000-0000-000000000000',
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