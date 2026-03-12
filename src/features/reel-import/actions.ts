'use server'

/**
 * Reel Import — Server Actions.
 *
 * The client-side import action (`importReelsAction`) has been removed.
 * Reel import is now fully local (localStorage). The only server action
 * remaining is called by the lobby-join flow to persist the player's
 * selected reels for a game session.
 *
 * Dependency direction: lobby-join action → importReelsForPlayer (service) → DAL
 */

import { importReelsForPlayer }  from './service'
import { selectGameReels }       from './utils/parse-export'
import {MAX_REELS, SubmitReelsSchema} from './validations'
import { rateLimitFromIP }       from '@/lib/rate-limit'
import { serializeResult }       from '@/lib/errors/error-handler'
import type { SerializedResult } from '@/lib/errors/error-handler'
import type { ReelImportError }  from './errors'
import type { Reel, LocalReel }  from './types'

/**
 * Called when a player joins a lobby — persists their randomly selected reels
 * for the game session.
 *
 * Flow:
 * 1. Rate-limit by IP (with playerId as tiebreaker).
 * 2. Validate payload.
 * 3. Randomly select up to MAX_REELS from the submitted pool (server-side shuffle).
 * 4. Persist via service (idempotent — safe to call twice).
 *
 * @param formData - Must contain `lobbyId`, `playerId`, `reelUrls` (JSON array).
 */
export async function submitReelsOnJoinAction(
    formData: FormData,
): Promise<SerializedResult<Reel[], ReelImportError>> {
    const playerId = formData.get('playerId') as string | null

    const rl = await rateLimitFromIP('importReels', playerId ?? undefined)
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'INVALID_PAYLOAD', message: 'Too many attempts. Please wait and try again.' },
        }
    }

    const parsed = SubmitReelsSchema.safeParse({
        lobbyId:  formData.get('lobbyId'),
        playerId: formData.get('playerId'),
        reelUrls: JSON.parse((formData.get('reelUrls') as string) || '[]'),
    })

    if (!parsed.success) {
        return {
            ok:    false,
            error: {
                type:    'INVALID_PAYLOAD',
                message: parsed.error.issues.map((i) => i.message).join(', '),
            },
        }
    }

    // Server-side random selection — client cannot influence which reels enter
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
}