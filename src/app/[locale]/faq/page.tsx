import type { Metadata }      from 'next'
import Link                    from 'next/link'
import { getTranslations }     from 'next-intl/server'
import { BannerAd }            from '@/features/ads'
import { JsonLd }              from '@/components/seo/json-ld'
import {buildFaqSchema} from "@/components/seo/structured-data";

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t       = await getTranslations({ locale, namespace: 'seo.faq' })
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'
    const path    = locale === 'en' ? '/faq' : `/${locale}/faq`

    return {
        title:       t('title'),
        description: t('description'),
        alternates: {
            canonical: `${baseUrl}${path}`,
            languages: {
                en:          `${baseUrl}/faq`,
                de:          `${baseUrl}/de/faq`,
                'x-default': `${baseUrl}/faq`,
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

export default async function FaqPage({ params }: Props) {
    const { locale } = await params
    const typedLocale = (locale === 'de' ? 'de' : 'en') as 'en' | 'de'
    const t      = await getTranslations({ locale, namespace: 'faq' })
    const prefix = locale === 'en' ? '' : `/${locale}`

    const questions = t.raw('questions') as Array<{ q: string; a: string }>

    // Split into two halves for mid-page ad placement
    const half = Math.ceil(questions.length / 2)
    const firstHalf  = questions.slice(0, half)
    const secondHalf = questions.slice(half)

    return (
        <>
            <JsonLd schema={buildFaqSchema(questions, typedLocale)} />

            <main id="main-content" className="legal-page pb-safe" aria-labelledby="faq-page-title">
                <div className="legal-page__container">

                    {/* ── Header ─────────────────────────────────────────────── */}
                    <header className="legal-page__header">
                        <h1 id="faq-page-title" className="legal-page__title">
                            {t('title')}
                        </h1>
                        <p className="legal-page__intro">{t('subtitle')}</p>
                    </header>

                    {/* Top Banner Ad */}
                    <div style={{ marginBottom: 'var(--space-10)' }}>
                        <BannerAd placement="banner-content-faq" format="horizontal" />
                    </div>

                    <article className="legal-page__content">

                        {/* Intro */}
                        <section>
                            <p className="legal-page__text" style={{ fontSize: 'var(--text-body-lg)', lineHeight: 1.8 }}>
                                {t('intro')}
                            </p>
                        </section>

                        {/* First half of questions */}
                        <section aria-label="FAQ first section">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {firstHalf.map(({ q, a }, i) => (
                                    <FaqItem key={i} question={q} answer={a} index={i} />
                                ))}
                            </div>
                        </section>

                        {/* Mid Banner Ad */}
                        <div>
                            <BannerAd placement="banner-content-faq" format="rectangle" />
                        </div>

                        {/* Second half of questions */}
                        <section aria-label="FAQ second section">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {secondHalf.map(({ q, a }, i) => (
                                    <FaqItem key={i + half} question={q} answer={a} index={i + half} />
                                ))}
                            </div>
                        </section>

                        {/* Internal links */}
                        <section>
                            <div
                                style={{
                                    display:     'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                                    gap:         'var(--space-3)',
                                }}
                            >
                                {[
                                    { href: `${prefix || '/'}`,              label: locale === 'de' ? '🎮 Jetzt spielen' : '🎮 Play Now'          },
                                    { href: `${prefix}/how-to-play`,          label: locale === 'de' ? '📖 Spielanleitung' : '📖 How to Play'       },
                                    { href: `${prefix}/how-to-import`,        label: locale === 'de' ? '📥 Import-Leitfaden' : '📥 Import Guide'    },
                                    { href: `${prefix}/about`,                label: locale === 'de' ? 'ℹ️ Über uns' : 'ℹ️ About'                  },
                                ].map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="btn btn-ghost btn-md"
                                        style={{ justifyContent: 'flex-start' }}
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </section>

                    </article>
                </div>
            </main>
        </>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Item — details/summary accordion
// ─────────────────────────────────────────────────────────────────────────────

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
    return (
        <details
            style={{
                background: 'var(--color-surface)',
                border:     '2px solid var(--color-border-subtle)',
                transition: 'border-color 220ms linear',
            }}
        >
            <summary
                style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           'var(--space-3)',
                    padding:       'var(--space-4) var(--space-5)',
                    cursor:        'pointer',
                    listStyle:     'none',
                    fontWeight:    700,
                    fontSize:      'var(--text-body)',
                    color:         'var(--color-foreground)',
                    lineHeight:    1.5,
                    userSelect:    'none',
                }}
            >
                <span
                    className="font-display"
                    style={{
                        fontSize:      'var(--text-label-xs)',
                        color:         'var(--color-accent)',
                        letterSpacing: 'var(--tracking-label)',
                        flexShrink:    0,
                    }}
                    aria-hidden
                >
                    {String(index + 1).padStart(2, '0')}
                </span>
                <span style={{ flex: 1 }}>{question}</span>
                <span
                    className="font-display"
                    style={{
                        fontSize:   'var(--text-ui)',
                        color:      'var(--color-accent)',
                        flexShrink: 0,
                        lineHeight: 1,
                    }}
                    aria-hidden
                >
                    +
                </span>
            </summary>
            <div
                style={{
                    padding:    'var(--space-4) var(--space-5) var(--space-5)',
                    borderTop:  '1px solid var(--color-border)',
                }}
            >
                <p
                    style={{
                        fontSize:   'var(--text-body)',
                        color:      'var(--color-muted)',
                        lineHeight: 1.8,
                        margin:     0,
                    }}
                >
                    {answer}
                </p>
            </div>
        </details>
    )
}

