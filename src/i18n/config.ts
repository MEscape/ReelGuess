// ─────────────────────────────────────────────────────────────────────────────
// i18n Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** Human-readable locale names for UI language switchers */
export const localeNames: Record<Locale, string> = {
    en: 'English',
    de: 'Deutsch',
}

