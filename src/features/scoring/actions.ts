'use server'

import { getScoresForLobby } from './queries'
import { withSentry }        from '@/lib/sentry-action'
import type { GameError }    from '@/features/game'
import type { SerializedResult } from '@/lib/errors/error-handler'
import type { ScoreEntry }   from './types'
import { LobbyCodeSchema }   from './validations'

export const getScoresAction = withSentry(
    'getScoresAction',
    async (lobbyId: string): Promise<SerializedResult<ScoreEntry[], GameError>> => {
        const parsed = LobbyCodeSchema.safeParse(lobbyId)
        if (!parsed.success) {
            return { ok: false, error: { type: 'GAME_VALIDATION_ERROR', message: 'Invalid lobby ID' } }
        }
        const result = await getScoresForLobby(parsed.data)
        if (result.isErr()) {
            return { ok: false, error: result.error }
        }
        return { ok: true, value: result.value }
    },
)
