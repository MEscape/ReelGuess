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
    ]
}
