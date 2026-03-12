'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient }    from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Achievement } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to achievement broadcast events for a lobby.
 *
 * Uses Supabase Realtime **broadcast** (not postgres_changes) so achievement
 * events propagate to every connected client immediately — no polling needed.
 *
 * The `onAchievement` callback is stored in a ref (same pattern as
 * `useReactions`) so the subscription is never re-created when the
 * callback identity changes.
 *
 * Broadcasts are sent by the host client when `RoundReveal.achievements`
 * is non-empty after a reveal. Non-host clients receive them here.
 *
 * @param lobbyId       - Lobby to subscribe to.
 * @param onAchievement - Called for every incoming achievement broadcast.
 */
export function useScoreEvents(
    lobbyId:        string,
    onAchievement:  (achievement: Achievement) => void,
) {
    // Stable ref — callback changes never force a re-subscribe
    const onAchievementRef = useRef(onAchievement)
    useEffect(() => { onAchievementRef.current = onAchievement }, [onAchievement])

    const channelRef = useRef<RealtimeChannel | null>(null)

    /**
     * Broadcasts a list of achievements to all clients in the lobby.
     * Intended to be called by the host after receiving `RoundReveal`.
     * Fire-and-forget — the promise is intentionally not awaited.
     */
    const broadcastAchievements = useCallback((achievements: Achievement[]) => {
        if (!channelRef.current || achievements.length === 0) return
        for (const achievement of achievements) {
            void channelRef.current.send({
                type:    'broadcast',
                event:   'achievement',
                payload: achievement,
            })
        }
    }, [])

    useEffect(() => {
        const supabase = createClient()
        const channel  = supabase
            .channel(`score-events:${lobbyId}`, {
                config: { broadcast: { self: true } },
            })
            .on('broadcast', { event: 'achievement' }, ({ payload }) => {
                if (!payload || typeof payload !== 'object') return
                onAchievementRef.current(payload as Achievement)
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            channelRef.current = null
            void supabase.removeChannel(channel)
        }
    }, [lobbyId])

    return { broadcastAchievements }
}
