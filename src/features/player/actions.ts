'use server'

import { createClient } from '@/lib/supabase/server'
import type { Player, PlayerRow } from './types'
import { mapPlayerRow } from './types'
import type { PlayerError } from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import { serializeResult } from '@/lib/errors/error-handler'
import { ResultAsync } from 'neverthrow'

export async function getPlayersByLobby(
    lobbyId: string
): Promise<SerializedResult<Player[], PlayerError>> {
    const result = await ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('lobby_id', lobbyId)
                .order('joined_at', { ascending: true })

            if (error) {
                throw {
                    type: 'PLAYER_DATABASE_ERROR',
                    message: error.message,
                } satisfies PlayerError
            }

            return (data as unknown as PlayerRow[]).map(mapPlayerRow)
        })(),
        (e) => e as PlayerError
    )

    return serializeResult(result)
}

export async function getPlayerById(
    playerId: string
): Promise<SerializedResult<Player, PlayerError>> {
    const result = await ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', playerId)
                .single()

            if (error || !data) {
                throw {
                    type: 'PLAYER_NOT_FOUND',
                    playerId,
                } satisfies PlayerError
            }

            return mapPlayerRow(data as unknown as PlayerRow)
        })(),
        (e) => e as PlayerError
    )

    return serializeResult(result)
}