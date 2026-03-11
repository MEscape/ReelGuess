'use client'

import { Button, ErrorMessage, Card }       from '@/components/ui'
import { usePlayers }   from '../hooks/use-players'
import { PlayerCard }   from './PlayerCard'
import { ShareCode }    from './ShareCode'
import { startGameAction } from '../actions'
import { useState, useTransition } from 'react'
import type { Lobby }   from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LobbyRoomProps = {
    lobby:           Lobby
    currentPlayerId: string
    /** Opens the reel-import flow. */
    onImport?:       () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Waiting-room UI for a lobby that hasn't started yet.
 *
 * - Subscribes to real-time player join/leave via `usePlayers`.
 * - Host sees "START GAME" button; non-hosts see a waiting indicator.
 * - All players can open the reel-import flow via "IMPORT REELS".
 */
export function LobbyRoom({ lobby, currentPlayerId, onImport }: LobbyRoomProps) {
    const players   = usePlayers(lobby.id, lobby.players)
    const isHost    = lobby.hostId === currentPlayerId
    const [isPending, startTransition] = useTransition()
    const [error, setError]            = useState<string | null>(null)

    function handleStartGame() {
        setError(null)
        startTransition(async () => {
            const result = await startGameAction(lobby.id, currentPlayerId)
            if (!result.ok) {
                const msg = 'message' in result.error ? result.error.message : 'Failed to start game'
                setError(msg)
            }
            // Navigation happens via Realtime lobby-status update in LobbyPageClient
        })
    }

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 pb-safe">
            {/* Header */}
            <div className="text-center pt-2">
                <h1 className="text-5xl font-black uppercase tracking-tight text-[var(--color-accent)]">
                    🎮 WAITING ROOM
                </h1>
                <p className="text-[var(--color-muted)] mt-1 text-sm">Share the code — friends join instantly</p>
            </div>

            <ShareCode code={lobby.id} />

            {/* Players */}
            <div className="w-full">
                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-subtle)] mb-2 px-1">
                    👥 Players ({players.length})
                </h2>
                <div className="flex flex-col gap-2">
                    {players.map((player) => (
                        <PlayerCard key={player.id} player={player} isHost={player.id === lobby.hostId} />
                    ))}
                </div>
                {players.length < 2 && (
                    <p className="text-[var(--color-faint)] text-sm text-center mt-3 italic">
                        Waiting for more players to join…
                    </p>
                )}
            </div>

            {/* Import Reels */}
            <Card className="w-full p-4 text-center">
                <p className="text-base font-black text-[var(--color-foreground)] uppercase mb-0.5">📱 Import Your Reels</p>
                <p className="text-xs text-[var(--color-muted)] mb-3">
                    Upload your Instagram likes export — the game uses your Reels
                </p>
                <Button variant="secondary" size="sm" fullWidth onClick={() => onImport?.()}>
                    📋 IMPORT REELS
                </Button>
            </Card>

            {/* Start Game — host only */}
            {isHost && (
                <div className="w-full">
                    <Button
                        size="lg"
                        fullWidth
                        onClick={handleStartGame}
                        disabled={isPending || players.length < 2}
                    >
                        {isPending ? '⏳ STARTING…' : '🚀 START GAME'}
                    </Button>
                    {players.length < 2 && (
                        <p className="text-[var(--color-subtle)] text-xs text-center mt-2">Need at least 2 players</p>
                    )}
                    <ErrorMessage message={error} className="mt-2" />
                </div>
            )}

            {!isHost && (
                <div className="flex items-center justify-center gap-2 py-2">
                    <span className="animate-pulse text-[var(--color-accent)]">⏳</span>
                    <p className="text-[var(--color-muted)] text-sm font-bold">Waiting for host to start…</p>
                </div>
            )}
        </div>
    )
}