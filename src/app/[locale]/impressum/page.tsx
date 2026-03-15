import type { Metadata }        from 'next'
import { getTranslations }       from 'next-intl/server'
import { JsonLd }                from '@/components/seo/json-ld'
import { buildLegalPageSchema, buildOrganizationSchema } from '@/components/seo/structured-data'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t          = await getTranslations({ locale, namespace: 'seo.impressum' })
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path       = locale === 'en' ? '/impressum' : `/${locale}/impressum`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/impressum`,
                de:          `${baseUrl}/de/impressum`,
                'x-default': `${baseUrl}/impressum`,
            },
        },
        robots: { index: true, follow: false },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function ImpressumPage({ params }: Props) {
    const { locale } = await params
    const t          = await getTranslations({ locale, namespace: 'legal.impressum' })
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path       = locale === 'en' ? '/impressum' : `/${locale}/impressum`
    const typedLocale = (locale === 'de' ? 'de' : 'en') as 'en' | 'de'

    return (
        <>
            <JsonLd schema={buildLegalPageSchema('impressum', `${baseUrl}${path}`, typedLocale)} />
            <JsonLd schema={buildOrganizationSchema(baseUrl)} />

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
                        {/* Operator info */}
                        <section aria-labelledby="impressum-operator">
                            <h2 id="impressum-operator" className="legal-page__section-title">
                                {t('operatorHeading')}
                            </h2>
                            <address className="legal-page__address not-italic">
                                <p><strong>{t('name')}</strong></p>
                                <p>{t('address')}</p>
                                <p>
                                    E-Mail:{' '}
                                    <a
                                        href={`mailto:${t('email')}`}
                                        className="legal-page__link"
                                    >
                                        {t('email')}
                                    </a>
                                </p>
                                <p>Tel.: {t('phone')}</p>
                            </address>
                        </section>

                        {/* Liability */}
                        <section aria-labelledby="impressum-liability">
                            <h2 id="impressum-liability" className="legal-page__section-title">
                                {t('liabilityHeading')}
                            </h2>
                            <p className="legal-page__text">{t('liabilityContent')}</p>
                        </section>

                        {/* Copyright */}
                        <section aria-labelledby="impressum-copyright">
                            <h2 id="impressum-copyright" className="legal-page__section-title">
                                {t('copyrightHeading')}
                            </h2>
                            <p className="legal-page__text">{t('copyrightContent')}</p>
                        </section>

                        {/* Dispute resolution */}
                        <section aria-labelledby="impressum-dispute">
                            <h2 id="impressum-dispute" className="legal-page__section-title">
                                {t('disputeHeading')}
                            </h2>
                            <p className="legal-page__text">{t('disputeContent')}</p>
                        </section>
                    </article>
                </div>
            </main>
        </>
    )
}

