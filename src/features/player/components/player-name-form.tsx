'use client'

import { useState, useCallback }  from 'react'
import { Input, Button }          from '@/components/ui'
import { NAME_MIN_LENGTH, NAME_MAX_LENGTH } from '../constants'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlayerNameFormProps = {
    onSubmit:     (name: string) => void
    isPending?:   boolean
    placeholder?: string
    buttonText?:  string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Name-entry form used in both the create-lobby and join-lobby flows.
 *
 * ### No <form> element
 * Uses a `<div>` container with `onClick` on the button and `onKeyDown` on
 * the input (Enter key) instead of an HTML `<form>`. This follows the project
 * rule that prohibits `<form>` elements in React components.
 *
 * ### Validation
 * `NAME_MIN_LENGTH` and `NAME_MAX_LENGTH` are imported from `../types` — the
 * single source of truth for name constraints. Changing the constants there
 * automatically updates both the client guard and the `maxLength` attribute.
 *
 * A validation message appears when the field is non-empty but below the
 * minimum length, giving the user actionable feedback before they submit.
 */
export function PlayerNameForm({
                                   onSubmit,
                                   isPending   = false,
                                   placeholder = 'Your name…',
                                   buttonText  = "🚀 LET'S GO",
                               }: PlayerNameFormProps) {
    const [name, setName] = useState('')

    const trimmed   = name.trim()
    const canSubmit = trimmed.length >= NAME_MIN_LENGTH && !isPending
    const showError = trimmed.length > 0 && trimmed.length < NAME_MIN_LENGTH

    const handleSubmit = useCallback(() => {
        if (canSubmit) onSubmit(trimmed)
    }, [canSubmit, onSubmit, trimmed])

    return (
        <div className="flex flex-col gap-3 w-full">
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                placeholder={placeholder}
                maxLength={NAME_MAX_LENGTH}
            />

            {showError && (
                <p
                    className="font-sans"
                    style={{
                        fontSize: 'var(--text-label-sm)',
                        color:    'var(--color-danger)',
                    }}
                >
                    Name must be at least {NAME_MIN_LENGTH} characters
                </p>
            )}

            <Button
                type="button"
                size="md"
                fullWidth
                disabled={!canSubmit}
                onClick={handleSubmit}
            >
                {isPending ? '⏳ LOADING…' : buttonText}
            </Button>
        </div>
    )
}
