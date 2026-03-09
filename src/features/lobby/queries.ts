import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Lobby, LobbyRow } from './types'
import { mapLobbyRow } from './types'
import type { LobbyError } from './errors'

export function getLobbyByCode(code: string): ResultAsync<Lobby, LobbyError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('lobbies')
        .select('*, players!players_lobby_id_fkey(*)')
        .eq('id', code)
        .single()

      if (error || !data) {
        throw { type: 'LOBBY_NOT_FOUND', code } satisfies LobbyError
      }

      return mapLobbyRow(data as unknown as LobbyRow)
    })(),
    (e) => {
      return e as LobbyError
    }
  )
}

export function getLobbyStatus(code: string): ResultAsync<string, LobbyError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('lobbies')
        .select('status')
        .eq('id', code)
        .single()

      if (error || !data) {
        throw { type: 'LOBBY_NOT_FOUND', code } satisfies LobbyError
      }

      return data.status as string
    })(),
    (e) => e as LobbyError
  )
}

