'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/features/player/types'
import { mapPlayerRow, type PlayerRow } from '@/features/player/types'

export function usePlayers(lobbyId: string, initialPlayers: Player[]) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`lobby-players:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          const newPlayer = mapPlayerRow(payload.new as unknown as PlayerRow)
          setPlayers((prev) => {
            if (prev.find((p) => p.id === newPlayer.id)) return prev
            return [...prev, newPlayer]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          setPlayers((prev) =>
            prev.filter((p) => p.id !== (payload.old as { id: string }).id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobbyId])

  return players
}

