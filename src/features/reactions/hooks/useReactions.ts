'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient }     from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Reaction, ReactionEmoji } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to emoji reaction broadcasts for a lobby.
 *
 * Uses Supabase Realtime **broadcast** (not postgres_changes) so reactions
 * propagate to every connected client the moment a player sends one — no
 * database round-trip required.
 *
 * `{ broadcast: { self: true } }` ensures the sender also receives their own
 * reaction via the same code path as every other client.
 *
 * The `onReaction` callback is stored in a ref (same pattern as
 * `useGameRealtime`) so the subscription is never re-created when the
 * callback identity changes.
 *
 * @param lobbyId    - Lobby to subscribe to.
 * @param enabled    - Pass `false` to skip the subscription (e.g. outside reveal).
 * @param onReaction - Called for every incoming reaction (including self).
 */
export function useReactions(
    lobbyId:    string,
    enabled:    boolean,
    onReaction: (reaction: Reaction) => void,
) {
    // Stable ref — callback changes never force a re-subscribe
    const onReactionRef = useRef(onReaction)
    useEffect(() => { onReactionRef.current = onReaction }, [onReaction])

    const channelRef = useRef<RealtimeChannel | null>(null)

    /**
     * Broadcasts a reaction to every client in the lobby (including the sender).
     * Fire-and-forget — the promise is intentionally not awaited.
     */
    const sendReaction = useCallback((emoji: ReactionEmoji, reactingPlayerId: string) => {
        void channelRef.current?.send({
            type:    'broadcast',
            event:   'reaction',
            payload: {
                id:        crypto.randomUUID(),
                lobbyId,
                playerId:  reactingPlayerId,
                emoji,
                createdAt: new Date().toISOString(),
            },
        })
    }, [lobbyId])

    useEffect(() => {
        if (!enabled) return

        const supabase = createClient()
        const channel  = supabase
            .channel(`reactions:${lobbyId}`, {
                config: { broadcast: { self: true } },
            })
            .on('broadcast', { event: 'reaction' }, ({ payload }) => {
                if (!payload) return
                const reaction: Reaction = {
                    id:        payload.id        as string,
                    lobbyId:   payload.lobbyId   as string,
                    playerId:  payload.playerId  as string,
                    emoji:     payload.emoji     as ReactionEmoji,
                    createdAt: new Date(payload.createdAt as string),
                }
                onReactionRef.current(reaction)
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            channelRef.current = null
            void supabase.removeChannel(channel)
        }
    }, [lobbyId, enabled])

    return { sendReaction }
}
