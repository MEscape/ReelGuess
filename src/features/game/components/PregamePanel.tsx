'use client'

import { Button, Card, ErrorMessage } from '@/components/ui'
import { PlayerAvatar }   from '@/features/player/components/PlayerAvatar'
import type { Lobby }     from '@/features/lobby/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PregamePanelProps = {
    lobby:           Lobby
    currentPlayerId: string
    isHost:          boolean
    isPending:       boolean
    error:           string | null
    onStart:         () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-game waiting screen shown before the first round starts.
 *
 * Displays the full player list. The host sees the "START GAME" button;
 * non-hosts see a waiting indicator.
 */
export function PregamePanel({
                                 lobby,
                                 currentPlayerId,
                                 isHost,
                                 isPending,
                                 error,
                                 onStart,
                             }: PregamePanelProps) {
    return (
        <div className="w-full space-y-5">
            {/* Player list */}
            <Card className="p-4">
                <h3 className="text-sm font-black uppercase text-[var(--color-muted)] mb-3">
                    👥 Players ({lobby.players.length})
                </h3>
                <div className="flex flex-col gap-2">
                    {lobby.players.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 py-1">
                            <PlayerAvatar seed={p.avatarSeed} size={32} />
                            <span className="font-bold text-[var(--color-foreground)] text-sm">{p.displayName}</span>
                            {p.id === lobby.hostId && (
                                <span className="ml-auto badge-accent badge text-xs">HOST</span>
                            )}
                            {p.id === currentPlayerId && p.id !== lobby.hostId && (
                                <span className="ml-auto badge-muted badge text-xs">YOU</span>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Host controls / waiting message */}
            {isHost ? (
                <>
                    <Button size="lg" fullWidth onClick={onStart} disabled={isPending}>
                        {isPending ? '⏳ STARTING…' : '▶️ START GAME'}
                    </Button>
                    <ErrorMessage message={error} />
                </>
            ) : (
                <div className="flex items-center justify-center gap-2 py-4">
                    <span className="animate-pulse text-[var(--color-accent)] text-lg">⏳</span>
                    <p className="text-[var(--color-muted)] text-sm font-bold">
                        Waiting for host to start the game…
                    </p>
                </div>
            )}
        </div>
    )
}