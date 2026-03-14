'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient }                             from '@/lib/supabase/client'
import { mapRoundRow }                              from '@/features/round'
import type { Round }                               from '@/features/round'

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of the `lobbies` Realtime UPDATE payload fields we care about. */
type LobbyPayload = {
    status?:   string
    settings?: { rematch_id?: string; [key: string]: unknown }
}

function parseLobbyPayload(raw: unknown): LobbyPayload | null {
    if (!raw || typeof raw !== 'object') return null
    return raw as LobbyPayload
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to Supabase Realtime for a lobby session.
 *
 * Maintains a **single channel** for three tables:
 * - `rounds`  → calls `onRoundChange` on every INSERT or UPDATE
 * - `votes`   → increments `voteCount` (client-side filtered to current round)
 * - `lobbies` → exposes `lobbyStatus` (drives the finished-phase transition)
 *
 * ### Why `onRoundChange` is stored in a ref
 * The callback identity changes on every parent render. Storing it in a ref
 * means the channel is set up once for the lifetime of the lobby and never
 * torn down due to a callback identity change.
 *
 * ### Why votes are filtered client-side
 * Supabase Realtime channel filters are static — they cannot change while the
 * channel is subscribed. Filtering on `round_id=eq.<id>` would require
 * unsubscribing and resubscribing every time a new round starts, which is
 * expensive and introduces a window where vote events are missed. Instead, we
 * subscribe to all `votes` INSERTs and filter against `currentRoundIdRef`
 * in the handler — zero reconnects, zero missed events.
 *
 * ### `initialVoteCount` seeding
 * `useState(initialVoteCount ?? 0)` seeds the correct initial state at
 * construction time — no redundant `useEffect` needed.
 *
 * @param lobbyId          - The lobby to subscribe to.
 * @param onRoundChange    - Called on every `rounds` INSERT or UPDATE.
 * @param initialRoundId   - Active round ID at mount (seeds the vote filter).
 * @param initialVoteCount - Vote count at mount (restores state after refresh).
 * @param initialRematchId - Rematch ID at mount (restores state after refresh).
 */
export function useGameRealtime(
    lobbyId:           string,
    onRoundChange?:    (round: Round) => void,
    initialRoundId?:   string | null,
    initialVoteCount?: number,
    initialRematchId?: string | null,
) {
    const [voteCount,   setVoteCount]   = useState(initialVoteCount ?? 0)
    const [lobbyStatus, setLobbyStatus] = useState<string>('playing')
    const [rematchId,   setRematchId]   = useState<string | null>(initialRematchId ?? null)

    const currentRoundIdRef = useRef<string | null>(initialRoundId ?? null)
    const onRoundChangeRef  = useRef(onRoundChange)
    useEffect(() => { onRoundChangeRef.current = onRoundChange }, [onRoundChange])

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`game:${lobbyId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rounds', filter: `lobby_id=eq.${lobbyId}` },
                (payload) => {
                    if (!payload.new || typeof payload.new !== 'object' || !('id' in payload.new)) return
                    let round: Round
                    try {
                        // mapRoundRow validates via RoundRowSchema — ZodError means
                        // a malformed Realtime payload; log and discard.
                        round = mapRoundRow(payload.new)
                    } catch (e) {
                        console.error('[useGameRealtime] malformed rounds payload', e)
                        return
                    }
                    if (round.status === 'voting') {
                        currentRoundIdRef.current = round.id
                    }
                    onRoundChangeRef.current?.(round)
                },
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'votes' },
                (payload) => {
                    const roundId = (payload.new as Record<string, unknown>)?.round_id as string | undefined
                    if (roundId && currentRoundIdRef.current && roundId === currentRoundIdRef.current) {
                        setVoteCount((n) => n + 1)
                    }
                },
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` },
                (payload) => {
                    const data = parseLobbyPayload(payload.new)
                    if (!data) return
                    if (data.status)               setLobbyStatus(data.status)
                    if (data.settings?.rematch_id) setRematchId(data.settings.rematch_id)
                },
            )
            .subscribe()

        return () => { void supabase.removeChannel(channel) }
    }, [lobbyId])

    const resetVoteCount = useCallback(() => setVoteCount(0), [])

    return { voteCount, lobbyStatus, rematchId, resetVoteCount }
}