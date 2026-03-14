'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation }                   from '@tanstack/react-query'
import { useTranslations }               from 'next-intl'
import { submitVoteAction,
    checkExistingVoteAction }       from '../actions'
import type { Vote }                     from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UseVoteOptions = {
    currentPlayerId: string
    /**
     * Called after a vote settles (successful submission or ALREADY_VOTED).
     * Used by the orchestration hook to start the reveal-polling fallback.
     */
    onVoteSettled?: (roundId: string) => void
}

type SubmitVoteArgs = {
    roundId:    string
    voterId:    string
    votedForId: string
}

/**
 * Sentinel returned from `mutationFn` when the server reports ALREADY_VOTED.
 * Lets `onSuccess` handle state transitions without calling `setState` inside
 * `mutationFn`, which would bypass React Query's state machine.
 */
type VoteMutationResult =
    | { alreadyVoted: true;  vote: null }
    | { alreadyVoted: false; vote: Vote }

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages vote submission state for the current player's active round.
 *
 * - `hasVoted` is set on successful submission or when an existing vote is
 *   detected (ALREADY_VOTED or hydration check).
 * - A submit-lock ref prevents double-click races at the call site before
 *   React Query's own pending flag is set.
 * - `ALREADY_VOTED` is treated as a silent success — `hasVoted` is set and
 *   `mutation.isError` stays false so no error is shown to the user.
 * - `checkExistingVote` re-hydrates `hasVoted` after a page refresh mid-round.
 * - `resetVote` clears all state when a new round begins.
 */
export function useVote({ currentPlayerId, onVoteSettled }: UseVoteOptions) {
    const [hasVoted, setHasVoted] = useState(false)
    const isSubmittingRef         = useRef(false)
    const t                       = useTranslations('voting')

    const mutation = useMutation<VoteMutationResult, Error, SubmitVoteArgs>({
        mutationFn: async ({ roundId, voterId, votedForId }) => {
            const result = await submitVoteAction(roundId, voterId, votedForId)

            if (!result.ok) {
                switch (result.error.type) {
                    case 'ALREADY_VOTED':
                        return { alreadyVoted: true, vote: null }
                    case 'NOT_VOTING_PHASE':
                        throw new Error(t('votingEnded'))
                    default:
                        throw new Error(t('failedToVote'))
                }
            }

            return { alreadyVoted: false, vote: result.value }
        },
        onSuccess: (data, { roundId }) => {
            setHasVoted(true)
            onVoteSettled?.(roundId)
            // `data.vote` is null for ALREADY_VOTED; the parent only needs to
            // know the vote settled, not receive the Vote object in that case.
        },
        onSettled: () => { isSubmittingRef.current = false },
    })

    /**
     * Submits a vote. No-ops if a submission is already in flight.
     * Uses `mutation.mutate` (stable reference) as the callback dependency
     * rather than the full `mutation` object (which has a new ref each render).
     */
    const submitVote = useCallback((
        roundId:    string,
        voterId:    string,
        votedForId: string,
    ) => {
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
        mutation.mutate({ roundId, voterId, votedForId })
    }, [mutation.mutate]) // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Checks the server for an existing vote. Called on mount and round-change
     * to restore `hasVoted` after a page refresh mid-round.
     */
    const checkExistingVote = useCallback(async (roundId: string) => {
        const result = await checkExistingVoteAction(roundId, currentPlayerId)
        if (result.ok && result.value) setHasVoted(true)
    }, [currentPlayerId])

    /** Clears all vote state when the round changes. */
    const resetVote = useCallback(() => {
        setHasVoted(false)
        isSubmittingRef.current = false
        mutation.reset()
    }, [mutation.reset]) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        submitVote,
        checkExistingVote,
        isPending: mutation.isPending,
        hasVoted,
        vote:      mutation.data?.vote ?? null,
        error:     mutation.isError ? mutation.error.message : null,
        resetVote,
    }
}