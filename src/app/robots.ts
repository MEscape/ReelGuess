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
                allow: [
                    '/',
                    '/de',
                    '/about',
                    '/how-to-play',
                    '/how-to-import',
                    '/faq',
                    '/impressum',
                    '/datenschutz',
                    '/agb',
                    '/de/about',
                    '/de/how-to-play',
                    '/de/how-to-import',
                    '/de/faq',
                    '/de/impressum',
                    '/de/datenschutz',
                    '/de/agb',
                ],
                disallow: [
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
