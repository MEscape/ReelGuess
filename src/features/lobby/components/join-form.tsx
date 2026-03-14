'use client'

import { useState, useCallback }       from 'react'
import { Input, ErrorMessage, Button }  from '@/components/ui'
import { useJoinLobby }                 from '../hooks/use-lobby'
import { cn }                           from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Two-field form: lobby code (large display input) + player name.
 *
 * Uses a `<div>` container with `onClick` on the button and `onKeyDown` (Enter)
 * on both inputs — no HTML `<form>` element, per project rules.
 */
export function JoinForm() {
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const { joinLobby, isPending, error } = useJoinLobby()

    const codeReady = code.length === 6
    const nameReady = name.trim().length >= 2
    const canSubmit = codeReady && nameReady && !isPending

    const hint = !codeReady
        ? `${6 - code.length} more character${6 - code.length !== 1 ? 's' : ''} needed`
        : !nameReady
            ? 'Enter your display name'
            : null

    const handleSubmit = useCallback(() => {
        if (canSubmit) joinLobby(code, name.trim())
    }, [canSubmit, joinLobby, code, name])

    return (
        <div className="flex flex-col gap-4 w-full">

            {/* ── Code input — large display variant ── */}
            <div className="flex flex-col gap-1.5">
                <label className="input-label">Lobby Code</label>
                <input
                    className={cn(
                        'input input-code',
                        codeReady && 'border-[var(--color-accent)]',
                    )}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                    placeholder="XXXXXX"
                    maxLength={6}
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="text"
                    aria-label="6-letter lobby code"
                />
            </div>

            {/* ── Name input ── */}
            <Input
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                placeholder="Display name…"
                maxLength={16}
                autoComplete="nickname"
            />

            {/* ── Field completion strip ── */}
            <div className="flex gap-1.5" aria-hidden>
                <div className={cn(
                    'h-[3px] flex-1 transition-colors duration-[var(--duration-base)]',
                    codeReady ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]',
                )} />
                <div className={cn(
                    'h-[3px] flex-1 transition-colors duration-[var(--duration-base)]',
                    nameReady ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]',
                )} />
            </div>

            {/* ── Submit ── */}
            <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                loading={isPending}
                disabled={!canSubmit}
                onClick={handleSubmit}
            >
                🔗 Join Lobby
            </Button>

            {hint && !isPending && (
                <p
                    className="text-center font-sans text-[var(--color-subtle)]"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    {hint}
                </p>
            )}

            <ErrorMessage message={error} />
        </div>
    )
}
