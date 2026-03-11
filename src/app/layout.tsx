import type { Metadata }      from 'next'
import { Inter, Bebas_Neue }  from 'next/font/google'
import { QueryProvider }      from '@/lib/providers/query-provider'
import './globals.css'

const inter = Inter({
    variable: '--font-inter',
    subsets:  ['latin'],
    display:  'swap',
})

const bebasNeue = Bebas_Neue({
    variable: '--font-bebas-neue',
    weight:   '400',
    subsets:  ['latin'],
    display:  'swap',
})

export const metadata: Metadata = {
    title:       'ReelGuess — Guess Who Liked the Reel! 🎬',
    description: 'A multiplayer party game where you guess which friend liked a specific Instagram Reel.',
    keywords:    ['party game', 'instagram', 'reels', 'multiplayer', 'guess who'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
        <body className={`${inter.variable} ${bebasNeue.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        </body>
        </html>
    )
}
