'use server'

import { insertReels } from './mutations'
import { getReelsByPlayer } from './queries'
import { ImportReelsSchema } from './validations'
import type { ReelImportError } from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import { serializeResult } from '@/lib/errors/error-handler'
import type { Reel } from './types'

export async function importReelsAction(
  formData: FormData
): Promise<SerializedResult<Reel[], ReelImportError>> {
  const parsed = ImportReelsSchema.safeParse({
    lobbyId: formData.get('lobbyId'),
    playerId: formData.get('playerId'),
    reelUrls: JSON.parse((formData.get('reelUrls') as string) || '[]'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: 'INVALID_PAYLOAD',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      },
    }
  }

  const existingResult = await getReelsByPlayer(parsed.data.lobbyId, parsed.data.playerId)

  if (existingResult.isErr()) {
    return { ok: false, error: existingResult.error }
  }

  if (existingResult.value.length > 0) {
    return { ok: false, error: { type: 'REELS_ALREADY_IMPORTED', playerId: parsed.data.playerId } }
  }

  const insertResult = await insertReels(
    parsed.data.lobbyId,
    parsed.data.playerId,
    parsed.data.reelUrls
  )
  return serializeResult(insertResult)
}

