import type { Metadata }       from 'next'
import { getTranslations }      from 'next-intl/server'
import { JsonLd }               from '@/components/seo/json-ld'
import { buildLegalPageSchema } from '@/components/seo/structured-data'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t          = await getTranslations({ locale, namespace: 'seo.agb' })
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path       = locale === 'en' ? '/agb' : `/${locale}/agb`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/agb`,
                de:          `${baseUrl}/de/agb`,
                'x-default': `${baseUrl}/agb`,
            },
        },
        robots: { index: true, follow: false },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function AgbPage({ params }: Props) {
    const { locale } = await params
    const t          = await getTranslations({ locale, namespace: 'legal.agb' })
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path       = locale === 'en' ? '/agb' : `/${locale}/agb`
    const typedLocale = (locale === 'de' ? 'de' : 'en') as 'en' | 'de'

    return (
        <>
            <JsonLd schema={buildLegalPageSchema('agb', `${baseUrl}${path}`, typedLocale)} />

            <main
                id="main-content"
                className="legal-page"
                aria-labelledby="legal-page-title"
            >
                <div className="legal-page__container">
                    <header className="legal-page__header">
                        <h1 id="legal-page-title" className="legal-page__title">
                            {t('title')}
                        </h1>
                    </header>

                    <article className="legal-page__content">
                        {[
                            { id: 'scope',    heading: t('scopeHeading'),    body: t('scopeContent') },
                            { id: 'service',  heading: t('serviceHeading'),  body: t('serviceContent') },
                            { id: 'rules',    heading: t('rulesHeading'),    body: t('rulesContent') },
                            { id: 'content',  heading: t('contentHeading'),  body: t('contentContent') },
                            { id: 'liability',heading: t('liabilityHeading'),body: t('liabilityContent') },
                            { id: 'change',   heading: t('changeHeading'),   body: t('changeContent') },
                            { id: 'law',      heading: t('lawHeading'),      body: t('lawContent') },
                        ].map(({ id, heading, body }) => (
                            <section key={id} aria-labelledby={`agb-${id}`}>
                                <h2 id={`agb-${id}`} className="legal-page__section-title">
                                    {heading}
                                </h2>
                                <p className="legal-page__text">{body}</p>
                            </section>
                        ))}
                    </article>
                </div>
            </main>
        </>
    )
}

