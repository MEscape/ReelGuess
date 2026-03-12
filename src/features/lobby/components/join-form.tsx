'use client'

import { useState }                   from 'react'
import { Input, ErrorMessage, Button } from '@/components/ui'
import { useJoinLobby }                from '../hooks/use-lobby'
import { cn }                          from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Two-field form: lobby code (large display input) + player name.
 *
 * Note: uses a native <form> with onSubmit so Enter-key submission works on
 * mobile keyboards. The Button has type="submit" — no onClick handler needed.
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

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (canSubmit) joinLobby(code, name.trim())
            }}
            className="flex flex-col gap-4 w-full"
        >
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
                type="submit"
                variant="secondary"
                size="lg"
                fullWidth
                loading={isPending}
                disabled={!canSubmit}
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
        </form>
    )
}
