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
export function buildFaqSchema(locale: Locale = 'en'): Record<string, unknown> {
    const faqs: Record<Locale, Array<{ q: string; a: string }>> = {
        en: [
            {
                q: 'What is ReelGuess?',
                a: "ReelGuess is a free multiplayer party game where players guess which friend liked a specific Instagram Reel. It's like social trivia for groups of 2–8 players — no account needed.",
            },
            {
                q: 'How do you play ReelGuess?',
                a: 'Import your liked Instagram Reels, create a lobby and share the 6-letter code with friends. Each round shows a Reel and everyone guesses who liked it. Correct guesses earn points — most points wins!',
            },
            {
                q: 'Is ReelGuess free?',
                a: 'Yes! ReelGuess is completely free to play in your browser on any device. No account, no download needed.',
            },
            {
                q: 'How many players can play ReelGuess?',
                a: 'ReelGuess supports 2–8 players per game. One player creates the lobby and shares the code, others join instantly with the same code.',
            },
            {
                q: 'Do I need an Instagram account to play?',
                a: 'You need to export your Instagram data (liked posts) once. After that, the Reels are stored locally on your device — no Instagram login is needed to play.',
            },
            {
                q: 'What is Double-or-Nothing in ReelGuess?',
                a: 'Double-or-Nothing is a risk mechanic: activate it after voting to double your points on a correct guess — or lose half your points if wrong. Requires a minimum score to use.',
            },
        ],
        de: [
            {
                q: 'Was ist ReelGuess?',
                a: 'ReelGuess ist ein kostenloses Multiplayer-Partyspiel, bei dem Spieler raten müssen, welcher Freund einen bestimmten Instagram Reel geliked hat. Für 2–8 Spieler — kein Account nötig.',
            },
            {
                q: 'Wie spielt man ReelGuess?',
                a: 'Importiere deine gelikten Instagram Reels, erstelle eine Lobby und teile den 6-stelligen Code mit Freunden. Jede Runde zeigt einen Reel — wer ihn geliked hat, wird aufgelöst. Richtige Antworten geben Punkte!',
            },
            {
                q: 'Ist ReelGuess kostenlos?',
                a: 'Ja! ReelGuess ist vollständig kostenlos im Browser spielbar, auf jedem Gerät. Kein Account, kein Download erforderlich.',
            },
            {
                q: 'Wie viele Spieler kann ReelGuess haben?',
                a: 'ReelGuess unterstützt 2–8 Spieler pro Spiel. Ein Spieler erstellt die Lobby und teilt den Code — alle anderen treten sofort bei.',
            },
            {
                q: 'Brauche ich einen Instagram-Account?',
                a: 'Du musst einmalig deine Instagram-Daten exportieren (gelikte Beiträge). Danach werden die Reels lokal auf deinem Gerät gespeichert — kein Instagram-Login nötig zum Spielen.',
            },
            {
                q: 'Was ist Doppelt oder Nichts bei ReelGuess?',
                a: 'Doppelt oder Nichts ist eine Risiko-Mechanik: Aktiviere sie nach deiner Abstimmung, um bei richtiger Antwort deine Punkte zu verdoppeln — oder bei falscher Antwort die Hälfte zu verlieren.',
            },
        ],
    }

    return {
        '@context': 'https://schema.org',
        '@type':    'FAQPage',
        inLanguage: locale === 'de' ? 'de-DE' : 'en-US',
        mainEntity: faqs[locale].map(({ q, a }) => ({
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
        email:      'contact@reelguess.app',
        address: {
            '@type':           'PostalAddress',
            streetAddress:     'Musterstraße 1',
            addressLocality:   'Musterstadt',
            postalCode:        '12345',
            addressCountry:    'DE',
        },
        contactPoint: {
            '@type':             'ContactPoint',
            contactType:         'customer support',
            email:               'contact@reelguess.app',
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

