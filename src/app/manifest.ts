import type { MetadataRoute } from 'next'

// ─────────────────────────────────────────────────────────────────────────────
// Web App Manifest
//
// Served at /manifest.json — required for PWA install prompts and
// iOS "Add to Home Screen". Also improves Google's understanding of
// the app (applicationCategory, display mode).
// ─────────────────────────────────────────────────────────────────────────────

export default function manifest(): MetadataRoute.Manifest {
    return {
        name:             'ReelGuess',
        short_name:       'ReelGuess',
        description:      'Guess which friend liked the Instagram Reel — the viral party game for groups.',
        start_url:        '/',
        display:          'standalone',
        background_color: '#0d0d0d',
        theme_color:      '#0d0d0d',
        orientation:      'portrait-primary',
        categories:       ['games', 'entertainment', 'social'],
        lang:             'en',
        dir:              'ltr',
        icons: [
            {
                src:     '/icons/icon-192.png',
                sizes:   '192x192',
                type:    'image/png',
                purpose: 'maskable',
            },
            {
                src:     '/icons/icon-512.png',
                sizes:   '512x512',
                type:    'image/png',
                purpose: 'maskable',
            },
            {
                src:     '/logo.png',
                sizes:   '1024x1024',
                type:    'image/png',
                purpose: 'any',
            },
        ],
        screenshots: [
            {
                src:   '/api/og?locale=en',
                sizes: '1200x630',
                type:  'image/png',
                label: 'ReelGuess home screen',
            },
        ],
    }
}

