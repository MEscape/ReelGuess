import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'

// ─────────────────────────────────────────────────────────────────────────────
// robots.txt
//
// Allow crawling of public pages, block session/private routes.
// ─────────────────────────────────────────────────────────────────────────────

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow:     ['/', '/de'],
                disallow:  [
                    '/lobby/',
                    '/game/',
                    '/de/lobby/',
                    '/de/game/',
                    '/api/',
                    '/_next/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host:    baseUrl,
    }
}

