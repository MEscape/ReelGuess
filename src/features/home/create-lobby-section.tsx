'use client'

import { useState }             from 'react'
import { useCreateLobby }       from '@/features/lobby/hooks/use-lobby'
import { PlayerNameForm }       from '@/features/player/components/player-name-form'
import { ErrorMessage, Button } from '@/components/ui'
import { useLocalReels }        from '@/features/reel-import/hooks/use-local-reels'
import { ReelsRequiredHint }    from './reels-required-hint'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expandable section for creating a new lobby.
 *
 * Collapsed: single CTA button.
 * Expanded: name form + create action.
 */
export function CreateLobbySection() {
    const [open, setOpen] = useState(false)
    const { createLobby, isPending, error } = useCreateLobby()
    const { hasReels } = useLocalReels()

    /* ── Collapsed ── */
    if (!open) {
        return (
            <div className="flex flex-col gap-2">
                <Button size="lg" fullWidth disabled={!hasReels} onClick={() => setOpen(true)}>
                    Create Lobby
                </Button>
                {!hasReels && <ReelsRequiredHint />}
            </div>
        )
    }

    /* ── Expanded ── */
    return (
        <div className="card-brutal overflow-hidden">
            <div className="h-[3px] bg-[var(--color-accent)] w-full" aria-hidden />

            <div className="p-4 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                    <span
                        className="font-display uppercase leading-none text-[var(--color-accent)]"
                        style={{
                            fontSize:      'var(--text-title-sm)',
                            letterSpacing: 'var(--tracking-display)',
                        }}
                    >
                        Create Lobby
                    </span>
                    <button
                        className="modal-close"
                        onClick={() => setOpen(false)}
                        aria-label="Cancel create lobby"
                    >
                        ✕
                    </button>
                </div>

                <p
                    className="font-sans text-[var(--color-subtle)] -mt-2 leading-snug"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    Enter a display name to host the game
                </p>

                <PlayerNameForm
                    onSubmit={createLobby}
                    isPending={isPending}
                    placeholder="Your display name…"
                    buttonText="Create & Join"
                />

                <ErrorMessage message={error} />
            </div>
        </div>
    )
}

