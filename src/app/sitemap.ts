import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'

// Last content update — update when landing page copy changes significantly.
const LAST_MODIFIED = new Date('2026-03-14')

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap
//
// Only static / indexable pages are listed.
// Dynamic session pages (lobby/game) are excluded — they're noindex.
// ─────────────────────────────────────────────────────────────────────────────

export default function sitemap(): MetadataRoute.Sitemap {
    const legalSlugs = ['impressum', 'datenschutz', 'agb'] as const

    const legalEntries: MetadataRoute.Sitemap = legalSlugs.flatMap((slug) => [
        {
            url:             `${baseUrl}/${slug}`,
            lastModified:    LAST_MODIFIED,
            changeFrequency: 'yearly' as const,
            priority:        0.4,
            alternates: {
                languages: {
                    en:          `${baseUrl}/${slug}`,
                    de:          `${baseUrl}/de/${slug}`,
                    'x-default': `${baseUrl}/${slug}`,
                },
            },
        },
        {
            url:             `${baseUrl}/de/${slug}`,
            lastModified:    LAST_MODIFIED,
            changeFrequency: 'yearly' as const,
            priority:        0.4,
            alternates: {
                languages: {
                    en:          `${baseUrl}/${slug}`,
                    de:          `${baseUrl}/de/${slug}`,
                    'x-default': `${baseUrl}/${slug}`,
                },
            },
        },
    ])

    return [
        {
            url:             `${baseUrl}/`,
            lastModified:    LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority:        1.0,
            alternates: {
                languages: {
                    en:           `${baseUrl}/`,
                    de:           `${baseUrl}/de`,
                    'x-default':  `${baseUrl}/`,
                },
            },
        },
        {
            url:             `${baseUrl}/de`,
            lastModified:    LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority:        0.9,
            alternates: {
                languages: {
                    en:           `${baseUrl}/`,
                    de:           `${baseUrl}/de`,
                    'x-default':  `${baseUrl}/`,
                },
            },
        },
        ...legalEntries,
    ]
}
