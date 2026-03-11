'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter }                   from 'next/navigation'
import { LobbyRoom }                   from '@/features/lobby/components/LobbyRoom'
import { ImportFlow }                  from '@/features/reel-import/components/ImportFlow'
import { Button }                      from '@/components/ui'
import { createClient }                from '@/lib/supabase/client'
import { usePlayerStore }              from '@/features/player/stores/player-store'
import type { Lobby }                  from '@/features/lobby/types'

type Props = {
    lobby:      Lobby
    showImport: boolean
}

/**
 * Client wrapper for the lobby page.
 *
 * Handles:
 * - Player identity check (redirect to home if not in lobby).
 * - Realtime lobby-status subscription → navigates to game when host starts.
 * - Import-flow toggle.
 */
export function LobbyPageClient({ lobby, showImport: initialShowImport }: Props) {
    const [showImport, setShowImport] = useState(initialShowImport)
    const getPlayerId  = usePlayerStore((s) => s.getPlayerId)
    const [playerId]   = useState<string | null>(() => getPlayerId(lobby.id))
    const router       = useRouter()
    const didRedirect  = useRef(false)

    // Listen for lobby status → 'playing' and redirect all clients to the game
    useEffect(() => {
        const supabase = createClient()
        const channel  = supabase
            .channel(`lobby-status:${lobby.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobby.id}` },
                (payload) => {
                    const status = (payload.new as { status: string }).status
                    if (status === 'playing' && !didRedirect.current) {
                        didRedirect.current = true
                        router.push(`/game/${lobby.id}`)
                    }
                },
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [lobby.id, router])

    if (!playerId) {
        return (
            <div className="min-h-dvh flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-black text-[var(--color-accent)] uppercase mb-2">Not in this lobby</h2>
                    <p className="text-[var(--color-muted)] mb-4">Join this lobby from the homepage first!</p>
                    <Button size="sm" onClick={() => router.push('/')}>← GO HOME</Button>
                </div>
            </div>
        )
    }

    if (showImport) {
        return (
            <div className="min-h-dvh py-8">
                <ImportFlow
                    lobbyId={lobby.id}
                    playerId={playerId}
                    onComplete={() => { router.refresh(); setShowImport(false) }}
                />
            </div>
        )
    }

    return (
        <div className="min-h-dvh py-8">
            <LobbyRoom
                lobby={lobby}
                currentPlayerId={playerId}
                onImport={() => setShowImport(true)}
            />
        </div>
    )
}