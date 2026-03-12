'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient }   from '@/lib/supabase/client'
import { mapReactionRow } from '../types'
import type { Reaction, ReactionRow } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to real-time reaction inserts for a given lobby.
 *
 * Returns an ever-growing list of {@link Reaction} objects that arrived during
 * this session. Call `clearReactions()` to wipe the list (e.g. on round change).
 *
 * The channel is created once (on mount / lobbyId change) and torn down on
 * unmount or lobbyId change.
 *
 * @param lobbyId - Lobby to subscribe to.
 * @param enabled - Pass `false` to skip the subscription (e.g. outside reveal).
 */
export function useReactions(lobbyId: string, enabled: boolean) {
    const [reactions, setReactions] = useState<Reaction[]>([])

    const clearReactions = useCallback(() => setReactions([]), [])

    useEffect(() => {
        if (!enabled) {
            // Deferred to avoid setState-in-effect warning from react-hooks/set-state-in-effect
            const t = setTimeout(() => setReactions([]), 0)
            return () => clearTimeout(t)
        }

        const supabase = createClient()

        const channel = supabase
            .channel(`reactions:${lobbyId}`)
            .on(
                'postgres_changes',
                {
                    event:  'INSERT',
                    schema: 'public',
                    table:  'reactions',
                    filter: `lobby_id=eq.${lobbyId}`,
                },
                (payload) => {
                    if (!payload.new || typeof payload.new !== 'object') return
                    const reaction = mapReactionRow(payload.new as unknown as ReactionRow)
                    setReactions((prev) => [...prev, reaction])
                },
            )
            .subscribe()

        return () => { void supabase.removeChannel(channel) }
    }, [lobbyId, enabled])

    return { reactions, clearReactions }
}
