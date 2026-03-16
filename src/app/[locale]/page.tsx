import Image                          from 'next/image'
import { getTranslations }            from 'next-intl/server'
import type { Metadata }              from 'next'
import { CreateLobbySection, JoinLobbySection, ManageReelsSection } from '@/features/home'
import { ShareCard }                  from '@/features/home/share-card'
import { JsonLd }                     from '@/components/seo/json-ld'
import { buildWebAppSchema, buildBreadcrumbSchema, buildOrganizationSchema } from '@/components/seo/structured-data'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'seo.home' })
    return {
        title:       t('title'),
        description: t('description'),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HomePage — async Server Component
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
    const { locale } = await params
    const typedLocale = (locale === 'de' ? 'de' : 'en') as 'en' | 'de'

    // Server-side translations — no hooks in async components
    const t       = await getTranslations({ locale, namespace: 'home' })
    const tCommon = await getTranslations({ locale, namespace: 'common' })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reelguess.app'

    const HOW_TO_PLAY = [
        { step: t('howToPlay.step1.step'), emoji: t('howToPlay.step1.emoji'), label: t('howToPlay.step1.label') },
        { step: t('howToPlay.step2.step'), emoji: t('howToPlay.step2.emoji'), label: t('howToPlay.step2.label') },
        { step: t('howToPlay.step3.step'), emoji: t('howToPlay.step3.emoji'), label: t('howToPlay.step3.label') },
    ]

    return (
        <>
            {/* ── Structured Data ──────────────────────────────────────── */}
            <JsonLd schema={buildWebAppSchema(baseUrl, typedLocale)} />
            <JsonLd schema={buildBreadcrumbSchema(baseUrl, typedLocale)} />
            <JsonLd schema={buildOrganizationSchema(baseUrl)} />

            <main className="flex flex-col flex-1 items-center justify-center px-4 py-12 pb-safe">

                {/* ── HERO ──────────────────────────────────────────────── */}
                <header className="w-full max-w-sm text-center mb-10">

                    {/* Logo — bounces via brutal-bounce keyframe */}
                    <div
                        className="flex justify-center mb-4"
                        style={{ animation: 'brutal-bounce 1.4s var(--ease-spring) infinite alternate' }}
                    >
                        <Image
                            src="/logo.png"
                            alt={tCommon('appName')}
                            width={96}
                            height={96}
                            priority
                            style={{
                                filter: 'drop-shadow(0 0 12px rgba(245,200,0,0.45)) drop-shadow(0 0 32px rgba(245,200,0,0.18))',
                                objectFit: 'contain',
                            }}
                        />
                    </div>

                    {/* Title */}
                    <h1
                        className="font-display uppercase leading-none text-[var(--color-accent)]"
                        style={{
                            fontSize:      'clamp(3.5rem, 18vw, 5rem)',
                            letterSpacing: 'var(--tracking-display)',
                            textShadow: [
                                '0 0 15px rgba(245,200,0,0.55)',
                                '0 0 40px rgba(245,200,0,0.32)',
                                '0 0 90px rgba(245,200,0,0.15)',
                            ].join(', '),
                        }}
                    >
                        {tCommon('appName')}
                    </h1>

                    {/* Tagline */}
                    <p
                        className="font-sans font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] mt-2 mb-8"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        {tCommon('appTagline')}
                    </p>

                    {/* ── HOW TO PLAY strip ─────────────────────────────── */}
                    <div
                        className="grid grid-cols-3 border-2 border-[var(--color-border-subtle)] shadow-brutal"
                        role="list"
                        aria-label={t('howToPlay.title')}
                    >
                        {HOW_TO_PLAY.map(({ step, emoji, label }, i) => (
                            <div
                                key={i}
                                role="listitem"
                                className={[
                                    'flex flex-col items-center gap-2 py-3.5 px-2',
                                    i < HOW_TO_PLAY.length - 1
                                        ? 'border-r-2 border-[var(--color-border-subtle)]'
                                        : '',
                                ].join(' ')}
                            >
                                <span
                                    className="font-display text-[var(--color-accent)]"
                                    aria-hidden="true"
                                    style={{ fontSize: 'var(--text-label-xs)', letterSpacing: '0.2em' }}
                                >
                                    {step}
                                </span>
                                <span className="text-xl leading-none" aria-hidden="true">{emoji}</span>
                                <span
                                    className="font-display uppercase text-[var(--color-muted)] leading-tight text-center"
                                    style={{ fontSize: 'var(--text-label-xs)', letterSpacing: 'var(--tracking-label)' }}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>

                </header>

                {/* ── ACTION PANEL ──────────────────────────────────────── */}
                <div className="w-full max-w-sm flex flex-col gap-0">
                    <CreateLobbySection />
                    <div className="divider py-3" aria-hidden="true">{tCommon('or')}</div>
                    <JoinLobbySection />
                    <div className="divider py-3" aria-hidden="true">{t('myReels')}</div>
                    <ManageReelsSection />
                </div>

                {/* ── SEO CONTENT ────────────────────────────────────── */}
                <section
                    className="w-full max-w-sm my-8 text-center"
                    aria-label={typedLocale === 'de' ? 'Über ReelGuess' : 'About ReelGuess'}
                >
                    <p
                        className="font-sans text-[var(--color-subtle)]"
                        style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.6 }}
                    >
                        {typedLocale === 'de'
                            ? 'ReelGuess ist das virale Partyspiel für Freunde. Importiere deine Instagram Reels, erstelle eine Lobby und rate gemeinsam, wer was geliked hat. Bis zu 8 Spieler — kostenlos, ohne Account.'
                            : 'ReelGuess is the viral party game for friends. Import your Instagram Reels, create a lobby and guess together who liked what. Up to 8 players — free, no account needed.'}
                    </p>
                </section>


            </main>

            {/* ── SHARE NUDGE — Client Component, shown after 4.5 s ────── */}
            <ShareCard delay={4500} />
        </>
    )
}


