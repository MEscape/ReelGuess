'use client'

import { useState }             from 'react'
import { useCreateLobby }       from '@/features/lobby/hooks/use-lobby'
import { PlayerNameForm }       from '@/features/player/components/PlayerNameForm'
import { ErrorMessage, Button } from '@/components/ui'
import { JoinForm }             from '@/features/lobby/components/join-form'
import { ImportFlow }           from '@/features/reel-import/components/import-flow'
import { useLocalReels }        from '@/features/reel-import/hooks/use-local-reels'
import { cn }                   from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// CreateLobbySection
// ─────────────────────────────────────────────────────────────────────────────

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

                {/* Section header — display font at --text-title-sm */}
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

                {/* Instruction — body copy, not uppercase bold Inter */}
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

// ─────────────────────────────────────────────────────────────────────────────
// JoinLobbySection
// ─────────────────────────────────────────────────────────────────────────────

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
            <div className="h-[3px] bg-[var(--color-secondary)] w-full" aria-hidden />

            <div className="p-4 flex flex-col gap-4">

                {/* Section header */}
                <div className="flex items-center justify-between">
                    <span
                        className="font-display uppercase leading-none text-[var(--color-secondary)]"
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

                {/* Instruction */}
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

// ─────────────────────────────────────────────────────────────────────────────
// ManageReelsSection
// ─────────────────────────────────────────────────────────────────────────────

export function ManageReelsSection() {
    const [showImport, setShowImport] = useState(false)
    const { reels, count, clear } = useLocalReels()

    /* ── Importing ── */
    if (showImport) {
        return (
            <div className="card-brutal overflow-hidden">
                <ImportFlow onComplete={() => setShowImport(false)} />
            </div>
        )
    }

    /* ── Empty state ── */
    if (count === 0) {
        return (
            <div className="card-brutal">
                <div className="m-3 border-2 border-dashed border-[var(--color-border-subtle)] flex flex-col items-center gap-3 py-7 px-4 text-center">
                    <span className="text-4xl leading-none" aria-hidden>📥</span>
                    <div className="flex flex-col gap-1.5">
                        {/* Empty state title — --text-title-sm, consistent with other card titles */}
                        <p
                            className="font-display uppercase text-[var(--color-muted)]"
                            style={{
                                fontSize:      'var(--text-title-sm)',
                                letterSpacing: 'var(--tracking-display)',
                            }}
                        >
                            No Reels yet
                        </p>
                        {/* Description — body copy, readable */}
                        <p
                            className="font-sans text-[var(--color-subtle)] leading-relaxed"
                            style={{ fontSize: 'var(--text-body-sm)' }}
                        >
                            Import your liked Reels from Instagram — you need them to play
                        </p>
                    </div>
                    <Button size="md" variant="ghost" onClick={() => setShowImport(true)}>
                        📥 Import Reels
                    </Button>
                </div>
            </div>
        )
    }

    /* ── Has reels ── */
    return (
        <div className="card-brutal flex flex-col gap-0">

            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                    <span className="badge badge-accent tabular-nums">
                        {count}
                    </span>
                    {/* "Reels ready" label — .input-label sizing, consistent with other card section labels */}
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                        Reels ready
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Clear all — was text-[0.65rem] (too small). Now --text-label-xs via input-label sizing. */}
                    <button
                        onClick={clear}
                        className={cn(
                            'input-label',
                            'text-[var(--color-faint)]',
                            'transition-colors duration-[var(--duration-fast)]',
                            'hover:text-[var(--color-danger)]',
                        )}
                        style={{ marginBottom: 0 }}
                    >
                        Clear all
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
                        + Add
                    </Button>
                </div>
            </div>

            {/* Reel preview grid */}
            <div className="p-3">
                <div className="grid grid-cols-8 gap-1">
                    {reels.slice(0, MAX_PREVIEW).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'aspect-square flex items-center justify-center text-sm leading-none',
                                'bg-[var(--color-border)] border border-[var(--color-border-subtle)]',
                                'transition-[border-color,background-color] duration-[var(--duration-fast)]',
                                'hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]',
                            )}
                            title={`Reel ${i + 1}`}
                        >
                            🎬
                        </div>
                    ))}

                    {count > MAX_PREVIEW && (
                        <div className="aspect-square flex items-center justify-center font-display text-xs border-2 border-dashed border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                            {count - MAX_PREVIEW > 99 ? '99+' : `+${count - MAX_PREVIEW}`}
                        </div>
                    )}
                </div>
            </div>

            {/* Readiness bar */}
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                    {/* Labels — .input-label (10px display font), was text-[0.6rem] */}
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-subtle)' }}>
                        Ready to play
                    </span>
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-success)' }}>
                        ✓ {count} loaded
                    </span>
                </div>
                <div className="progress-track success">
                    <div className="progress-fill" style={{ width: '100%' }} />
                </div>
            </div>

        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// ReelsRequiredHint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shown below disabled Create/Join buttons when no reels are imported.
 *
 * Was: text-xs font-bold uppercase tracking-wide (mixed Inter bold + uppercase)
 * Now: font-sans at --text-body-sm, normal weight — this is a helper hint,
 *      not a label. The warning arrow keeps visual weight without the text
 *      needing to shout.
 */
function ReelsRequiredHint() {
    return (
        <p
            className="flex items-center justify-center gap-1.5 font-sans text-[var(--color-subtle)]"
            style={{ fontSize: 'var(--text-body-sm)' }}
        >
            <span className="text-[var(--color-warning)]" aria-hidden>↓</span>
            Import your Reels below first
        </p>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PREVIEW = 10