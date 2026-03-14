'use client'

import { useEffect, useState } from 'react'
import { createClient }        from '@/lib/supabase/client'
import { mapPlayerRow }        from '../mappers'
import type { Player }         from '../types'

/**
 * Subscribes to real-time inserts and deletes on the `players` table for a
 * given lobby, keeping the local player list in sync without polling.
 *
 * The initial list is provided from SSR — Realtime only handles deltas,
 * so there is no redundant initial fetch.
 *
 * ### Payload validation
 * `payload.new` is passed directly to `mapPlayerRow` as `unknown` — no
 * `as unknown as PlayerRow` cast. `mapPlayerRow` runs `PlayerRowSchema.parse`
 * internally, so a malformed Realtime payload surfaces as a ZodError logged
 * to the console rather than silently corrupting the player list.
 *
 * @param lobbyId        - Lobby to subscribe to.
 * @param initialPlayers - Server-rendered initial player list.
 */
export function usePlayers(lobbyId: string, initialPlayers: Player[]): Player[] {
    const [players, setPlayers] = useState<Player[]>(initialPlayers)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`lobby-players:${lobbyId}`)
            .on(
                'postgres_changes',
                {
                    event:  'INSERT',
                    schema: 'public',
                    table:  'players',
                    filter: `lobby_id=eq.${lobbyId}`,
                },
                (payload) => {
                    try {
                        // Pass raw payload as unknown — mapPlayerRow validates via Zod.
                        // No cast needed or safe here.
                        const newPlayer = mapPlayerRow(payload.new)
                        setPlayers((prev) =>
                            prev.some((p) => p.id === newPlayer.id)
                                ? prev
                                : [...prev, newPlayer],
                        )
                    } catch (err) {
                        // Malformed Realtime payload — log and skip rather than crash.
                        console.error('[usePlayers] invalid INSERT payload:', err)
                    }
                },
            )
            .on(
                'postgres_changes',
                {
                    event:  'DELETE',
                    schema: 'public',
                    table:  'players',
                    filter: `lobby_id=eq.${lobbyId}`,
                },
                (payload) => {
                    setPlayers((prev) =>
                        prev.filter((p) => p.id !== (payload.old as { id: string }).id),
                    )
                },
            )
            .subscribe()

        return () => { void supabase.removeChannel(channel) }
    }, [lobbyId])

    return players
}