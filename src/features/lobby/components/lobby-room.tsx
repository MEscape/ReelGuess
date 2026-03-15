'use client'

import { useTranslations }     from 'next-intl'
import { Button, ErrorMessage } from '@/components/ui'
import { usePlayers }          from '@/features/player'
import { useStartGame }         from '../hooks/use-lobby'
import { PlayerCard }           from './player-card'
import { ShareCode }            from './share-code'
import { SettingsPanel }        from './settings-panel'
import { SettingsSummary }      from './settings-summary'
import { BannerAd }             from '@/features/ads'
import { cn }                   from '@/lib/utils/cn'
import type { Lobby }           from '../types'

type LobbyRoomProps = {
    lobby:           Lobby
    currentPlayerId: string
}

export function LobbyRoom({ lobby, currentPlayerId }: LobbyRoomProps) {
    const players    = usePlayers(lobby.id, lobby.players)
    const isHost     = lobby.hostId === currentPlayerId
    const hasEnough  = players.length >= 2
    const t          = useTranslations('lobby')

    const { startGame, isPending, error } = useStartGame(lobby.id, currentPlayerId)

    return (
        <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto px-4 pb-8">

            {/* ── ZONE 1: Header ── */}
            <div className="text-center pt-4 w-full">
                <h1
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{
                        fontSize:      'clamp(2rem, 10vw, 3.5rem)',
                        letterSpacing: 'var(--tracking-display)',
                        textShadow:    '0 0 20px rgba(245,200,0,0.4), 0 0 60px rgba(245,200,0,0.15)',
                    }}
                >
                    {t('title')}
                </h1>
                <p
                    className="font-sans text-[var(--color-muted)] mt-2"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    {t('shareCode')}
                </p>
            </div>

            {/* ── ZONE 2: Share code ── */}
            <div className="w-full">
                <ShareCode code={lobby.id} />
            </div>

            {/* ── ZONE 3: Settings ── */}
            <div className="w-full">
                {isHost ? (
                    <SettingsPanel
                        lobbyCode={lobby.id}
                        hostPlayerId={currentPlayerId}
                        settings={lobby.settings}
                    />
                ) : (
                    <SettingsSummary settings={lobby.settings} />
                )}
            </div>

            {/* ── ZONE 3b: Lobby waiting banner ad ── */}
            <div className="w-full">
                <BannerAd placement="banner-lobby" />
            </div>

            {/* ── ZONE 4: Players ── */}
            <div className="w-full card-brutal overflow-hidden">

                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        <span className="input-label" style={{ marginBottom: 0 }}>{t('players')}</span>
                        <span className="badge badge-muted">{players.length}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className={cn(
                            'status-dot',
                            hasEnough ? 'status-dot-live' : 'status-dot-idle',
                        )} />
                        <span
                            className="font-sans text-[var(--color-muted)]"
                            style={{ fontSize: 'var(--text-body-sm)' }}
                        >
                            {hasEnough ? t('waiting').replace('…', '') : t('minPlayers')}
                        </span>
                    </div>
                </div>

                {/* Player rows */}
                <div className="flex flex-col divide-y divide-[var(--color-border)]">
                    {players.map((player) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            isHost={player.id === lobby.hostId}
                            isYou={player.id === currentPlayerId}
                        />
                    ))}
                </div>

                {/* Waiting for more players */}
                {!hasEnough && (
                    <div className="flex items-center justify-center gap-2 px-4 py-4 border-t border-dashed border-[var(--color-border-subtle)]">
                        <span
                            className="status-dot status-dot-idle"
                            style={{ animation: 'brutal-pulse 1.5s ease-in-out infinite' }}
                            aria-hidden
                        />
                        <p
                            className="font-sans text-[var(--color-subtle)]"
                            style={{ fontSize: 'var(--text-body-sm)' }}
                        >
                            {t('waiting')}
                        </p>
                    </div>
                )}
            </div>

            {/* ── ZONE 5: Action ── */}
            {isHost ? (
                <div className="w-full flex flex-col gap-3">
                    <Button
                        size="lg"
                        fullWidth
                        loading={isPending}
                        disabled={!hasEnough || isPending}
                        onClick={startGame}
                    >
                        🚀 {t('startGame')}
                    </Button>

                    {!hasEnough && (
                        <p
                            className="text-center font-sans text-[var(--color-subtle)]"
                            style={{ fontSize: 'var(--text-body-sm)' }}
                        >
                            {t('minPlayers')}
                        </p>
                    )}

                    <ErrorMessage message={error} />
                </div>
            ) : (
                <div className="w-full card-brutal overflow-hidden">
                    <div className="h-[3px] bg-[var(--color-border-strong)]" aria-hidden />
                    <div className="flex items-center justify-center gap-3 px-4 py-4">
                        <span
                            className="status-dot status-dot-warn"
                            style={{ animation: 'brutal-pulse 1.2s ease-in-out infinite' }}
                            aria-hidden
                        />
                        <p className="font-sans text-[var(--color-muted)]" style={{ fontSize: 'var(--text-body)' }}>
                            {t('waitingForHost')}
                        </p>
                    </div>
                </div>
            )}

        </div>
    )
}
