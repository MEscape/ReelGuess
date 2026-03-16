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
    const t       = await getTranslations({ locale, namespace: 'seo.howToImport' })
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path    = locale === 'en' ? '/how-to-import' : `/${locale}/how-to-import`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/how-to-import`,
                de:          `${baseUrl}/de/how-to-import`,
                'x-default': `${baseUrl}/how-to-import`,
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
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function HowToImportPage({ params }: Props) {
    const { locale } = await params
    const t      = await getTranslations({ locale, namespace: 'howToImport' })
    const prefix = locale === 'en' ? '' : `/${locale}`

    // Video URLs — read-only Vercel Blob URLs provided via env.
    // Only GET requests are made to these URLs; no writes occur.
    const videoUrl =
        locale === 'de'
            ? (process.env.NEXT_PUBLIC_VIDEO_HOW_TO_IMPORT_DE ?? '')
            : (process.env.NEXT_PUBLIC_VIDEO_HOW_TO_IMPORT_EN ?? '')

    const exportSteps = [
        'exportStep1',
        'exportStep2',
        'exportStep3',
        'exportStep4',
        'exportStep5',
        'exportStep6',
        'exportStep7',
    ] as const

    const troubleItems = [
        { titleKey: 'trouble1Title', bodyKey: 'trouble1Body' },
        { titleKey: 'trouble2Title', bodyKey: 'trouble2Body' },
        { titleKey: 'trouble3Title', bodyKey: 'trouble3Body' },
        { titleKey: 'trouble4Title', bodyKey: 'trouble4Body' },
        { titleKey: 'trouble5Title', bodyKey: 'trouble5Body' },
    ] as const

    return (
        <main id="main-content" className="legal-page pb-safe" aria-labelledby="import-page-title">
            <div className="legal-page__container">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="legal-page__header">
                    <h1 id="import-page-title" className="legal-page__title">
                        {t('title')}
                    </h1>
                    <p className="legal-page__intro">{t('subtitle')}</p>
                </header>

                {/* Top Banner Ad */}
                <div style={{ marginBottom: 'var(--space-10)' }}>
                    <BannerAd placement="banner-content-how-to-import" format="horizontal" />
                </div>

                <article className="legal-page__content">

                    {/* Intro */}
                    <section>
                        <p className="legal-page__text" style={{ fontSize: 'var(--text-body-lg)', lineHeight: 1.8 }}>
                            {t('intro')}
                        </p>
                    </section>

                    {/* ── Video Section ────────────────────────────────────── */}
                    {videoUrl && (
                        <section aria-labelledby="import-video">
                            <h2 id="import-video" className="legal-page__section-title">
                                {t('videoHeading')}
                            </h2>
                            <p className="legal-page__text" style={{ marginBottom: 'var(--space-5)' }}>
                                {t('videoSubtitle')}
                            </p>
                            <div
                                style={{
                                    position:   'relative',
                                    width:      '100%',
                                    background: 'var(--color-surface)',
                                    border:     '3px solid var(--color-border-subtle)',
                                    boxShadow:  'var(--shadow-brutal-lg)',
                                    overflow:   'hidden',
                                }}
                            >
                                {/* ── Accent stripe ── */}
                                <div
                                    style={{ height: '3px', background: 'var(--color-accent)', width: '100%' }}
                                    aria-hidden
                                />
                                {/*
                                 * 16:9 wrapper — enforces landscape regardless of the video's
                                 * native dimensions (even if the recording is 9:16 portrait).
                                 * The <video> fills the box with object-fit: contain so the
                                 * full frame is always visible with letterbox bars.
                                 *
                                 * READ-ONLY Vercel Blob URL — no writes are ever made.
                                 */}
                                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
                                    <video
                                        controls
                                        preload="none"
                                        playsInline
                                        style={{
                                            position:   'absolute',
                                            inset:      0,
                                            width:      '100%',
                                            height:     '100%',
                                            objectFit:  'contain',
                                            display:    'block',
                                        }}
                                        aria-label={t('videoHeading')}
                                    >
                                        <source src={videoUrl} type="video/mp4" />
                                        <p>{t('videoUnavailable')}</p>
                                    </video>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Privacy */}
                    <section aria-labelledby="import-privacy">
                        <h2 id="import-privacy" className="legal-page__section-title">
                            {t('privacyHeading')}
                        </h2>
                        <p className="legal-page__text">{t('privacyBody')}</p>
                    </section>

                    {/* Why Needed */}
                    <section aria-labelledby="import-why">
                        <h2 id="import-why" className="legal-page__section-title">
                            {t('whyNeededHeading')}
                        </h2>
                        <p className="legal-page__text">{t('whyNeededBody')}</p>
                    </section>

                    {/* Mid Banner Ad */}
                    <div>
                        <BannerAd placement="banner-content-how-to-import" format="rectangle" />
                    </div>

                    {/* Step 1 — Export */}
                    <section aria-labelledby="import-export">
                        <h2 id="import-export" className="legal-page__section-title">
                            {t('exportHeading')}
                        </h2>
                        <p className="legal-page__text" style={{ marginBottom: 'var(--space-5)' }}>
                            {t('exportIntro')}
                        </p>
                        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {exportSteps.map((key, i) => (
                                <li
                                    key={key}
                                    style={{
                                        display:    'flex',
                                        alignItems: 'flex-start',
                                        gap:        'var(--space-4)',
                                        padding:    'var(--space-4)',
                                        background: 'var(--color-surface)',
                                        border:     '2px solid var(--color-border-subtle)',
                                    }}
                                >
                                    <span
                                        className="font-display"
                                        style={{
                                            fontSize:      'var(--text-title-sm)',
                                            color:         'var(--color-accent)',
                                            letterSpacing: 'var(--tracking-display)',
                                            flexShrink:    0,
                                            lineHeight:    1,
                                            minWidth:      '2rem',
                                            textAlign:     'right',
                                        }}
                                        aria-hidden
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span style={{ fontSize: 'var(--text-body)', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                                        {t(key)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Step 2 — Find file */}
                    <section aria-labelledby="import-find">
                        <h2 id="import-find" className="legal-page__section-title">
                            {t('findFileHeading')}
                        </h2>
                        <p className="legal-page__text">{t('findFileBody')}</p>
                    </section>

                    {/* Step 3 — Upload */}
                    <section aria-labelledby="import-upload">
                        <h2 id="import-upload" className="legal-page__section-title">
                            {t('uploadHeading')}
                        </h2>
                        <p className="legal-page__text">{t('uploadBody')}</p>
                    </section>

                    {/* Limits */}
                    <section aria-labelledby="import-limits">
                        <h2 id="import-limits" className="legal-page__section-title">
                            {t('limitsHeading')}
                        </h2>
                        <p className="legal-page__text">{t('limitsBody')}</p>
                    </section>

                    {/* Troubleshooting */}
                    <section aria-labelledby="import-troubleshoot">
                        <h2 id="import-troubleshoot" className="legal-page__section-title">
                            {t('troubleshootHeading')}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                            {troubleItems.map(({ titleKey, bodyKey }) => (
                                <div
                                    key={titleKey}
                                    style={{
                                        padding:    'var(--space-5)',
                                        background: 'var(--color-surface)',
                                        border:     '2px solid var(--color-border-subtle)',
                                        borderLeft: '4px solid var(--color-warning)',
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize:      'var(--text-body)',
                                            fontWeight:    700,
                                            color:         'var(--color-foreground)',
                                            marginBottom:  'var(--space-2)',
                                        }}
                                    >
                                        {t(titleKey)}
                                    </h3>
                                    <p className="legal-page__text" style={{ marginTop: 0 }}>{t(bodyKey)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section>
                        <div
                            style={{
                                padding:      'var(--space-5)',
                                background:   'var(--color-surface)',
                                border:       '2px solid var(--color-border-subtle)',
                                borderLeft:   '4px solid var(--color-accent)',
                                marginBottom: 'var(--space-6)',
                            }}
                        >
                            <p className="legal-page__text" style={{ marginBottom: 'var(--space-3)' }}>
                                {t('howToPlayLink').split('→')[0]}
                            </p>
                            <Link href={`${prefix}/how-to-play`} className="legal-page__link" style={{ fontWeight: 700 }}>
                                {locale === 'de' ? 'Spielanleitung →' : 'How to Play →'}
                            </Link>
                        </div>
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

