import type { Metadata }      from 'next'
import Link                    from 'next/link'
import { getTranslations }     from 'next-intl/server'
import { BannerAd }            from '@/features/ads'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t       = await getTranslations({ locale, namespace: 'seo.about' })
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path    = locale === 'en' ? '/about' : `/${locale}/about`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/about`,
                de:          `${baseUrl}/de/about`,
                'x-default': `${baseUrl}/about`,
            },
        },
        openGraph: {
            title:       t('title'),
            description: t('description'),
            url:         `${baseUrl}${path}`,
            siteName:    'ReelGuess',
            type:        'website',
        },
        robots: { index: true, follow: true },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
    const { locale } = await params
    const t  = await getTranslations({ locale, namespace: 'about' })
    const prefix = locale === 'en' ? '' : `/${locale}`

    const features = [
        { titleKey: 'feature1Title', bodyKey: 'feature1Body', emoji: '🌐' },
        { titleKey: 'feature2Title', bodyKey: 'feature2Body', emoji: '🔒' },
        { titleKey: 'feature3Title', bodyKey: 'feature3Body', emoji: '⏱️' },
        { titleKey: 'feature4Title', bodyKey: 'feature4Body', emoji: '🏆' },
        { titleKey: 'feature5Title', bodyKey: 'feature5Body', emoji: '📱' },
        { titleKey: 'feature6Title', bodyKey: 'feature6Body', emoji: '🎉' },
    ] as const

    return (
        <main id="main-content" className="legal-page pb-safe" aria-labelledby="about-page-title">
            <div className="legal-page__container">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="legal-page__header">
                    <h1 id="about-page-title" className="legal-page__title">
                        {t('title')}
                    </h1>
                    <p className="legal-page__intro">{t('subtitle')}</p>
                </header>

                {/* ── Top Banner Ad ───────────────────────────────────────── */}
                <div style={{ marginBottom: 'var(--space-10)' }}>
                    <BannerAd placement="banner-content-about" format="horizontal" />
                </div>

                <article className="legal-page__content">

                    {/* Intro */}
                    <section aria-labelledby="about-intro">
                        <p className="legal-page__text" style={{ fontSize: 'var(--text-body-lg)', lineHeight: 1.8 }}>
                            {t('intro')}
                        </p>
                    </section>

                    {/* Mission */}
                    <section aria-labelledby="about-mission">
                        <h2 id="about-mission" className="legal-page__section-title">
                            {t('missionHeading')}
                        </h2>
                        <p className="legal-page__text">{t('missionBody')}</p>
                    </section>

                    {/* What Is */}
                    <section aria-labelledby="about-what-is">
                        <h2 id="about-what-is" className="legal-page__section-title">
                            {t('whatIsHeading')}
                        </h2>
                        <p className="legal-page__text">{t('whatIsBody')}</p>
                    </section>

                    {/* How It Started */}
                    <section aria-labelledby="about-started">
                        <h2 id="about-started" className="legal-page__section-title">
                            {t('howItStartedHeading')}
                        </h2>
                        <p className="legal-page__text">{t('howItStartedBody')}</p>
                    </section>

                    {/* Features Grid */}
                    <section aria-labelledby="about-features">
                        <h2 id="about-features" className="legal-page__section-title">
                            {t('featuresHeading')}
                        </h2>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                                gap: 'var(--space-4)',
                                marginTop: 'var(--space-5)',
                            }}
                        >
                            {features.map(({ titleKey, bodyKey, emoji }) => (
                                <div
                                    key={titleKey}
                                    className="card-brutal"
                                    style={{ padding: 'var(--space-5)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }} aria-hidden>{emoji}</span>
                                        <h3
                                            className="font-display uppercase"
                                            style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-foreground)', lineHeight: 1 }}
                                        >
                                            {t(titleKey)}
                                        </h3>
                                    </div>
                                    <p className="legal-page__text" style={{ marginTop: 0 }}>
                                        {t(bodyKey)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Mid Banner Ad */}
                    <div>
                        <BannerAd placement="banner-content-about" format="rectangle" />
                    </div>

                    {/* Audience */}
                    <section aria-labelledby="about-audience">
                        <h2 id="about-audience" className="legal-page__section-title">
                            {t('audienceHeading')}
                        </h2>
                        <p className="legal-page__text">{t('audienceBody')}</p>
                    </section>

                    {/* Privacy Note */}
                    <section aria-labelledby="about-privacy">
                        <h2 id="about-privacy" className="legal-page__section-title">
                            {t('privacyNoteHeading')}
                        </h2>
                        <p className="legal-page__text">{t('privacyNoteBody')}</p>
                    </section>

                    {/* CTA */}
                    <section aria-labelledby="about-cta">
                        <div
                            className="card-accent"
                            style={{ padding: 'var(--space-8)', textAlign: 'center' }}
                        >
                            <h2
                                id="about-cta"
                                className="font-display uppercase"
                                style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-foreground)', marginBottom: 'var(--space-3)' }}
                            >
                                {t('ctaHeading')}
                            </h2>
                            <p className="legal-page__text" style={{ marginBottom: 'var(--space-6)' }}>
                                {t('ctaBody')}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center' }}>
                                <Link
                                    href={prefix || '/'}
                                    className="btn btn-primary btn-lg"
                                >
                                    {t('ctaButton')}
                                </Link>
                                <Link
                                    href={`${prefix}/how-to-play`}
                                    className="btn btn-ghost btn-md"
                                >
                                    {t('howToPlayLink')}
                                </Link>
                                <Link
                                    href={`${prefix}/how-to-import`}
                                    className="btn btn-ghost btn-md"
                                >
                                    {t('howToImportLink')}
                                </Link>
                            </div>
                        </div>
                    </section>

                </article>
            </div>
        </main>
    )
}

