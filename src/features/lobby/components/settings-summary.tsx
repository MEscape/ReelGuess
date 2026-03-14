'use client'

import { useTranslations }  from 'next-intl'
import { SETTINGS_CONFIG }  from '../constants'
import type { GameSettings } from '../types'

type SettingsSummaryProps = { settings: GameSettings }

export function SettingsSummary({ settings }: SettingsSummaryProps) {
    const t = useTranslations('lobby')

    return (
        <div className="w-full card-brutal overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b-2 border-[var(--color-border)]">
                <span className="input-label" style={{ marginBottom: 0 }}>
                    {t('settings.title')}
                </span>
            </div>

            <div className="flex divide-x-2 divide-[var(--color-border)]">
                {SETTINGS_CONFIG.map((cfg) => (
                    <div key={cfg.key} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-2">
                        <span
                            className="font-display leading-none text-[var(--color-accent)]"
                            style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)' }}
                        >
                            {settings[cfg.key]}{cfg.unit}
                        </span>
                        <span
                            className="font-sans text-[var(--color-muted)] uppercase"
                            style={{ fontSize: 'var(--text-label-xs)', letterSpacing: 'var(--tracking-label)' }}
                        >
                            {cfg.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
