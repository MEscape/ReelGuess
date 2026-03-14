import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

// ─────────────────────────────────────────────────────────────────────────────
// next-intl Routing Proxy (formerly middleware)
//
// Strategy: 'as-needed'
//   • English (/en) → served at / (no prefix) — SEO-friendly default
//   • German  (/de) → served at /de
//
// Browser language detection order:
//   1. URL prefix (explicit)
//   2. Accept-Language header → maps to closest supported locale
//   3. Falls back to English
// ─────────────────────────────────────────────────────────────────────────────

export default createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
    localeDetection: true,
})

export const config = {
    // Match all routes EXCEPT:
    //  - Next.js internals (_next/static, _next/image)
    //  - API routes (/api/*)
    //  - All static files in /public:
    //      *.ico, *.png, *.jpg, *.jpeg, *.gif, *.svg, *.webp (images incl. logo.png)
    //      *.webmanifest, *.json (manifest)
    //      *.xml, *.txt (sitemap / robots)
    //      *.woff, *.woff2 (fonts)
    //  - Well-known paths (Chrome DevTools etc.)
    matcher: [
        '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|logo\\.png|icons/.*|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|\\.well-known/.*|opengraph-image|twitter-image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)).*)',
    ],
}

