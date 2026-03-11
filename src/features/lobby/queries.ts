import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Lobby, LobbyRow } from './types'
import { mapLobbyRow } from './types'
import type { LobbyError } from './errors'

/**
 * Fetches a lobby by its 6-char code, including all joined players.
 *
 * @throws `LOBBY_NOT_FOUND` when the code does not exist.
 */
export function getLobbyByCode(code: string): ResultAsync<Lobby, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('lobbies')
                .select('*, players!players_lobby_id_fkey(*)')
                .eq('id', code)
                .single()

            if (error || !data) throw { type: 'LOBBY_NOT_FOUND', code } satisfies LobbyError
            return mapLobbyRow(data as unknown as LobbyRow)
        })(),
        (e) => e as LobbyError,
    )
}

/**
 * Returns the number of players currently in a lobby.
 *
 * Used by the game service for the auto-reveal check (are all players voted?).
 * A cheap HEAD + COUNT — no player rows are transferred.
 *
 * @param lobbyId - Target lobby.
 */
export function getPlayerCount(lobbyId: string): ResultAsync<number, LobbyError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { count, error } = await supabase
                .from('players')
                .select('id', { count: 'exact', head: true })
                .eq('lobby_id', lobbyId)

            if (error) throw { type: 'LOBBY_DATABASE_ERROR', message: error.message } satisfies LobbyError
            return count ?? 0
        })(),
        (e) => e as LobbyError,
    )
}

