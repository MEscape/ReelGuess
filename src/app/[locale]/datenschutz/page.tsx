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
    const t          = await getTranslations({ locale, namespace: 'seo.datenschutz' })
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path       = locale === 'en' ? '/datenschutz' : `/${locale}/datenschutz`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/datenschutz`,
                de:          `${baseUrl}/de/datenschutz`,
                'x-default': `${baseUrl}/datenschutz`,
            },
        },
        robots: { index: true, follow: false },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function DatenschutzPage({ params }: Props) {
    const { locale } = await params
    const t          = await getTranslations({ locale, namespace: 'legal.datenschutz' })
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path       = locale === 'en' ? '/datenschutz' : `/${locale}/datenschutz`
    const typedLocale = (locale === 'de' ? 'de' : 'en') as 'en' | 'de'

    return (
        <>
            <JsonLd schema={buildLegalPageSchema('datenschutz', `${baseUrl}${path}`, typedLocale)} />

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
                        <p className="legal-page__intro">{t('intro')}</p>
                    </header>

                    <article className="legal-page__content">
                        {[
                            { id: 'controller',      heading: t('controllerHeading'),      body: t('controllerContent') },
                            { id: 'data-collection', heading: t('dataCollectionHeading'),   body: t('dataCollectionContent') },
                            { id: 'legal-basis',     heading: t('legalBasisHeading'),       body: t('legalBasisContent') },
                            { id: 'analytics',       heading: t('analyticsHeading'),        body: t('analyticsContent') },
                            { id: 'cookies',         heading: t('cookiesHeading'),          body: t('cookiesContent') },
                            { id: 'rights',          heading: t('rightsHeading'),           body: t('rightsContent') },
                            { id: 'contact',         heading: t('contactHeading'),          body: t('contactContent') },
                        ].map(({ id, heading, body }) => (
                            <section key={id} aria-labelledby={`datenschutz-${id}`}>
                                <h2 id={`datenschutz-${id}`} className="legal-page__section-title">
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

