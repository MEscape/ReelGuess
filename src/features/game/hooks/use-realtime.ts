'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Round, RoundRow } from '../types'
import { mapRoundRow } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to real-time Supabase changes for a game lobby.
 *
 * Maintains a single channel for three tables:
 * - `rounds`  → fires `onRoundChange` and updates `currentRound` state.
 * - `votes`   → increments `voteCount` (used to show voting progress).
 * - `lobbies` → exposes `lobbyStatus` for the finished-game transition.
 *
 * The `onRoundChange` callback is stored in a ref so the subscription is
 * created once and never re-subscribed when the callback identity changes.
 *
 * @param lobbyId        - The lobby to listen on.
 * @param onRoundChange  - Called whenever a round row is inserted or updated.
 */
export function useGameRealtime(
    lobbyId: string,
    onRoundChange?: (round: Round) => void,
) {
    const [currentRound, setCurrentRound] = useState<Round | null>(null)
    const [voteCount,    setVoteCount]    = useState(0)
    const [lobbyStatus,  setLobbyStatus]  = useState<string>('playing')

    // Stable ref — never triggers re-subscribe when callback identity changes
    const onRoundChangeRef = useRef(onRoundChange)
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
                    const round = mapRoundRow(payload.new as unknown as RoundRow)
                    setCurrentRound(round)
                    onRoundChangeRef.current?.(round)
                },
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'votes' },
                () => setVoteCount((n) => n + 1),
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` },
                (payload) => {
                    if (payload.new && typeof payload.new === 'object' && 'status' in payload.new) {
                        setLobbyStatus((payload.new as { status: string }).status)
                    }
                },
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [lobbyId]) // lobbyId only — callback changes never force re-subscribe

    const resetVoteCount = useCallback(() => setVoteCount(0), [])

    return { currentRound, voteCount, lobbyStatus, resetVoteCount, setCurrentRound }
}
