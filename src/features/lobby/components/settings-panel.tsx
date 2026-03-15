'use client'

import { useState, useEffect }     from 'react'
import { useTranslations }         from 'next-intl'
import { ErrorMessage }            from '@/components/ui'
import { cn }                      from '@/lib/utils/cn'
import { SETTINGS_CONFIG }         from '../constants'
import { useUpdateSettings }       from '../hooks/use-lobby'
import type { GameSettings }       from '../types'

type SettingsPanelProps = {
    lobbyCode:    string
    hostPlayerId: string
    settings:     GameSettings
}

export function SettingsPanel({ lobbyCode, hostPlayerId, settings }: SettingsPanelProps) {
    const [local, setLocal] = useState({
        roundsCount:  settings.roundsCount,
        timerSeconds: settings.timerSeconds,
    })
    const t = useTranslations('lobby')

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocal({ roundsCount: settings.roundsCount, timerSeconds: settings.timerSeconds })
    }, [settings.roundsCount, settings.timerSeconds])

    const { updateSettings, isPending, error } = useUpdateSettings(lobbyCode, hostPlayerId)

    function handleSelect(key: 'roundsCount' | 'timerSeconds', value: number) {
        const next = { ...local, [key]: value }
        setLocal(next)
        updateSettings(next)
    }

    return (
        <div className="w-full card-brutal overflow-hidden">

            <div className="h-[3px] bg-[var(--color-accent)] w-full" aria-hidden />

            <div className="px-4 py-3 border-b-2 border-[var(--color-border)] flex items-center justify-between">
                <span
                    className="font-display uppercase leading-none text-[var(--color-foreground)]"
                    style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)' }}
                >
                    {t('settings.title')}
                </span>

                {isPending && (
                    <span className="font-sans text-[var(--color-muted)]" style={{ fontSize: 'var(--text-body-sm)' }}>
                        {t('settings.saving')}
                    </span>
                )}
            </div>

            <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {SETTINGS_CONFIG.map((cfg) => {
                    const activeValue = local[cfg.key]
                    // Map config key to translation key
                    const labelKey = cfg.key === 'roundsCount' ? 'settings.rounds' : 'settings.timePerRound'
                    const label    = t(labelKey)

                    return (
                        <div key={cfg.key} className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="input-label" style={{ marginBottom: 0 }}>
                                    {label}
                                </span>
                                <span
                                    className="font-display text-[var(--color-accent)] leading-none"
                                    style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)' }}
                                >
                                    {activeValue}{cfg.unit}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
                                {cfg.options.map((opt) => {
                                    const isActive = opt === activeValue
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => handleSelect(cfg.key, opt)}
                                            aria-pressed={isActive}
                                            className={cn(
                                                'btn btn-xs',
                                                isActive ? 'btn-primary' : 'btn-ghost',
                                                isPending && !isActive && 'opacity-50',
                                            )}
                                        >
                                            {opt}{cfg.unit}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {error && (
                <div className="px-4 pb-3">
                    <ErrorMessage message={error} />
                </div>
            )}
        </div>
    )
}
