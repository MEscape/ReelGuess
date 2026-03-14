'use client'

import { Button }        from '@/components/ui'
import { useRematch }    from '../hooks/use-rematch'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RematchButtonProps = {
    /** Code of the finished lobby. */
    lobbyId:         string
    /** Current player's UUID in the finished lobby. */
    currentPlayerId: string
    /**
     * New lobby code if another player already started a rematch.
     * Used only to set the button label — the underlying action is identical
     * in both cases (`createRematchAction` is idempotent).
     */
    rematchId?:      string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rematch CTA on the {@link GameOverScreen}.
 *
 * Delegates all logic to {@link useRematch}. Both the "create" and "join"
 * cases go through the same mutation — `createRematchAction` is idempotent
 * and returns the existing rematch lobby if one already exists.
 *
 * `rematchId` only affects the button label.
 */
export function RematchButton({ lobbyId, currentPlayerId, rematchId }: RematchButtonProps) {
    const { handleRematch, isPending, error } = useRematch({ lobbyId, currentPlayerId })

    const label = rematchId ? '⚔️ JOIN REMATCH' : '⚔️ REMATCH'

    return (
        <div className="flex flex-col items-stretch gap-2 w-full">
            <Button
                size="lg"
                fullWidth
                variant="primary"
                onClick={handleRematch}
                loading={isPending}
                disabled={isPending}
            >
                {isPending ? 'CREATING…' : label}
            </Button>

            {error && (
                <p
                    className="text-center"
                    style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-danger)' }}
                >
                    {error}
                </p>
            )}
        </div>
    )
}