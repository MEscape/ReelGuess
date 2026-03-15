// ─────────────────────────────────────────────────────────────────────────────
// Footer — persistent site footer with legal links
//
// Server Component — locale-aware links, translations from next-intl.
// CookieSettingsButton is extracted as a separate client component.
// ─────────────────────────────────────────────────────────────────────────────

import Link                  from 'next/link'
import { getTranslations }   from 'next-intl/server'
import { CookieSettingsButton } from '@/features/legal'

type Props = {
    locale: string
}

export async function Footer({ locale }: Props) {
    const t    = await getTranslations({ locale, namespace: 'footer' })
    const year = new Date().getFullYear()

    const prefix = locale === 'en' ? '' : `/${locale}`

    const legalLinks = [
        { key: 'impressum',   href: `${prefix}/impressum`  },
        { key: 'datenschutz', href: `${prefix}/datenschutz` },
        { key: 'agb',         href: `${prefix}/agb`         },
    ] as const

    return (
        <footer
            className="site-footer"
            aria-label={t('ariaLabel')}
        >
            <div className="site-footer__inner">
                {/* Left: brand + copyright */}
                <div className="site-footer__brand">
                    <Link href={prefix || '/'} className="site-footer__logo" aria-label="ReelGuess home">
                        <span className="font-display uppercase" style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)' }}>
                            <span style={{ color: 'var(--color-foreground)' }}>Reel</span>
                            <span style={{ color: 'var(--color-accent)' }}>Guess</span>
                        </span>
                    </Link>
                    <p className="site-footer__copy">
                        {t('copyright', { year })}
                    </p>
                </div>

                {/* Right: legal nav */}
                <nav aria-label="Legal navigation" className="site-footer__nav">
                    <ul className="site-footer__links">
                        {legalLinks.map(({ key, href }) => (
                            <li key={key}>
                                <Link
                                    href={href}
                                    className="site-footer__link"
                                >
                                    {t(`links.${key}` as Parameters<typeof t>[0])}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <CookieSettingsButton
                                label={t('links.cookieSettings')}
                            />
                        </li>
                    </ul>
                </nav>
            </div>
        </footer>
    )
}

