import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'

const LAST_MODIFIED        = new Date('2026-03-16')
const LAST_MODIFIED_LEGAL  = new Date('2026-03-14')

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap
// ─────────────────────────────────────────────────────────────────────────────

export default function sitemap(): MetadataRoute.Sitemap {
    // Helper: build both locale variants of a slug
    function bilingualEntries(
        slug: string,
        opts: {
            changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
            priority:        number
            lastModified?:   Date
        },
    ): MetadataRoute.Sitemap {
        const lm = opts.lastModified ?? LAST_MODIFIED
        const base = {
            changeFrequency: opts.changeFrequency,
            priority:        opts.priority,
            lastModified:    lm,
            alternates: {
                languages: {
                    en:          `${baseUrl}/${slug}`,
                    de:          `${baseUrl}/de/${slug}`,
                    'x-default': `${baseUrl}/${slug}`,
                },
            },
        }
        return [
            { url: `${baseUrl}/${slug}`,       ...base },
            { url: `${baseUrl}/de/${slug}`,    ...base },
        ]
    }

    return [
        // ── Home ──────────────────────────────────────────────────────────
        {
            url:             `${baseUrl}/`,
            lastModified:    LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority:        1.0,
            alternates: {
                languages: {
                    en:          `${baseUrl}/`,
                    de:          `${baseUrl}/de`,
                    'x-default': `${baseUrl}/`,
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
                    en:          `${baseUrl}/`,
                    de:          `${baseUrl}/de`,
                    'x-default': `${baseUrl}/`,
                },
            },
        },

        // ── Content pages ─────────────────────────────────────────────────
        ...bilingualEntries('about',          { changeFrequency: 'monthly',  priority: 0.85 }),
        ...bilingualEntries('how-to-play',    { changeFrequency: 'monthly',  priority: 0.85 }),
        ...bilingualEntries('how-to-import',  { changeFrequency: 'monthly',  priority: 0.85 }),
        ...bilingualEntries('faq',            { changeFrequency: 'monthly',  priority: 0.80 }),

        // ── Legal pages ───────────────────────────────────────────────────
        ...bilingualEntries('impressum',   { changeFrequency: 'yearly', priority: 0.4, lastModified: LAST_MODIFIED_LEGAL }),
        ...bilingualEntries('datenschutz', { changeFrequency: 'yearly', priority: 0.4, lastModified: LAST_MODIFIED_LEGAL }),
        ...bilingualEntries('agb',         { changeFrequency: 'yearly', priority: 0.4, lastModified: LAST_MODIFIED_LEGAL }),
    ]
}
