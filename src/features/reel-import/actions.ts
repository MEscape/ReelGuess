'use server'

/**
 * Reel Import — Server Actions (thin controllers).
 *
 * Dependency direction:  actions.ts → service.ts → DAL
 */

import { ImportReelsSchema }       from './validations'
import type { ReelImportError }    from './errors'
import { importReelsForPlayer }    from './service'
import type { SerializedResult }   from '@/lib/errors/error-handler'
import { serializeResult }         from '@/lib/errors/error-handler'
import type { Reel }               from './types'
import { getReelsByPlayer }        from './queries'
import { rateLimitFromIP }         from '@/lib/rate-limit'

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates and persists a player's reel import.
 *
 * Validates FormData with {@link ImportReelsSchema}:
 * - `lobbyId`  — 6-char lobby code
 * - `playerId` — UUID
 * - `reelUrls` — JSON-encoded string array (min {@link MIN_REELS}, max {@link MAX_REELS})
 *
 * Returns `REELS_ALREADY_IMPORTED` when the player has already imported —
 * the hook treats this as a non-fatal transition to the success state.
 */
export async function importReelsAction(
    formData: FormData,
): Promise<SerializedResult<Reel[], ReelImportError>> {
    const playerId = formData.get('playerId') as string | null
    const rl = await rateLimitFromIP('importReels', playerId ?? undefined)
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'INVALID_PAYLOAD', message: 'Too many import attempts. Please wait an hour.' },
        }
    }

    const parsed = ImportReelsSchema.safeParse({
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

    const result = await importReelsForPlayer(
        parsed.data.lobbyId,
        parsed.data.playerId,
        parsed.data.reelUrls,
    )
    return serializeResult(result)
}

/**
 * Returns how many reels a player has already imported for a lobby.
 * Used by the lobby page to show import status per player.
 *
 * @param lobbyId  - Target lobby.
 * @param playerId - Player to check.
 */
export async function getImportStatusAction(
    lobbyId: string,
    playerId: string,
): Promise<SerializedResult<{ count: number; hasImported: boolean }, ReelImportError>> {
    const result = await getReelsByPlayer(lobbyId, playerId)
    if (result.isErr()) return { ok: false, error: result.error }
    return {
        ok:    true,
        value: { count: result.value.length, hasImported: result.value.length > 0 },
    }
}