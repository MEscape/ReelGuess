'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation }                   from '@tanstack/react-query'
import { submitVoteAction }              from '../actions'
import { createClient }                  from '@/lib/supabase/client'
import type { Vote }                     from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubmitVoteArgs = { roundId: string; voterId: string; votedForId: string }

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages a single round's vote submission for the current player.
 *
 * Uses React Query `useMutation` for:
 * - Automatic loading state (`isPending`).
 * - Structured error handling.
 * - `reset()` to clear state between rounds.
 *
 * Additional features:
 * - Submit-lock via `isSubmittingRef` prevents double-click race conditions.
 * - `checkExistingVote` re-hydrates `hasVoted` after a page refresh mid-round.
 * - `ALREADY_VOTED` is treated as a non-fatal success (player already voted).
 */
export function useRound() {
    /** Set to `true` once a vote is confirmed (either new or pre-existing). */
    const [hasVoted, setHasVoted]     = useState(false)
    const [friendlyError, setFriendlyError] = useState<string | null>(null)

    /** Prevents concurrent vote submissions. */
    const isSubmittingRef = useRef(false)

    const mutation = useMutation<Vote, string, SubmitVoteArgs>({
        mutationFn: async ({ roundId, voterId, votedForId }) => {
            const result = await submitVoteAction(roundId, voterId, votedForId)
            if (!result.ok) {
                switch (result.error.type) {
                    case 'ALREADY_VOTED':    setHasVoted(true);    throw 'already_voted'
                    case 'CANNOT_VOTE_SELF':                       throw "You can't vote for yourself!"
                    case 'NOT_VOTING_PHASE':                       throw 'Voting has ended'
                    default:                                       throw 'Failed to submit vote'
                }
            }
            return result.value
        },
        onSuccess: () => setHasVoted(true),
        onSettled: () => { isSubmittingRef.current = false },
    })

    /**
     * Submits a vote. No-ops if a submission is already in flight.
     */
    const submitVote = useCallback((roundId: string, voterId: string, votedForId: string) => {
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
        setFriendlyError(null)
        mutation.mutate({ roundId, voterId, votedForId })
    }, [mutation])

    /**
     * Checks the DB to see if the player has already voted this round.
     * Called on mount / round change to handle page-refresh scenarios.
     */
    const checkExistingVote = useCallback(async (roundId: string, playerId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('votes')
            .select('id')
            .eq('round_id', roundId)
            .eq('voter_id', playerId)
            .maybeSingle()

        if (data) setHasVoted(true)
    }, [])

    /** Resets all state when moving to a new round. */
    const resetRound = useCallback(() => {
        setHasVoted(false)
        setFriendlyError(null)
        isSubmittingRef.current = false
        mutation.reset()
    }, [mutation])

    const error =
        friendlyError ??
        (mutation.isError ? mutation.error : null)

    return {
        submitVote,
        checkExistingVote,
        isPending: mutation.isPending,
        hasVoted,
        vote:  mutation.data ?? null,
        error,
        resetRound,
    }
}