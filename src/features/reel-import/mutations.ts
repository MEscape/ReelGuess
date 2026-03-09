import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Reel, ReelRow } from './types'
import { mapReelRow } from './types'
import type { ReelImportError } from './errors'

export function insertReels(
  lobbyId: string,
  playerId: string,
  reelUrls: string[]
): ResultAsync<Reel[], ReelImportError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()

      const rows = reelUrls.map((url) => ({
        lobby_id: lobbyId,
        owner_id: playerId,
        instagram_url: url,
        used: false,
      }))

      const { data, error } = await supabase
        .from('reels')
        .insert(rows)
        .select()

      if (error || !data) {
        throw {
          type: 'REEL_DATABASE_ERROR',
          message: error?.message ?? 'Failed to insert reels',
        } satisfies ReelImportError
      }

      return (data as unknown as ReelRow[]).map(mapReelRow)
    })(),
    (e) => e as ReelImportError
  )
}

export function updateReelEmbed(
  reelId: string,
  embedHtml: string,
  thumbnailUrl: string,
  caption: string
): ResultAsync<void, ReelImportError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { error } = await supabase
        .from('reels')
        .update({
          embed_html: embedHtml,
          thumbnail_url: thumbnailUrl,
          caption,
        })
        .eq('id', reelId)

      if (error) {
        throw {
          type: 'REEL_DATABASE_ERROR',
          message: error.message,
        } satisfies ReelImportError
      }
    })(),
    (e) => e as ReelImportError
  )
}

export function markReelUsed(reelId: string): ResultAsync<void, ReelImportError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { error } = await supabase
        .from('reels')
        .update({ used: true })
        .eq('id', reelId)

      if (error) {
        throw {
          type: 'REEL_DATABASE_ERROR',
          message: error.message,
        } satisfies ReelImportError
      }
    })(),
    (e) => e as ReelImportError
  )
}

