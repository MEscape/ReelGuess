'use client'

import { useTransition, useState } from 'react'
import { useRouter }               from 'next/navigation'
import { useTranslations }         from 'next-intl'
import { createLobbyAction, joinLobbyAction, startGameAction, updateLobbySettingsAction } from '../actions'
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
 */
export function useCreateLobby() {
    const [isPending, startTransition] = useTransition()
    const [error,     setError]        = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)
    const t           = useTranslations('lobby.errors')

    function createLobby(playerName: string) {
        setError(null)
        startTransition(async () => {
            const fd = new FormData()
            fd.set('playerName', playerName)

            const result = await createLobbyAction(fd)
            if (!result.ok) {
                setError('message' in result.error ? result.error.message : t('failedToCreate'))
                return
            }

            const { lobby, player } = result.value
            setPlayerId(lobby.id, player.id)
            void submitLocalReelsToDB(lobby.id, player.id)
            router.push(`/lobby/${lobby.id}`)
        })
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
 */
export function useJoinLobby() {
    const [isPending, startTransition] = useTransition()
    const [error,     setError]        = useState<string | null>(null)
    const router      = useRouter()
    const setPlayerId = usePlayerStore((s) => s.setPlayerId)
    const t           = useTranslations('lobby.errors')

    function joinLobby(code: string, playerName: string) {
        setError(null)
        startTransition(async () => {
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
        })
    }

    return { joinLobby, isPending, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// useStartGame
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encapsulates the host's start-game action.
 * Extracted from `LobbyRoom` to keep the component pure UI.
 */
export function useStartGame(lobbyCode: string, hostPlayerId: string) {
    const [isPending, startTransition] = useTransition()
    const [error,     setError]        = useState<string | null>(null)
    const router = useRouter()
    const t      = useTranslations('lobby.errors')

    function startGame() {
        setError(null)
        startTransition(async () => {
            const result = await startGameAction(lobbyCode, hostPlayerId)
            if (!result.ok) {
                setError('message' in result.error ? result.error.message : t('failedToStart'))
                return
            }
            // Host navigates immediately — Realtime handles all other players.
            router.push(`/game/${lobbyCode}`)
        })
    }

    return { startGame, isPending, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateSettings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encapsulates the host's update-settings action.
 *
 * Optimistic: the UI reflects the new values immediately while the server
 * call is in-flight. On error the caller should revert to the previous value.
 */
export function useUpdateSettings(lobbyCode: string, hostPlayerId: string) {
    const [isPending, startTransition] = useTransition()
    const [error,     setError]        = useState<string | null>(null)
    const t = useTranslations('lobby.errors')

    function updateSettings(settings: { roundsCount: number; timerSeconds: number }) {
        setError(null)
        startTransition(async () => {
            const result = await updateLobbySettingsAction(lobbyCode, hostPlayerId, settings)
            if (!result.ok) {
                setError('message' in result.error ? result.error.message : t('failedToUpdate'))
            }
        })
    }

    return { updateSettings, isPending, error }
}
