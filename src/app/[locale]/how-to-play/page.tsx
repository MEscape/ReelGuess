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
    const t       = await getTranslations({ locale, namespace: 'seo.howToPlay' })
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path    = locale === 'en' ? '/how-to-play' : `/${locale}/how-to-play`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/how-to-play`,
                de:          `${baseUrl}/de/how-to-play`,
                'x-default': `${baseUrl}/how-to-play`,
            },
        },
        openGraph: {
            title:       t('title'),
            description: t('description'),
            url:         `${baseUrl}${path}`,
            siteName:    'ReelGuess',
            type:        'article',
        },
        robots: { index: true, follow: true },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — numbered step card
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({
    number,
    title,
    body,
}: {
    number: string
    title:  string
    body:   string
}) {
    return (
        <div
            className="card-brutal"
            style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}
        >
            <div
                className="font-display"
                style={{
                    fontSize:      'var(--text-display)',
                    lineHeight:    1,
                    color:         'var(--color-accent)',
                    letterSpacing: 'var(--tracking-display)',
                    flexShrink:    0,
                    minWidth:      '2.5rem',
                    textAlign:     'right',
                }}
                aria-hidden="true"
            >
                {number}
            </div>
            <div>
                <h3
                    className="font-display uppercase"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-foreground)',
                        lineHeight:    1.1,
                        marginBottom:  'var(--space-3)',
                    }}
                >
                    {title}
                </h3>
                <p className="legal-page__text" style={{ marginTop: 0 }}>{body}</p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function HowToPlayPage({ params }: Props) {
    const { locale } = await params
    const t      = await getTranslations({ locale, namespace: 'howToPlay' })
    const prefix = locale === 'en' ? '' : `/${locale}`

    const hostSteps = [
        { n: '01', titleKey: 'hostStep1Title', bodyKey: 'hostStep1Body' },
        { n: '02', titleKey: 'hostStep2Title', bodyKey: 'hostStep2Body' },
        { n: '03', titleKey: 'hostStep3Title', bodyKey: 'hostStep3Body' },
        { n: '04', titleKey: 'hostStep4Title', bodyKey: 'hostStep4Body' },
        { n: '05', titleKey: 'hostStep5Title', bodyKey: 'hostStep5Body' },
    ] as const

    const joinSteps = [
        { n: '01', titleKey: 'joinStep1Title', bodyKey: 'joinStep1Body' },
        { n: '02', titleKey: 'joinStep2Title', bodyKey: 'joinStep2Body' },
        { n: '03', titleKey: 'joinStep3Title', bodyKey: 'joinStep3Body' },
    ] as const

    const tips = [
        t('tip1'), t('tip2'), t('tip3'), t('tip4'), t('tip5'),
    ]

    return (
        <main id="main-content" className="legal-page pb-safe" aria-labelledby="htp-page-title">
            <div className="legal-page__container">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="legal-page__header">
                    <h1 id="htp-page-title" className="legal-page__title">
                        {t('title')}
                    </h1>
                    <p className="legal-page__intro">{t('subtitle')}</p>
                </header>

                {/* Top Banner Ad */}
                <div style={{ marginBottom: 'var(--space-10)' }}>
                    <BannerAd placement="banner-content-how-to-play" format="horizontal" />
                </div>

                <article className="legal-page__content">

                    {/* Intro paragraph */}
                    <section>
                        <p className="legal-page__text" style={{ fontSize: 'var(--text-body-lg)', lineHeight: 1.8 }}>
                            {t('intro')}
                        </p>
                    </section>

                    {/* Overview */}
                    <section aria-labelledby="htp-overview">
                        <h2 id="htp-overview" className="legal-page__section-title">
                            {t('overviewHeading')}
                        </h2>
                        <p className="legal-page__text">{t('overviewBody')}</p>
                    </section>

                    {/* What You Need */}
                    <section aria-labelledby="htp-requirements">
                        <h2 id="htp-requirements" className="legal-page__section-title">
                            {t('requirementsHeading')}
                        </h2>
                        <ul
                            style={{
                                listStyle:   'none',
                                padding:     0,
                                margin:      0,
                                display:     'flex',
                                flexDirection: 'column',
                                gap:         'var(--space-3)',
                                marginTop:   'var(--space-4)',
                            }}
                        >
                            {(t.raw('requirementsList') as string[]).map((item, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display:      'flex',
                                        alignItems:   'flex-start',
                                        gap:          'var(--space-3)',
                                        padding:      'var(--space-3) var(--space-4)',
                                        background:   'var(--color-surface)',
                                        border:       '1px solid var(--color-border-subtle)',
                                        fontSize:     'var(--text-body)',
                                        color:        'var(--color-muted)',
                                        lineHeight:   1.6,
                                    }}
                                >
                                    <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} aria-hidden>✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* ── Hosting ──────────────────────────────────────────── */}
                    <section aria-labelledby="htp-hosting">
                        <h2 id="htp-hosting" className="legal-page__section-title">
                            {t('hostingHeading')}
                        </h2>
                        <p className="legal-page__text" style={{ marginBottom: 'var(--space-5)' }}>
                            {t('hostingIntro')}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {hostSteps.map(({ n, titleKey, bodyKey }) => (
                                <StepCard key={n} number={n} title={t(titleKey)} body={t(bodyKey)} />
                            ))}
                        </div>
                    </section>

                    {/* Mid Banner Ad */}
                    <div>
                        <BannerAd placement="banner-content-how-to-play" format="rectangle" />
                    </div>

                    {/* ── Joining ──────────────────────────────────────────── */}
                    <section aria-labelledby="htp-joining">
                        <h2 id="htp-joining" className="legal-page__section-title">
                            {t('joiningHeading')}
                        </h2>
                        <p className="legal-page__text" style={{ marginBottom: 'var(--space-5)' }}>
                            {t('joiningIntro')}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {joinSteps.map(({ n, titleKey, bodyKey }) => (
                                <StepCard key={n} number={n} title={t(titleKey)} body={t(bodyKey)} />
                            ))}
                        </div>
                    </section>

                    {/* ── Gameplay ─────────────────────────────────────────── */}
                    <section aria-labelledby="htp-gameplay">
                        <h2 id="htp-gameplay" className="legal-page__section-title">
                            {t('gameplayHeading')}
                        </h2>

                        {[
                            { id: 'voting',   titleKey: 'gameplayVotingTitle',   bodyKey: 'gameplayVotingBody'   },
                            { id: 'reveal',   titleKey: 'gameplayRevealTitle',   bodyKey: 'gameplayRevealBody'   },
                            { id: 'scoring',  titleKey: 'gameplayScoringTitle',  bodyKey: 'gameplayScoringBody'  },
                            { id: 'double',   titleKey: 'gameplayDoubleTitle',   bodyKey: 'gameplayDoubleBody'   },
                        ].map(({ id, titleKey, bodyKey }) => (
                            <div key={id} style={{ marginTop: 'var(--space-6)' }}>
                                <h3
                                    className="font-display uppercase"
                                    style={{
                                        fontSize:      'var(--text-ui)',
                                        letterSpacing: 'var(--tracking-label)',
                                        color:         'var(--color-accent)',
                                        marginBottom:  'var(--space-2)',
                                    }}
                                >
                                    {t(titleKey as Parameters<typeof t>[0])}
                                </h3>
                                <p className="legal-page__text">{t(bodyKey as Parameters<typeof t>[0])}</p>
                            </div>
                        ))}
                    </section>

                    {/* After Game */}
                    <section aria-labelledby="htp-after">
                        <h2 id="htp-after" className="legal-page__section-title">
                            {t('afterGameHeading')}
                        </h2>
                        <p className="legal-page__text">{t('afterGameBody')}</p>
                    </section>

                    {/* Tips */}
                    <section aria-labelledby="htp-tips">
                        <h2 id="htp-tips" className="legal-page__section-title">
                            {t('tipsHeading')}
                        </h2>
                        <ol
                            style={{
                                listStyle:     'none',
                                padding:       0,
                                margin:        'var(--space-4) 0 0',
                                display:       'flex',
                                flexDirection: 'column',
                                gap:           'var(--space-3)',
                                counterReset:  'tips',
                            }}
                        >
                            {tips.map((tip, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display:      'flex',
                                        alignItems:   'flex-start',
                                        gap:          'var(--space-3)',
                                        padding:      'var(--space-4)',
                                        background:   'var(--color-surface)',
                                        border:       '2px solid var(--color-border-subtle)',
                                        fontSize:     'var(--text-body)',
                                        color:        'var(--color-muted)',
                                        lineHeight:   1.7,
                                    }}
                                >
                                    <span
                                        className="font-display"
                                        style={{
                                            fontSize:   'var(--text-label-xs)',
                                            color:      'var(--color-accent)',
                                            background: 'rgba(245,200,0,0.1)',
                                            border:     '2px solid var(--color-accent)',
                                            padding:    '2px 6px',
                                            flexShrink: 0,
                                            marginTop:  '2px',
                                            letterSpacing: 'var(--tracking-label)',
                                        }}
                                        aria-hidden
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Import Guide link */}
                    <section>
                        <div
                            style={{
                                padding:      'var(--space-5)',
                                background:   'var(--color-surface)',
                                border:       '2px solid var(--color-border-subtle)',
                                borderLeft:   '4px solid var(--color-accent)',
                            }}
                        >
                            <p className="legal-page__text" style={{ marginBottom: 'var(--space-3)' }}>
                                {t('importGuideLink').split('→')[0]}
                            </p>
                            <Link href={`${prefix}/how-to-import`} className="legal-page__link" style={{ fontWeight: 700 }}>
                                {locale === 'de' ? 'Import-Leitfaden →' : 'Import Guide →'}
                            </Link>
                        </div>
                    </section>

                    {/* CTA */}
                    <section>
                        <div style={{ textAlign: 'center' }}>
                            <Link href={prefix || '/'} className="btn btn-primary btn-lg">
                                {t('ctaButton')}
                            </Link>
                        </div>
                    </section>

                </article>
            </div>
        </main>
    )
}

