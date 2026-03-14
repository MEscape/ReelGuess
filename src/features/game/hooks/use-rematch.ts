'use client'

import { useRouter }               from 'next/navigation'
import { useMutation }             from '@tanstack/react-query'
import { usePlayerStore }          from '@/features/player'
import { createRematchAction, submitLocalReelsToDB }     from '@/features/lobby'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UseRematchOptions = {
    /** Code of the finished lobby. */
    lobbyId:         string
    /** Current player's UUID in the finished lobby. */
    currentPlayerId: string
}

type UseRematchResult = {
    /** Triggers the rematch flow. No-ops if a mutation is already in flight. */
    handleRematch: () => void
    isPending:     boolean
    /** Human-readable error message, or null on success/idle. */
    error:         string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles the rematch flow from {@link GameOverScreen}.
 *
 * `createRematchAction` is idempotent — if a rematch lobby already exists it
 * returns the existing one rather than creating a new one. Both the "create"
 * and "join" cases therefore go through the same action and the same code path.
 * The only place `rematchId` matters is the button label in {@link RematchButton}.
 *
 * On success:
 * 1. Stores the new `playerId` via `setPlayerId` (required before navigation).
 * 2. Submits local reels fire-and-forget (server has seeded reels as fallback).
 * 3. Navigates to the new lobby.
 */
export function useRematch({
                               lobbyId,
                               currentPlayerId,
                           }: UseRematchOptions): UseRematchResult {
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)

    const mutation = useMutation<void, Error>({
        mutationFn: async () => {
            const result = await createRematchAction(lobbyId, currentPlayerId)
            if (!result.ok) {
                const message = 'message' in result.error
                    ? result.error.message
                    : 'Failed to create rematch. Please try again.'
                throw new Error(message)
            }

            const { newLobbyCode, newPlayerId } = result.value

            setPlayerId(newLobbyCode, newPlayerId)

            // Fire-and-forget — server seeded reels from previous game as fallback.
            void submitLocalReelsToDB(newLobbyCode, newPlayerId)

            router.push(`/lobby/${newLobbyCode}`)
        },
    })

    const handleRematch = () => {
        if (mutation.isPending) return
        mutation.mutate()
    }

    return {
        handleRematch,
        isPending: mutation.isPending,
        error:     mutation.isError ? mutation.error.message : null,
    }
}