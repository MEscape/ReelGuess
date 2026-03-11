'use client'

import { useTransition, useState } from 'react'
import { useRouter }               from 'next/navigation'
import { createLobbyAction, joinLobbyAction } from '../actions'
import { usePlayerStore }          from '@/features/player/stores/player-store'

// ─────────────────────────────────────────────────────────────────────────────
// useCreateLobby
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles the create-lobby flow.
 *
 * On success: persists the playerId in the Zustand store and navigates to
 * the lobby page. The store writes to sessionStorage for page-refresh resilience.
 */
export function useCreateLobby() {
    const [isPending, startTransition] = useTransition()
    const [error,     setError]        = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)

    function createLobby(playerName: string) {
        setError(null)
        startTransition(async () => {
            const fd = new FormData()
            fd.set('playerName', playerName)

            const result = await createLobbyAction(fd)
            if (result.ok) {
                setPlayerId(result.value.lobby.id, result.value.player.id)
                router.push(`/lobby/${result.value.lobby.id}`)
            } else {
                setError('Something went wrong. Try again!')
            }
        })
    }

    return { createLobby, isPending, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// useJoinLobby
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles the join-lobby flow.
 *
 * Maps all known error types to user-friendly messages.
 */
export function useJoinLobby() {
    const [isPending, startTransition] = useTransition()
    const [error,     setError]        = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)

    function joinLobby(code: string, playerName: string) {
        setError(null)
        startTransition(async () => {
            const fd = new FormData()
            fd.set('code',       code.toUpperCase())
            fd.set('playerName', playerName)

            const result = await joinLobbyAction(fd)
            if (result.ok) {
                setPlayerId(code.toUpperCase(), result.value.id)
                router.push(`/lobby/${code.toUpperCase()}`)
            } else {
                const e = result.error
                switch (e.type) {
                    case 'LOBBY_NOT_FOUND':      setError('Lobby not found. Check the code!'); break
                    case 'LOBBY_FULL':           setError('Lobby is full!'); break
                    case 'LOBBY_ALREADY_STARTED': setError('Game already started!'); break
                    default:                     setError('Something went wrong')
                }
            }
        })
    }

    return { joinLobby, isPending, error }
}
