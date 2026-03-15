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

type Props = { lobby: Lobby }

/**
 * Hydration wrapper for the lobby page.
 *
 * Identity is resolved SYNCHRONOUSLY in the useState initialiser so that
 * after a Next.js App Router soft-refresh (triggered by a server action like
 * updateLobbySettings), the component immediately renders with the correct
 * identity instead of flashing through 'loading' → 'not-member'.
 *
 * The async useEffect guard (`identitySet`) is kept only as a fallback for
 * environments where sessionStorage isn't available on the first synchronous
 * read (e.g. very early hydration on some browsers).
 */
export function LobbyClient({ lobby }: Props) {
    const getPlayerId = usePlayerStore((s) => s.getPlayerId)

    // ── Synchronous identity resolution ──────────────────────────────────────
    // Runs once per mount inside useState initialiser — BEFORE the first render.
    // This prevents the flash through 'loading' → 'not-member' that happens
    // when Next.js re-mounts the client component after a server action refresh.
    const [identity, setIdentity] = useState<'loading' | 'not-member' | string>(() => {
        if (typeof window === 'undefined') return 'loading'
        const id = getPlayerId(lobby.id)
        // If store hasn't rehydrated yet, id may be null even for valid members.
        // Return 'loading' instead of 'not-member' so the async effect can verify.
        return id ?? 'loading'
    })

    const [settings, setSettings] = useState<GameSettings>(lobby.settings)
    const settingsRef = useRef(lobby.settings)
    useLayoutEffect(() => { settingsRef.current = settings }, [settings])

    const router       = useRouter()
    const routerRef    = useRef(router)
    useLayoutEffect(() => { routerRef.current = router }, [router])

    const didRedirect  = useRef(false)

    // Fallback async read — only fires if the synchronous read returned 'loading'
    useEffect(() => {
        if (identity !== 'loading') return
        const id = getPlayerId(lobby.id)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIdentity(id ?? 'not-member')
    }, [getPlayerId, lobby.id, identity])

    // If the game has already started AND this user is a member, redirect them
    // straight to the game page — visiting the lobby URL would be a stale state.
    useEffect(() => {
        if (
            lobby.status === 'playing' &&
            identity !== 'loading' &&
            identity !== 'not-member' &&
            !didRedirect.current
        ) {
            didRedirect.current = true
            router.replace(`/game/${lobby.id}`)
        }
    }, [lobby.status, identity, router, lobby.id])

    // Subscribe to Supabase lobby updates.
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

                    if (row.status === 'playing' && !didRedirect.current) {
                        didRedirect.current = true
                        routerRef.current.push(`/game/${lobby.id}`)
                        return
                    }

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
    }, [lobby.id])

    const t = useTranslations('lobby')

    if (identity === 'loading') {
        return <PageLoader emoji="🎮" label={t('loading')} />
    }

    if (identity === 'not-member') {
        return (
            <NotMemberScreen
                title={t('notMemberTitle')}
                description={t('notMemberDescription')}
            />
        )
    }

    return (
        <main className="game-page-main">
            <LobbyRoom lobby={{ ...lobby, settings }} currentPlayerId={identity} />
        </main>
    )
}
