'use client'

import { useTranslations } from 'next-intl'

export function ReelsRequiredHint() {
    const t = useTranslations('home')
    return (
        <p
            className="flex items-center justify-center gap-1.5 font-sans text-[var(--color-subtle)]"
            style={{ fontSize: 'var(--text-body-sm)' }}
        >
            <span className="text-[var(--color-warning)]" aria-hidden>↓</span>
            {t('reelsRequired')}
        </p>
    )
}

