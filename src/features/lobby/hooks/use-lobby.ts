'use client'

import { useState } from 'react'
import { useRouter }               from 'next/navigation'
import { useTranslations }         from 'next-intl'
import { createLobbyAction, joinLobbyAction, startGameAction } from '../actions'
import { usePlayerStore }          from '@/features/player'
import { submitLocalReelsToDB }    from '../utils'

// ─────────────────────────────────────────────────────────────────────────────
// useCreateLobby
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles the full create-lobby flow:
 * 1. Call `createLobbyAction` to create lobby + host player.
 * 2. Persist player ID to the store.
 * 3. Submit local reels to the DB (fire-and-forget).
 * 4. Navigate to the lobby page.
 *
 * Intentionally does NOT use useTransition — Next.js App Router triggers an
 * automatic router.refresh() after server actions called inside startTransition,
 * which causes LobbyClient to briefly show NotMemberScreen on subsequent visits.
 * Manual isPending state avoids this.
 */
export function useCreateLobby() {
    const [isPending, setIsPending] = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)
    const t           = useTranslations('lobby.errors')
    const tErrors     = useTranslations('errors')

    async function createLobby(playerName: string) {
        setError(null)
        setIsPending(true)
        try {
            const fd = new FormData()
            fd.set('playerName', playerName)

            const result = await createLobbyAction(fd)
            if (!result.ok) {
                if (result.error.type === 'RATE_LIMITED') {
                    setError(tErrors('rateLimitExceeded'))
                } else {
                    setError('message' in result.error ? result.error.message : t('failedToCreate'))
                }
                return
            }

            const { lobby, player } = result.value
            setPlayerId(lobby.id, player.id)
            void submitLocalReelsToDB(lobby.id, player.id)
            router.push(`/lobby/${lobby.id}`)
        } finally {
            setIsPending(false)
        }
    }

    return { createLobby, isPending, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// useJoinLobby
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles the full join-lobby flow:
 * 1. Call `joinLobbyAction` to add player to lobby.
 * 2. Persist player ID to the store.
 * 3. Submit local reels to the DB (fire-and-forget).
 * 4. Navigate to the lobby page.
 *
 * Intentionally does NOT use useTransition — same reason as useCreateLobby.
 */
export function useJoinLobby() {
    const [isPending, setIsPending] = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)
    const t           = useTranslations('lobby.errors')
    const tErrors     = useTranslations('errors')

    async function joinLobby(code: string, playerName: string) {
        setError(null)
        setIsPending(true)
        try {
            const fd = new FormData()
            fd.set('code',       code.toUpperCase())
            fd.set('playerName', playerName)

            const result = await joinLobbyAction(fd)
            if (!result.ok) {
                const e = result.error
                switch (e.type) {
                    case 'LOBBY_NOT_FOUND':        setError(t('lobbyNotFound')); break
                    case 'LOBBY_FULL':             setError(t('lobbyFull')); break
                    case 'LOBBY_ALREADY_STARTED':  setError(t('lobbyAlreadyStarted')); break
                    case 'RATE_LIMITED':           setError(tErrors('rateLimitExceeded')); break
                    case 'LOBBY_VALIDATION_ERROR':
                        if ('nameTaken' in e && e.nameTaken) {
                            setError(t('nameTaken', { name: e.nameTaken }))
                        } else {
                            setError(t('validationError'))
                        }
                        break
                    default:                       setError(t('failedToCreate'))
                }
                return
            }

            const player    = result.value
            const upperCode = code.toUpperCase()
            setPlayerId(upperCode, player.id)
            void submitLocalReelsToDB(upperCode, player.id)
            router.push(`/lobby/${upperCode}`)
        } finally {
            setIsPending(false)
        }
    }

    return { joinLobby, isPending, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// useStartGame
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encapsulates the host's start-game action.
 * Extracted from `LobbyRoom` to keep the component pure UI.
 *
 * Intentionally does NOT use useTransition — same reason as useCreateLobby.
 */
export function useStartGame(lobbyCode: string, hostPlayerId: string) {
    const [isPending, setIsPending] = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const router  = useRouter()
    const t       = useTranslations('lobby.errors')
    const tErrors = useTranslations('errors')

    async function startGame() {
        setError(null)
        setIsPending(true)
        try {
            const result = await startGameAction(lobbyCode, hostPlayerId)
            if (!result.ok) {
                if (result.error.type === 'RATE_LIMITED') {
                    setError(tErrors('rateLimitExceeded'))
                } else {
                    setError('message' in result.error ? result.error.message : t('failedToStart'))
                }
                return
            }
            // Host navigates immediately — Realtime handles all other players.
            router.push(`/game/${lobbyCode}`)
        } finally {
            setIsPending(false)
        }
    }

    return { startGame, isPending, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateSettings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encapsulates the host's update-settings action.
 *
 * Uses a plain fetch to PATCH /api/lobby/[code]/settings instead of a Server
 * Action. In Next.js 15/16 every Server Action call automatically triggers a
 * router.refresh() which remounts LobbyClient and briefly shows NotMemberScreen
 * because the component re-initialises with typeof window === 'undefined' during
 * the RSC re-render. A fetch call has no such side effect.
 */
export function useUpdateSettings(lobbyCode: string, hostPlayerId: string) {
    const [isPending, setIsPending] = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const t = useTranslations('lobby.errors')

    async function updateSettings(settings: { roundsCount: number; timerSeconds: number }) {
        setError(null)
        setIsPending(true)
        try {
            const res = await fetch(`/api/lobby/${lobbyCode}/settings`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ hostPlayerId, ...settings }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({})) as { error?: string }
                setError(data.error ?? t('failedToUpdate'))
            }
        } catch {
            setError(t('failedToUpdate'))
        } finally {
            setIsPending(false)
        }
    }

    return { updateSettings, isPending, error }
}
