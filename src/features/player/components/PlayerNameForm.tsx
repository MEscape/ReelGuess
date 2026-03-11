'use client'

import { useState }  from 'react'
import { Input, Button } from '@/components/ui'

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
 * Simple name-entry form used in both the create-lobby and join-lobby flows.
 * Uses the shared `Input` and `Button` components.
 */
export function PlayerNameForm({
                                   onSubmit,
                                   isPending   = false,
                                   placeholder = 'Your name…',
                                   buttonText  = "🚀 LET'S GO",
                               }: PlayerNameFormProps) {
    const [name, setName] = useState('')
    const canSubmit = name.trim().length >= 2 && !isPending

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(name.trim()) }}
            className="flex flex-col gap-3 w-full"
        >
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                maxLength={16}
            />
            <Button type="submit" size="md" fullWidth disabled={!canSubmit}>
                {isPending ? '⏳ LOADING…' : buttonText}
            </Button>
        </form>
    )
}
