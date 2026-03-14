'use server'

/**
 * Reel Import — Server Actions.
 * Reel import is fully local (localStorage). The only server action
 * is called by the lobby-join flow to persist the player's selected reels.
 */

import { importReelsForPlayer }  from './service'
import { selectGameReels }       from './utils'
import { SubmitReelsSchema }     from './validations'
import { rateLimitFromIP }       from '@/lib/rate-limit'
import { serializeResult }       from '@/lib/errors/error-handler'
import { withSentry }            from '@/lib/sentry-action'
import type { SerializedResult } from '@/lib/errors/error-handler'
import type { ReelImportError }  from './errors'
import type { Reel, LocalReel }  from './types'
import { MAX_REELS }             from './constants'

export const submitReelsOnJoinAction = withSentry(
    'submitReelsOnJoinAction',
    async (formData: FormData): Promise<SerializedResult<Reel[], ReelImportError>> => {
        const playerId = formData.get('playerId') as string | null

        const rl = await rateLimitFromIP('importReels', playerId ?? undefined)
        if (!rl.success) {
            return { ok: false, error: { type: 'INVALID_PAYLOAD', message: 'Too many attempts. Please wait and try again.' } }
        }

        const parsed = SubmitReelsSchema.safeParse({
            lobbyId:  formData.get('lobbyId'),
            playerId: formData.get('playerId'),
            reelUrls: JSON.parse((formData.get('reelUrls') as string) || '[]'),
        })

        if (!parsed.success) {
            return { ok: false, error: { type: 'INVALID_PAYLOAD', message: parsed.error.issues.map((i) => i.message).join(', ') } }
        }

        const localReels: LocalReel[] = parsed.data.reelUrls.map((url) => ({
            url,
            importedAt: Date.now(),
        }))
        const selectedUrls = selectGameReels(localReels, MAX_REELS)

        const result = await importReelsForPlayer(
            parsed.data.lobbyId,
            parsed.data.playerId,
            selectedUrls,
        )
        return serializeResult(result)
    },
)
