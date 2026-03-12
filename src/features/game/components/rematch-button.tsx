'use client'

import { useState, startTransition } from 'react'
import { useRouter }           from 'next/navigation'
import { usePlayerStore }      from '@/features/player/stores/player-store'
import { createRematchAction } from '@/features/lobby/actions'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RematchButtonProps = {
    /** Code of the finished lobby. */
    lobbyId:           string
    /** Current player's UUID in the finished lobby. */
    currentPlayerId:   string
    /**
     * If another player already started a rematch (detected via Realtime),
     * pass the new lobby code here to show a "Join Rematch" CTA instead.
     */
    rematchId?:        string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rematch button — appears on the {@link GameOverScreen}.
 *
 * Behaviour:
 * - First press: calls {@link createRematchAction}, stores the new player ID,
 *   navigates to the new lobby.
 * - If `rematchId` is already set (another player triggered a rematch first),
 *   the button switches to "Join Rematch" which does the same server-side
 *   lookup but skips lobby creation.
 * - Handles rate-limit and generic errors with inline feedback.
 */
export function RematchButton({ lobbyId, currentPlayerId, rematchId }: RematchButtonProps) {
    const [isPending, setIsPending] = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)

    const isJoin = Boolean(rematchId)
    const label  = isJoin ? '🔁 JOIN REMATCH' : '🔁 REMATCH'

    async function handleClick() {
        if (isPending) return
        setIsPending(true)
        setError(null)

        const result = await createRematchAction(lobbyId, currentPlayerId)

        if (!result.ok) {
            const msg =
                'message' in result.error
                    ? (result.error as { message: string }).message
                    : 'Failed to create rematch. Please try again.'
            startTransition(() => {
                setError(msg)
                setIsPending(false)
            })
            return
        }

        const { newLobbyCode, newPlayerId } = result.value
        setPlayerId(newLobbyCode, newPlayerId)
        router.push(`/game/${newLobbyCode.toLowerCase()}`)
    }

    return (
        <div className="flex flex-col items-stretch gap-2 w-full">
            <button
                onClick={handleClick}
                disabled={isPending}
                className="font-display uppercase"
                style={{
                    height:        'var(--height-btn-lg)',
                    fontSize:      'var(--text-ui)',
                    letterSpacing: 'var(--tracking-display)',
                    cursor:        isPending ? 'not-allowed' : 'pointer',
                    padding:       '0 var(--space-6)',
                    border:        '3px solid var(--color-accent)',
                    borderTop:     '5px solid var(--color-accent)',
                    background:    isPending
                        ? 'var(--color-surface-raised)'
                        : 'var(--color-accent)',
                    color:         isPending
                        ? 'var(--color-muted)'
                        : 'var(--color-accent-fg)',
                    boxShadow:     isPending
                        ? 'none'
                        : 'var(--shadow-brutal-accent)',
                    transition:    'background 0.1s ease, color 0.1s ease, box-shadow 0.1s ease',
                }}
            >
                {isPending ? 'CREATING…' : label}
            </button>

            {error && (
                <p
                    className="text-center"
                    style={{
                        fontSize: 'var(--text-body-sm)',
                        color:    'var(--color-danger)',
                    }}
                >
                    {error}
                </p>
            )}
        </div>
    )
}
