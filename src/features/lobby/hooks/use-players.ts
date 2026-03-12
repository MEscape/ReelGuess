'use client'

import { useEffect, useState }          from 'react'
import { createClient }                  from '@/lib/supabase/client'
import type { Player }                   from '@/features/player/types'
import { mapPlayerRow, type PlayerRow }  from '@/features/player/types'

/**
 * Subscribes to real-time inserts and deletes on the `players` table for a
 * given lobby, keeping the local player list in sync without polling.
 *
 * The initial list is provided from SSR — Realtime only handles deltas,
 * so there is no redundant initial fetch.
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
                    const newPlayer = mapPlayerRow(payload.new as unknown as PlayerRow)
                    setPlayers((prev) =>
                        prev.some((p) => p.id === newPlayer.id) ? prev : [...prev, newPlayer],
                    )
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
