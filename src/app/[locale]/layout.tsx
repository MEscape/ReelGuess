import type { Metadata }        from 'next'
import { Inter, Bebas_Neue }    from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { QueryProvider }        from '@/lib/providers/query-provider'
import { locales, type Locale } from '@/i18n/config'
import { notFound }             from 'next/navigation'
import React                    from 'react'
import {CookieBanner, CookieConsentProvider, ConsentGatedAnalytics, ConsentGatedSentry} from '@/features/legal'
import { ConsentGatedAds, AdBlockGuard } from '@/features/ads'
import { Footer }               from '@/components/ui/footer'
import '../globals.css'

// ─────────────────────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────────────────────

const inter = Inter({
    variable:            '--font-inter',
    subsets:             ['latin'],
    display:             'swap',
    preload:             true,
    adjustFontFallback:  true,
})

const bebasNeue = Bebas_Neue({
    variable: '--font-bebas-neue',
    weight:   '400',
    subsets:  ['latin'],
    display:  'swap',
    preload:  true,
})

// ─────────────────────────────────────────────────────────────────────────────
// Static params — pre-render locale shells at build time
// ─────────────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata — generated per locale
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'seo.home' })

    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const ogLocale   = locale === 'de' ? 'de_DE' : 'en_US'
    const altLocale  = locale === 'de' ? 'en_US' : 'de_DE'
    const canonicalPath = locale === 'en' ? '' : `/${locale}`

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default:  t('title'),
            template: `%s — ReelGuess`,
        },
        description: t('description'),
        keywords: [
            'party game', 'social game', 'guess who liked', 'instagram reels',
            'multiplayer', 'online party game', 'friend quiz', 'viral social game',
            'Partyspiel', 'soziales Spiel', 'Instagram Reel raten',
            'WhoLiked', 'reel quiz', 'gruppe', 'Freunde',
        ],
        authors:  [{ name: 'ReelGuess' }],
        creator:  'ReelGuess',
        category: 'game',
        robots: {
            index:  true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
        alternates: {
            canonical: `${baseUrl}${canonicalPath}`,
            languages: {
                'en':        `${baseUrl}/`,
                'de':        `${baseUrl}/de`,
                'x-default': `${baseUrl}/`,
            },
        },
        openGraph: {
            type:        'website',
            locale:      ogLocale,
            alternateLocale: [altLocale],
            url:         `${baseUrl}${canonicalPath}`,
            siteName:    'ReelGuess',
            title:       t('title'),
            description: t('description'),
            images: [
                {
                    url:    `${baseUrl}/api/og?locale=${locale}`,
                    width:  1200,
                    height: 630,
                    alt:    t('title'),
                    type:   'image/png',
                },
            ],
        },
        appleWebApp: {
            capable:    true,
            title:      'ReelGuess',
            statusBarStyle: 'black-translucent',
        },
        formatDetection: {
            telephone: false,
        },
        icons: {
            icon:             '/favicon.ico',
            shortcut:         '/favicon.ico',
            apple:            '/apple-touch-icon.png',
            other: [
                { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
            ],
        },
        // AdSense site-verification — required before Google approves the site
        ...(process.env.NEXT_PUBLIC_ADSENSE_ID ? {
            other: {
                'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_ID,
            },
        } : {}),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    children: React.ReactNode
    params:   Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params

    // Validate locale
    if (!locales.includes(locale as Locale)) notFound()

    // Load messages for this locale (passed to client via NextIntlClientProvider)
    const messages = await getMessages()

    return (
        <html lang={locale} className="dark">
            <body className={`${inter.variable} ${bebasNeue.variable} antialiased`}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <CookieConsentProvider>
                        {/* site-shell: flex column, min-h-dvh so footer sticks to bottom */}
                        <div className="site-shell">
                            {/* site-content: flex:1 so it fills all space above the footer */}
                            <div className="site-content">
                                <QueryProvider>
                                    <AdBlockGuard>
                                        {children}
                                    </AdBlockGuard>
                                </QueryProvider>
                            </div>
                            <Footer locale={locale} />
                        </div>
                        <CookieBanner />
                        <ConsentGatedAnalytics />
                        <ConsentGatedSentry />
                        <ConsentGatedAds />
                    </CookieConsentProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
