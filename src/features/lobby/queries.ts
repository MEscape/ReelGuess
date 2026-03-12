import { ResultAsync }        from 'neverthrow'
import { createClient }       from '@/lib/supabase/server'
import { mapLobbyRow }        from './types'
import type { Lobby, LobbyRow } from './types'
import type { LobbyError }    from './errors'

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a lobby by its 6-char code, including all joined players.
 *
 * @throws `LOBBY_NOT_FOUND` when the code does not match any lobby.
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
 * Uses a HEAD + COUNT query — no player row data is transferred.
 * Used by the game service for the auto-reveal check.
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