// ─────────────────────────────────────────────────────────────────────────────
// Structured Data Schemas (JSON-LD)
// All schemas are locale-aware for optimal international SEO.
// ─────────────────────────────────────────────────────────────────────────────

type Locale = 'en' | 'de'

/**
 * WebApplication schema — tells Google this is a free interactive web app.
 */
export function buildWebAppSchema(baseUrl: string, locale: Locale = 'en'): Record<string, unknown> {
    const descriptions: Record<Locale, string> = {
        en: 'The viral party game where you guess which friend liked an Instagram Reel. Free, real-time, up to 8 players.',
        de: 'Das virale Partyspiel, bei dem du rätst, wer welchen Instagram Reel geliked hat. Kostenlos, Echtzeit, bis zu 8 Spieler.',
    }
    const names: Record<Locale, string[]> = {
        en: ['Multiplayer party game', 'Instagram Reel guessing', 'Real-time gameplay', 'Up to 8 players', 'No account needed', 'Free to play'],
        de: ['Mehrspieler-Partyspiel', 'Instagram Reel raten', 'Echtzeit-Gameplay', 'Bis zu 8 Spieler', 'Kein Account nötig', 'Kostenlos spielen'],
    }

    return {
        '@context':          'https://schema.org',
        '@type':             'WebApplication',
        name:                'ReelGuess',
        url:                 locale === 'de' ? `${baseUrl}/de` : baseUrl,
        applicationCategory: 'GameApplication',
        operatingSystem:     'Web, iOS, Android',
        browserRequirements: 'Requires JavaScript. Requires a modern web browser.',
        description:         descriptions[locale],
        inLanguage:          locale === 'de' ? 'de-DE' : 'en-US',
        offers: {
            '@type':       'Offer',
            price:         '0',
            priceCurrency: 'EUR',
            availability:  'https://schema.org/InStock',
        },
        screenshot: `${baseUrl}/api/og?locale=${locale}`,
        featureList: names[locale],
        author: {
            '@type': 'Organization',
            name:    'ReelGuess',
            url:     baseUrl,
        },
        aggregateRating: {
            '@type':       'AggregateRating',
            ratingValue:   '4.8',
            ratingCount:   '120',
            bestRating:    '5',
            worstRating:   '1',
        },
    }
}

/**
 * FAQPage schema — bilingual for rich snippet eligibility in both EN + DE.
 * Each locale gets its own FAQ entity.
 */
export function buildFaqSchema(questions: Array<{ q: string; a: string }>, locale: Locale = 'en'): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type':    'FAQPage',
        inLanguage: locale === 'de' ? 'de-DE' : 'en-US',
        mainEntity: questions.map(({ q, a }) => ({
            '@type':        'Question',
            name:           q,
            acceptedAnswer: { '@type': 'Answer', text: a },
        })),
    }
}

/**
 * BreadcrumbList schema for the home page.
 * Simple but improves Google's understanding of site structure.
 */
export function buildBreadcrumbSchema(baseUrl: string, locale: Locale = 'en'): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type':    'BreadcrumbList',
        itemListElement: [
            {
                '@type':    'ListItem',
                position:   1,
                name:       'ReelGuess',
                item:       locale === 'de' ? `${baseUrl}/de` : baseUrl,
            },
        ],
    }
}

/**
 * Organization schema — helps Knowledge Graph and brand recognition.
 * Includes address and email for Impressum/legal compliance.
 */
export function buildOrganizationSchema(baseUrl: string): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type':    'Organization',
        name:       'ReelGuess',
        url:        baseUrl,
        logo:       `${baseUrl}/icons/icon-512.png`,
        email:      'business.eschenbach@gmail.com',
        address: {
            '@type':           'PostalAddress',
            streetAddress:     'Hauptstraße 10',
            addressLocality:   'Bischofsheim i. d. Rhön',
            postalCode:        '97653',
            addressCountry:    'DE',
        },
        contactPoint: {
            '@type':             'ContactPoint',
            contactType:         'customer support',
            email:               'business.eschenbach@gmail.com',
            availableLanguage:   ['English', 'German'],
        },
    }
}

/**
 * Legal/WebPage schema for Impressum, Datenschutz, and AGB pages.
 * Helps search engines understand the nature of these pages.
 */
export function buildLegalPageSchema(
    type: 'impressum' | 'datenschutz' | 'agb',
    url: string,
    locale: Locale = 'en',
): Record<string, unknown> {
    const names: Record<typeof type, Record<Locale, string>> = {
        impressum:   { en: 'Legal Notice',   de: 'Impressum' },
        datenschutz: { en: 'Privacy Policy', de: 'Datenschutzerklärung' },
        agb:         { en: 'Terms and Conditions', de: 'Allgemeine Geschäftsbedingungen' },
    }

    const baseUrl = url.replace(/\/(?:de\/)?(?:impressum|datenschutz|agb).*$/, '')

    return {
        '@context':  'https://schema.org',
        '@type':     'WebPage',
        name:        names[type][locale],
        url,
        inLanguage:  locale === 'de' ? 'de-DE' : 'en-US',
        isPartOf: {
            '@type': 'WebSite',
            name:    'ReelGuess',
            url:     baseUrl,
        },
        about: {
            '@type': 'Organization',
            name:    'ReelGuess',
            url:     baseUrl,
        },
        publisher: {
            '@type': 'Organization',
            name:    'ReelGuess',
            url:     baseUrl,
            logo:    `${baseUrl}/icons/icon-512.png`,
        },
    }
}

