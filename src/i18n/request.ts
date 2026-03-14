import { getRequestConfig } from 'next-intl/server'
import { notFound }         from 'next/navigation'
import { locales, type Locale } from './config'

// ─────────────────────────────────────────────────────────────────────────────
// next-intl server-side request configuration
// ─────────────────────────────────────────────────────────────────────────────

export default getRequestConfig(async ({ requestLocale }) => {
    // Validate that the incoming locale is one of our supported locales
    const locale = await requestLocale as Locale
    if (!locales.includes(locale)) notFound()

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    }
})

