'use client'

import { useState }           from 'react'
import { Button }             from '@/components/ui'
import { JoinForm }           from '@/features/lobby/components/join-form'
import { useLocalReels }      from '@/features/reel-import/hooks/use-local-reels'
import { ReelsRequiredHint }  from './reels-required-hint'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expandable section for joining an existing lobby.
 *
 * Collapsed: single CTA button.
 * Expanded: code + name form.
 */
export function JoinLobbySection() {
    const [open, setOpen] = useState(false)
    const { hasReels } = useLocalReels()

    /* ── Collapsed ── */
    if (!open) {
        return (
            <div className="flex flex-col gap-2">
                <Button size="lg" variant="secondary" fullWidth disabled={!hasReels} onClick={() => setOpen(true)}>
                    Join Lobby
                </Button>
                {!hasReels && <ReelsRequiredHint />}
            </div>
        )
    }

    /* ── Expanded ── */
    return (
        <div className="card-brutal overflow-hidden">
            <div className="h-[3px] bg-[#e63980] w-full" aria-hidden />

            <div className="p-4 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                    <span
                        className="font-display uppercase leading-none text-[#e63980]"
                        style={{
                            fontSize:      'var(--text-title-sm)',
                            letterSpacing: 'var(--tracking-display)',
                        }}
                    >
                        Join Lobby
                    </span>
                    <button
                        className="modal-close"
                        onClick={() => setOpen(false)}
                        aria-label="Cancel join lobby"
                    >
                        ✕
                    </button>
                </div>

                <p
                    className="font-sans text-[var(--color-subtle)] -mt-2 leading-snug"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    Enter the 6-letter code from your host
                </p>

                <JoinForm />
            </div>
        </div>
    )
}


