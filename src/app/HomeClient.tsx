'use client'

import { useState }         from 'react'
import { useCreateLobby }  from '@/features/lobby/hooks/use-lobby'
import { PlayerNameForm }  from '@/features/player/components/PlayerNameForm'
import { ErrorMessage, Card, Button }    from '@/components/ui'
import { JoinForm }        from '@/features/lobby/components/JoinForm'

// ─────────────────────────────────────────────────────────────────────────────
// CreateLobbySection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "Create Lobby" CTA.
 * Expands from a button to an inline form on click.
 */
export function CreateLobbySection() {
    const [showForm, setShowForm] = useState(false)
    const { createLobby, isPending, error } = useCreateLobby()

    if (!showForm) {
        return (
            <Button size="lg" fullWidth onClick={() => setShowForm(true)}>
                🎮 CREATE LOBBY
            </Button>
        )
    }

    return (
        <Card className="p-4">
            <h3 className="text-base font-black text-[var(--color-accent)] uppercase mb-3 text-center tracking-tight">
                🎮 Create Lobby
            </h3>
            <PlayerNameForm
                onSubmit={createLobby}
                isPending={isPending}
                placeholder="Your display name…"
                buttonText="🚀 CREATE & JOIN"
            />
            <ErrorMessage message={error} className="mt-2" />
        </Card>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// JoinLobbySection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "Join Lobby" CTA.
 * Expands from a button to an inline form on click.
 */
export function JoinLobbySection() {
    const [showForm, setShowForm] = useState(false)

    if (!showForm) {
        return (
            <Button size="lg" variant="secondary" fullWidth onClick={() => setShowForm(true)}>
                🔗 JOIN LOBBY
            </Button>
        )
    }

    return (
        <Card className="p-4">
            <h3 className="text-base font-black text-[var(--color-secondary)] uppercase mb-3 text-center tracking-tight">
                🔗 Join Lobby
            </h3>
            <JoinForm />
        </Card>
    )
}