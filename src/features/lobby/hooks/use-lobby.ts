'use client'

import { useTransition, useState } from 'react'
import { useRouter }               from 'next/navigation'
import { createLobbyAction, joinLobbyAction, startGameAction } from '../actions'
import { usePlayerStore }          from '@/features/player/stores/player-store'
import { submitReelsOnJoinAction } from '@/features/reel-import/actions'
import { getLocalReels }           from '@/features/reel-import/stores/local-reel-store'
import { MIN_REELS }               from '@/features/reel-import/validations'

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submits the player's full local reel pool to the DB after joining/creating.
 *
 * - Sends the entire local pool — `submitReelsOnJoinAction` handles the
 *   server-side shuffle and MAX_REELS cap, preventing the client from
 *   cherry-picking which reels enter the game.
 * - Fire-and-forget: navigation happens regardless. The host's `startGame`
 *   validation will catch any player who hasn't submitted reels yet.
 * - Silently no-ops if the local pool is below MIN_REELS — the lobby page
 *   will surface the missing-reels error when the host tries to start.
 */
async function submitLocalReelsToDB(lobbyId: string, playerId: string): Promise<void> {
    const localPool = getLocalReels()
    if (localPool.length < MIN_REELS) return

    const fd = new FormData()
    fd.set('lobbyId',  lobbyId)
    fd.set('playerId', playerId)
    fd.set('reelUrls', JSON.stringify(localPool.map((r) => r.url)))

    await submitReelsOnJoinAction(fd)
}

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

    function createLobby(playerName: string) {
        setError(null)
        startTransition(async () => {
            const fd = new FormData()
            fd.set('playerName', playerName)

            const result = await createLobbyAction(fd)
            if (!result.ok) {
                setError('message' in result.error ? result.error.message : 'Something went wrong. Try again!')
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
                    case 'LOBBY_NOT_FOUND':        setError('Lobby not found. Check the code!'); break
                    case 'LOBBY_FULL':             setError('This lobby is full!'); break
                    case 'LOBBY_ALREADY_STARTED':  setError('This game has already started!'); break
                    case 'LOBBY_VALIDATION_ERROR': setError('message' in e ? e.message : 'Validation error'); break
                    default:                       setError('Something went wrong. Try again!')
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

    function startGame() {
        setError(null)
        startTransition(async () => {
            const result = await startGameAction(lobbyCode, hostPlayerId)
            if (!result.ok) {
                setError('message' in result.error ? result.error.message : 'Failed to start game')
                return
            }
            // Host navigates immediately — Realtime handles all other players.
            router.push(`/game/${lobbyCode}`)
        })
    }

    return { startGame, isPending, error }
}