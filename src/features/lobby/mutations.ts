import { ResultAsync }          from 'neverthrow'
import { toAppError }          from '@/lib/errors/error-handler'
import { createClient }        from '@/lib/supabase/server'
import { mapLobbyRow }         from './mappers'
import { mapPlayerRow }        from '@/features/player'
import type { Lobby }          from './types'
import type { LobbyError }     from './errors'
import type { Player }         from '@/features/player'
import { generateLobbyCode }   from './utils'
import {DEFAULT_SETTINGS, PLACEHOLDER_HOST_ID} from "./constants";

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
 * Raw Supabase data is passed directly to `mapLobbyRow` / `mapPlayerRow` as
 * `unknown`. Both functions run Zod validation internally — no `as unknown as`
 * casts are used anywhere in this file.
 *
 * @param hostName - Display name for the host player.
 */
export function createLobby(
    hostName: string,
): ResultAsync<{ lobby: Lobby; player: Player }, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase   = createClient()
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

            // Pass raw data as unknown — mapPlayerRow and mapLobbyRow validate via Zod.
            const player = mapPlayerRow(playerData)
            const lobby  = mapLobbyRow({
                ...lobbyData,
                host_id: playerData.id,
                players: [playerData],
            })

            return { lobby, player }
        })(),
        (e) => toAppError<LobbyError>(e, 'LOBBY_DATABASE_ERROR'),
    )
}

/**
 * Inserts a new (non-host) player into an existing lobby.
 *
 * @param lobbyId    - Target lobby code.
 * @param playerName - Display name for the joining player.
 * @param avatarSeed - Optional seed to preserve the player's avatar across rematches.
 *                     Defaults to a freshly generated random seed when omitted.
 */
export function addPlayerToLobby(
    lobbyId:     string,
    playerName:  string,
    avatarSeed?: string,
): ResultAsync<Player, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase           = createClient()
            const resolvedAvatarSeed = avatarSeed ?? Math.random().toString(36).substring(2, 10)

            const { data, error } = await supabase
                .from('players')
                .insert({
                    lobby_id:     lobbyId,
                    display_name: playerName,
                    avatar_seed:  resolvedAvatarSeed,
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

            // Pass raw data as unknown — mapPlayerRow validates via PlayerRowSchema.
            return mapPlayerRow(data)
        })(),
        (e) => toAppError<LobbyError>(e, 'LOBBY_DATABASE_ERROR'),
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
            const supabase = createClient()
            const { error } = await supabase
                .from('lobbies')
                .update({ status })
                .eq('id', lobbyId)

            if (error) throw { type: 'LOBBY_DATABASE_ERROR', message: error.message } satisfies LobbyError
        })(),
        (e) => toAppError<LobbyError>(e, 'LOBBY_DATABASE_ERROR'),
    )
}

/**
 * Updates the host-editable settings on a waiting lobby.
 *
 * Merges `newSettings` into the existing `settings` JSONB column so that
 * fields not covered by `newSettings` (e.g. `rematch_id`) are preserved.
 *
 * @param lobbyId     - Target lobby code.
 * @param newSettings - Partial camelCase settings to apply.
 */
export function updateLobbySettings(
    lobbyId:     string,
    newSettings: { roundsCount: number; timerSeconds: number },
): ResultAsync<void, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()

            // 1. Fetch existing settings so we can do a safe merge.
            const { data: existing, error: fetchErr } = await supabase
                .from('lobbies')
                .select('settings')
                .eq('id', lobbyId)
                .single()

            if (fetchErr || !existing) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: fetchErr?.message ?? 'Lobby not found',
                } satisfies LobbyError
            }

            const merged = {
                ...(existing.settings as Record<string, unknown>),
                rounds_count:  newSettings.roundsCount,
                timer_seconds: newSettings.timerSeconds,
            }

            const { error } = await supabase
                .from('lobbies')
                .update({ settings: merged })
                .eq('id', lobbyId)

            if (error) throw { type: 'LOBBY_DATABASE_ERROR', message: error.message } satisfies LobbyError
        })(),
        (e) => toAppError<LobbyError>(e, 'LOBBY_DATABASE_ERROR'),
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
            const supabase = createClient()

            const { data: existing, error: fetchErr } = await supabase
                .from('lobbies')
                .select('settings')
                .eq('id', lobbyId)
                .single()

            if (fetchErr || !existing) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: fetchErr?.message ?? 'Lobby not found',
                } satisfies LobbyError
            }

            const currentSettings = existing.settings as Record<string, unknown>
            if (currentSettings.rematch_id) return false

            const newSettings = { ...currentSettings, rematch_id: rematchId }

            const { data, error } = await supabase
                .from('lobbies')
                .update({ settings: newSettings })
                .eq('id', lobbyId)
                .is('settings->>rematch_id', null)
                .select('id')

            if (error) throw { type: 'LOBBY_DATABASE_ERROR', message: error.message } satisfies LobbyError

            return (data ?? []).length > 0
        })(),
        (e) => toAppError<LobbyError>(e, 'LOBBY_DATABASE_ERROR'),
    )
}

/**
 * Creates a rematch lobby for the requesting player, who becomes the host.
 * Other players join separately via `joinExistingRematch`.
 *
 * Steps:
 * 1. Insert a new lobby with the inherited settings (rounds_count, timer_seconds).
 * 2. Insert the host player, preserving their display_name + avatar_seed.
 * 3. Patch `lobbies.host_id` to the new host player UUID.
 *
 * @param requestingPlayer - The player who initiated the rematch (becomes host).
 * @param settingsOverride - Game settings inherited from the old lobby.
 * @returns The new lobby and the host's new player ID.
 */
export function createRematchLobby(
    requestingPlayer: Player,
    settingsOverride: { roundsCount: number; timerSeconds: number },
): ResultAsync<{ lobby: Lobby; newPlayerId: string }, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
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

            // 2. Insert the host player
            const { data: newPlayers, error: playersError } = await supabase
                .from('players')
                .insert({
                    lobby_id:     code,
                    display_name: requestingPlayer.displayName,
                    avatar_seed:  requestingPlayer.avatarSeed,
                    is_host:      true,
                })
                .select()

            if (playersError || !newPlayers || newPlayers.length === 0) {
                throw {
                    type:    'LOBBY_DATABASE_ERROR',
                    message: playersError?.message ?? 'Failed to insert host player',
                } satisfies LobbyError
            }

            const newHostPlayer = newPlayers[0] as { id: string }

            // 3. Patch lobby.host_id to real player UUID
            const { error: patchError } = await supabase
                .from('lobbies')
                .update({ host_id: newHostPlayer.id })
                .eq('id', code)

            if (patchError) {
                throw { type: 'LOBBY_DATABASE_ERROR', message: patchError.message } satisfies LobbyError
            }

            const lobby = mapLobbyRow({
                ...lobbyData,
                host_id: newHostPlayer.id,
                players: newPlayers,
            })

            return { lobby, newPlayerId: newHostPlayer.id }
        })(),
        (e) => toAppError<LobbyError>(e, 'LOBBY_DATABASE_ERROR'),
    )
}

