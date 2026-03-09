import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Reel, ReelRow } from './types'
import { mapReelRow } from './types'
import type { ReelImportError } from './errors'

export function getReelsByLobby(lobbyId: string): ResultAsync<Reel[], ReelImportError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('lobby_id', lobbyId)

      if (error) {
        throw {
          type: 'REEL_DATABASE_ERROR',
          message: error.message,
        } satisfies ReelImportError
      }

      return (data as unknown as ReelRow[]).map(mapReelRow)
    })(),
    (e) => e as ReelImportError
  )
}

export function getReelsByPlayer(
  lobbyId: string,
  playerId: string
): ResultAsync<Reel[], ReelImportError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('lobby_id', lobbyId)
        .eq('owner_id', playerId)

      if (error) {
        throw {
          type: 'REEL_DATABASE_ERROR',
          message: error.message,
        } satisfies ReelImportError
      }

      return (data as unknown as ReelRow[]).map(mapReelRow)
    })(),
    (e) => e as ReelImportError
  )
}

