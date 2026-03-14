/**
 * Lobby page under [locale] routing.
 * Delegates to the same server logic as the non-locale route.
 */
import { getLobbyByCode }  from '@/features/lobby'
import { notFound }        from 'next/navigation'
import { LobbyClient }     from '@/app/[locale]/(game)/lobby/[code]/lobby-client'
import type { Metadata }   from 'next'
import { getTranslations } from 'next-intl/server'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata — noindex (session pages should not be indexed)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; code: string }>
}): Promise<Metadata> {
    const { locale, code } = await params
    const t = await getTranslations({ locale, namespace: 'seo.lobby' })

    return {
        title:       t('title', { code: code.toUpperCase() }),
        description: t('description'),
        robots:      { index: false, follow: false },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    params: Promise<{ locale: string; code: string }>
}

export default async function LobbyPage({ params }: Props) {
    const { code }  = await params
    const result    = await getLobbyByCode(code.toUpperCase())

    if (result.isErr()) notFound()

    return <LobbyClient lobby={result.value} />
}

