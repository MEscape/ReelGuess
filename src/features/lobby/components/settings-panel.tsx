'use client'

import { useState, useEffect }     from 'react'
import { ErrorMessage }            from '@/components/ui'
import { cn }                      from '@/lib/utils/cn'
import { SETTINGS_CONFIG }         from '../constants'
import { useUpdateSettings }       from '../hooks/use-lobby'
import type { GameSettings }       from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SettingsPanelProps = {
    lobbyCode:    string
    hostPlayerId: string
    /** Current persisted settings — used to initialise local state. */
    settings:     GameSettings
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Host-only settings panel rendered inside the Lobby waiting room.
 *
 * Each setting is driven by `SETTINGS_CONFIG` — adding a new option there
 * automatically creates a new row here without touching this component.
 *
 * Interaction model:
 *  - Preset chips: tap to select, triggers an optimistic server update.
 *  - Active chip: accent border + yellow text.
 *  - Pending: chips are dimmed while a request is in-flight.
 */
export function SettingsPanel({ lobbyCode, hostPlayerId, settings }: SettingsPanelProps) {
    // Local optimistic state — mirrors the server values
    const [local, setLocal] = useState({
        roundsCount:  settings.roundsCount,
        timerSeconds: settings.timerSeconds,
    })

    // Keep local state in sync when the parent receives a Realtime update
    // (e.g. the host opens two tabs, or the server confirms a value change).
    useEffect(() => {
        setLocal({
            roundsCount:  settings.roundsCount,
            timerSeconds: settings.timerSeconds,
        })
    }, [settings.roundsCount, settings.timerSeconds])

    const { updateSettings, isPending, error } = useUpdateSettings(lobbyCode, hostPlayerId)

    function handleSelect(key: 'roundsCount' | 'timerSeconds', value: number) {
        // Optimistic update
        const next = { ...local, [key]: value }
        setLocal(next)
        updateSettings(next)
    }

    return (
        <div className="w-full card-brutal overflow-hidden">

            {/* Section header — accent stripe + title */}
            <div className="h-[3px] bg-[var(--color-accent)] w-full" aria-hidden />

            <div className="px-4 py-3 border-b-2 border-[var(--color-border)] flex items-center justify-between">
                <span
                    className="font-display uppercase leading-none text-[var(--color-foreground)]"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                    }}
                >
                    Game Settings
                </span>

                {isPending && (
                    <span
                        className="font-sans text-[var(--color-muted)]"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        Saving…
                    </span>
                )}
            </div>

            {/* Setting rows — one per SETTINGS_CONFIG entry */}
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {SETTINGS_CONFIG.map((cfg) => {
                    const activeValue = local[cfg.key]

                    return (
                        <div key={cfg.key} className="px-4 py-3 flex flex-col gap-2">

                            {/* Row label + current value */}
                            <div className="flex items-center justify-between">
                                <span
                                    className="input-label"
                                    style={{ marginBottom: 0 }}
                                >
                                    {cfg.label}
                                </span>
                                <span
                                    className="font-display text-[var(--color-accent)] leading-none"
                                    style={{
                                        fontSize:      'var(--text-title-sm)',
                                        letterSpacing: 'var(--tracking-display)',
                                    }}
                                >
                                    {activeValue}{cfg.unit}
                                </span>
                            </div>

                            {/* Preset option chips */}
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label={`${cfg.label} options`}
                            >
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

            {/* Error feedback */}
            {error && (
                <div className="px-4 pb-3">
                    <ErrorMessage message={error} />
                </div>
            )}
        </div>
    )
}

