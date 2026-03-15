'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter }        from 'next/navigation'
import { useTranslations }  from 'next-intl'
import { LobbyRoom }        from '@/features/lobby'
import { PageLoader }       from '@/components/ui'
import { NotMemberScreen }  from '@/features/home'
import { createClient }     from '@/lib/supabase/client'
import { usePlayerStore }   from '@/features/player'
import type { Lobby, GameSettings } from '@/features/lobby'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Props = { lobby: Lobby }

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hydration wrapper for the lobby page.
 *
 * Three explicit states for `identity`:
 *  - `'loading'`    — SSR / first render, sessionStorage not yet read.
 *  - `'not-member'` — sessionStorage was read, no entry for this lobby.
 *  - string (UUID)  — player is in this lobby.
 *
 * Previously `null` was used for both loading AND not-member, causing the
 * loading spinner to show forever when a user navigated to a lobby they
 * hadn't joined (sessionStorage had no entry → getPlayerId returns null →
 * never transitions out of the loading state).
 */
export function LobbyClient({ lobby }: Props) {
    const getPlayerId = usePlayerStore((s) => s.getPlayerId)
    const [identity, setIdentity] = useState<'loading' | 'not-member' | string>('loading')
    // Live settings state — updated by Realtime so all clients reflect host changes instantly.
    const [settings, setSettings] = useState<GameSettings>(lobby.settings)
    const settingsRef = useRef(lobby.settings)
    // Keep ref in sync with state so the Realtime closure always has the latest value.
    useLayoutEffect(() => { settingsRef.current = settings }, [settings])

    const router       = useRouter()
    // Keep router in a ref so the Realtime useEffect never needs to re-subscribe
    // when Next.js replaces the router object after a server action refresh.
    const routerRef    = useRef(router)
    useLayoutEffect(() => { routerRef.current = router }, [router])

    const didRedirect  = useRef(false)
    const identitySet  = useRef(false)

    // Populate identity once on mount. NEVER reset to 'loading' on re-render —
    // that would cause a flash to NotMemberScreen after every server-action refresh.
    useEffect(() => {
        if (identitySet.current) return
        identitySet.current = true
        const id = getPlayerId(lobby.id)
        setIdentity(id ?? 'not-member')
    }, [getPlayerId, lobby.id])

    // Subscribe to Supabase lobby updates.
    // Dependencies: only lobby.id — stable for the lifetime of this page.
    // routerRef is used instead of router to avoid re-subscribing on every
    // Next.js router object replacement after server-action refreshes.
    useEffect(() => {
        const supabase = createClient()
        const channel  = supabase
            .channel(`lobby-status:${lobby.id}`)
            .on(
                'postgres_changes',
                {
                    event:  'UPDATE',
                    schema: 'public',
                    table:  'lobbies',
                    filter: `id=eq.${lobby.id}`,
                },
                (payload) => {
                    const row = payload.new as { status?: string; settings?: Record<string, unknown> }

                    // Redirect on game start
                    if (row.status === 'playing' && !didRedirect.current) {
                        didRedirect.current = true
                        routerRef.current.push(`/game/${lobby.id}`)
                        return
                    }

                    // Live-update settings for all clients (host + guests)
                    if (row.settings) {
                        const s    = row.settings
                        const prev = settingsRef.current
                        setSettings({
                            roundsCount:  typeof s.rounds_count  === 'number' ? s.rounds_count  : prev.roundsCount,
                            timerSeconds: typeof s.timer_seconds === 'number' ? s.timer_seconds : prev.timerSeconds,
                            rematchId:    typeof s.rematch_id    === 'string' ? s.rematch_id    : prev.rematchId,
                        })
                    }
                },
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [lobby.id]) // ← router intentionally omitted — routerRef handles updates

    const t = useTranslations('lobby')

    // Loading — sessionStorage not yet read.
    if (identity === 'loading') {
        return <PageLoader emoji="🎮" label={t('loading')} />
    }

    // Not a member of this lobby.
    if (identity === 'not-member') {
        return (
            <NotMemberScreen
                title={t('notMemberTitle')}
                description={t('notMemberDescription')}
            />
        )
    }

    // In lobby — identity is the UUID string.
    return (
        <main className="min-h-dvh py-8 pb-safe">
            <LobbyRoom lobby={{ ...lobby, settings }} currentPlayerId={identity} />
        </main>
    )
}
