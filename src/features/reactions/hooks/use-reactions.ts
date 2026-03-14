'use client'

import { useEffect, useCallback, useRef } from 'react'
import { z }                              from 'zod'
import { createClient }                   from '@/lib/supabase/client'
import type { RealtimeChannel }           from '@supabase/supabase-js'
import type { Reaction, ReactionEmoji }  from '../types'
import {ReactionPayloadSchema} from "../validations";

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
 * The `onReaction` callback is stored in a ref so the subscription is never
 * re-created when the callback identity changes.
 *
 * ### Payload validation
 * All incoming payloads are validated against `ReactionPayloadSchema` before
 * being converted to the domain `Reaction` type. Invalid payloads are dropped
 * with a `console.warn` — they never reach React state.
 *
 * ### Wire → domain conversion
 * `ReactionPayload` (wire) → `Reaction` (domain) conversion happens in exactly
 * one place: the broadcast handler below. `createdAt` is parsed from ISO 8601
 * string to `Date` here and nowhere else.
 *
 * @param lobbyId    - Lobby to subscribe to.
 * @param enabled    - Pass `false` to skip the subscription (e.g. outside reveal).
 * @param onReaction - Called for every valid incoming reaction (including self).
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
     *
     * Returns a Promise so callers that care about failure can await it.
     * Callers that prefer fire-and-forget can `void sendReaction(...)`.
     * A failed broadcast is logged but not thrown — the floating emoji already
     * appears for the sender (via self:true), so this is non-fatal.
     */
    const sendReaction = useCallback(async (
        emoji:            ReactionEmoji,
        reactingPlayerId: string,
    ): Promise<void> => {
        if (!channelRef.current) return

        const status = await channelRef.current.send({
            type:    'broadcast',
            event:   'reaction',
            payload: {
                id:        crypto.randomUUID(),
                lobbyId,
                playerId:  reactingPlayerId,
                emoji,
                createdAt: new Date().toISOString(),
            } satisfies z.infer<typeof ReactionPayloadSchema>,
        })

        if (status !== 'ok') {
            console.error('[useReactions] broadcast failed:', status)
        }
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

                // Validate before trusting any field from the network.
                const result = ReactionPayloadSchema.safeParse(payload)
                if (!result.success) {
                    console.warn('[useReactions] invalid payload dropped:', result.error.flatten())
                    return
                }

                // Wire → domain: convert createdAt string to Date in one place.
                const reaction: Reaction = {
                    id:        result.data.id,
                    lobbyId:   result.data.lobbyId,
                    playerId:  result.data.playerId,
                    emoji:     result.data.emoji,
                    createdAt: new Date(result.data.createdAt),
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