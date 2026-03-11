'use client'

import { useState }     from 'react'
import { Input, ErrorMessage, Button }        from '@/components/ui'
import { useJoinLobby } from '../hooks/use-lobby'

/**
 * Two-field form for joining an existing lobby by code + player name.
 * Uses the shared `Input`, `Button` and `ErrorMessage` components.
 */
export function JoinForm() {
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const { joinLobby, isPending, error } = useJoinLobby()

    const canSubmit = code.length === 6 && name.trim().length >= 2 && !isPending

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (canSubmit) joinLobby(code, name.trim())
            }}
            className="flex flex-col gap-3 w-full"
        >
            <Input
                variant="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                maxLength={6}
                autoComplete="off"
                spellCheck={false}
            />
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name…"
                maxLength={16}
            />
            <Button type="submit" variant="secondary" size="md" fullWidth disabled={!canSubmit}>
                {isPending ? '⏳ JOINING…' : '🔗 JOIN LOBBY'}
            </Button>
            <ErrorMessage message={error} />
        </form>
    )
}
