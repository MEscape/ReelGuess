'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Round, RoundRow } from '../types'
import { mapRoundRow } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a `lobbies` Realtime UPDATE payload we care about. */
type LobbyPayloadNew = {
    status?:   string
    settings?: { rematch_id?: string; [key: string]: unknown }
}

/** Type guard — narrows an unknown Realtime payload to {@link LobbyPayloadNew}. */
function parseLobbyPayload(raw: unknown): LobbyPayloadNew | null {
    if (!raw || typeof raw !== 'object') return null
    return raw as LobbyPayloadNew
}

/**
 * Subscribes to real-time Supabase changes for a game lobby.
 *
 * Maintains a single channel for three tables:
 * - `rounds`  → fires `onRoundChange` and updates `currentRound` state.
 * - `votes`   → increments `voteCount` (used to show voting progress).
 *              Filter scoped to `currentRoundId` to avoid cross-lobby pollution.
 * - `lobbies` → exposes `lobbyStatus` for the finished-game transition.
 *
 * The `onRoundChange` callback is stored in a ref so the subscription is
 * created once and never re-subscribed when the callback identity changes.
 *
 * @param lobbyId          - The lobby to listen on.
 * @param onRoundChange    - Called whenever a round row is inserted or updated.
 * @param initialRoundId   - The active round ID on mount (for vote filter seeding).
 * @param initialVoteCount - Vote count already present when the component mounts
 *                           (used to restore state after a page refresh mid-round).
 */
export function useGameRealtime(
    lobbyId: string,
    onRoundChange?: (round: Round) => void,
    initialRoundId?: string | null,
    initialVoteCount?: number,
) {
    const [currentRound, setCurrentRound] = useState<Round | null>(null)
    const [voteCount,    setVoteCount]    = useState(initialVoteCount ?? 0)
    const [lobbyStatus,  setLobbyStatus]  = useState<string>('playing')
    const [rematchId,    setRematchId]    = useState<string | null>(null)

    // Tracks the current round ID for the votes filter.
    // Updated whenever a new round starts via onRoundChange.
    const currentRoundIdRef = useRef<string | null>(initialRoundId ?? null)

    // Stable ref — never triggers re-subscribe when callback identity changes
    const onRoundChangeRef = useRef(onRoundChange)
    useEffect(() => { onRoundChangeRef.current = onRoundChange }, [onRoundChange])

    // Sync initialVoteCount on first mount if it changes before subscription
    useEffect(() => {
        if (initialVoteCount !== undefined) {
            setVoteCount(initialVoteCount)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`game:${lobbyId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rounds', filter: `lobby_id=eq.${lobbyId}` },
                (payload) => {
                    if (!payload.new || typeof payload.new !== 'object' || !('id' in payload.new)) return
                    const round = mapRoundRow(payload.new as unknown as RoundRow)
                    // Update the round ID ref for the votes filter on round transitions
                    if (round.status === 'voting') {
                        currentRoundIdRef.current = round.id
                    }
                    setCurrentRound(round)
                    onRoundChangeRef.current?.(round)
                },
            )
            .on(
                'postgres_changes',
                {
                    event:  'INSERT',
                    schema: 'public',
                    table:  'votes',
                    // Filter to current lobby's rounds via round_id is not directly
                    // filterable in Supabase Realtime on a FK column. We filter
                    // client-side using currentRoundIdRef to avoid cross-lobby counts.
                },
                (payload) => {
                    const roundId = (payload.new as Record<string, unknown>)?.round_id as string | undefined
                    // Only count votes for the currently active round
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
                    if (data.status) setLobbyStatus(data.status)
                    if (data.settings?.rematch_id) setRematchId(data.settings.rematch_id)
                },
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [lobbyId]) // lobbyId only — callback changes never force re-subscribe

    const resetVoteCount = useCallback(() => setVoteCount(0), [])

    return { currentRound, voteCount, lobbyStatus, rematchId, resetVoteCount, setCurrentRound }
}
