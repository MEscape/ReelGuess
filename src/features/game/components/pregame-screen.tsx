'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button, Card, ErrorMessage, Badge } from '@/components/ui'
import { PlayerAvatar } from '@/features/player'
import { useGameSession, useGameRound } from '../game-context'
import { BannerAd } from '@/features/ads'
import type { Lobby } from '@/features/lobby'

type PregamePanelProps = { lobby: Lobby }

export function PregameScreen({ lobby }: PregamePanelProps) {
    const { currentPlayerId, isHost, settings } = useGameSession()
    const { isStartPending, startError, onStartNextRound } = useGameRound()
    const t = useTranslations('game')
    const tLobby = useTranslations('lobby')

    const playerCount = lobby.players.length

    const settings2Col = [
        { label: t('settingRounds'), value: settings.roundsCount },
        { label: t('settingTimer'), value: `${settings.timerSeconds}s` },
    ]

    return (
        <div className="w-full space-y-4">

            {/* ── Lobby status strip ── */}
            <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                    background: 'var(--color-surface)',
                    border: '2px solid var(--color-border-subtle)',
                    borderLeft: '4px solid var(--color-accent)',
                    boxShadow: 'var(--shadow-brutal)',
                }}
            >
                <div className="flex items-center gap-3">
                    <span
                        className="font-display uppercase"
                        style={{ fontSize: 'var(--text-label-sm)', letterSpacing: 'var(--tracking-label)', color: 'var(--color-muted)' }}
                    >
                        {tLobby('title').toUpperCase()}
                    </span>
                    <span
                        className="font-display"
                        style={{ fontSize: 'var(--text-title-sm)', letterSpacing: '0.25em', color: 'var(--color-accent)' }}
                    >
                        {lobby.id}
                    </span>
                </div>
                <Badge variant="muted" size="lg">{tLobby('playerCount', { count: playerCount })}</Badge>
            </div>

            {/* ── Player roster ── */}
            <Card variant="brutal" stripe className="overflow-hidden">
                <div
                    className="px-4 py-2.5 flex items-center gap-2"
                    style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-raised)' }}
                >
                    <span
                        className="font-display uppercase"
                        style={{ fontSize: 'var(--text-label-sm)', letterSpacing: 'var(--tracking-label)', color: 'var(--color-muted)' }}
                    >
                        {tLobby('players').toUpperCase()}
                    </span>
                    <span className="font-display" style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-accent)' }}>
                        {playerCount}
                    </span>
                </div>

                <div>
                    {lobby.players.map((p, i) => {
                        const isCurrentPlayer = p.id === currentPlayerId
                        const isLobbyHost = p.id === lobby.hostId

                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06, ease: 'easeOut' }}
                                className="player-row"
                                style={
                                    isCurrentPlayer
                                        ? { background: 'rgba(245,200,0,0.04)', borderLeftColor: 'var(--color-accent)', borderLeftWidth: '3px', borderLeftStyle: 'solid' }
                                        : undefined
                                }
                            >
                                <span
                                    className="font-display shrink-0 tabular-nums"
                                    style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-subtle)', width: '1.25rem', textAlign: 'right' }}
                                >
                                    {i + 1}
                                </span>

                                <PlayerAvatar seed={p.avatarSeed} size={36} />

                                <span
                                    className="flex-1 min-w-0 font-display uppercase truncate"
                                    style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: isCurrentPlayer ? 'var(--color-accent)' : 'var(--color-foreground)' }}
                                >
                                    {p.displayName}
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isLobbyHost && <Badge variant="accent" size="sm">{tLobby('hostLabel').toUpperCase()}</Badge>}
                                    {isCurrentPlayer && !isLobbyHost && <Badge variant="muted" size="sm">{tLobby('youLabel').toUpperCase()}</Badge>}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </Card>

            {/* ── Game settings strip ── */}
            <div className="grid grid-cols-2 gap-2">
                {settings2Col.map(({ label, value }) => (
                    <div
                        key={label}
                        className="flex flex-col items-center justify-center py-3 gap-1"
                        style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-brutal-xs)' }}
                    >
                        <span
                            className="font-display uppercase"
                            style={{ fontSize: 'var(--text-label-xs)', letterSpacing: 'var(--tracking-loose)', color: 'var(--color-muted)' }}
                        >
                            {label}
                        </span>
                        <span
                            className="font-display"
                            style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-foreground)', lineHeight: 1 }}
                        >
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── CTA ── */}
            {isHost ? (
                <div className="space-y-3 pt-1">
                    <Button
                        size="lg"
                        fullWidth
                        onClick={onStartNextRound}
                        loading={isStartPending}
                        disabled={playerCount < 2}
                    >
                        {isStartPending ? `${t('starting').toUpperCase()}` : `▶ ${t('phase.pregame').toUpperCase()}`}
                    </Button>

                    {playerCount < 2 && (
                        <p
                            className="text-center font-display uppercase"
                            style={{ fontSize: 'var(--text-label-sm)', letterSpacing: 'var(--tracking-label)', color: 'var(--color-muted)' }}
                        >
                            {tLobby('minPlayers')}
                        </p>
                    )}

                    <ErrorMessage message={startError} />
                </div>
            ) : (
                <div
                    className="flex items-center justify-center gap-3 py-5"
                    style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border-subtle)' }}
                >
                    <span className="status-dot status-dot-warn" style={{ width: '0.6rem', height: '0.6rem' }} />
                    <span
                        className="font-display uppercase"
                        style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-muted)' }}
                    >
                        {t('waitingForHost')}
                    </span>
                </div>
            )}

            {/* ── Lobby waiting banner ad (non-intrusive, space always reserved) ── */}
            <BannerAd placement="banner-lobby" />
        </div>
    )
}