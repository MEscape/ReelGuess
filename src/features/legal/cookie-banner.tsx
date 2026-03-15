'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CookieBanner — GDPR-compliant consent banner
//
// Shown when consent === null (user hasn't decided yet).
// Fully accessible: role="dialog", aria-modal, focus management.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useCookieConsent } from './cookie-consent-context'
import { CookieSettingsModal } from './cookie-settings-modal'
import {Button} from "@/components/ui";

export function CookieBanner() {
    const t = useTranslations('cookieConsent')
    const locale = useLocale()
    const { consent, acceptAll, rejectAll } = useCookieConsent()
    const [settingsOpen, setSettingsOpen] = useState(false)
    const acceptRef = useRef<HTMLButtonElement>(null)

    // Move focus to the Accept button when the banner appears
    useEffect(() => {
        if (consent === null) {
            const raf = requestAnimationFrame(() => acceptRef.current?.focus())
            return () => cancelAnimationFrame(raf)
        }
    }, [consent])

    // Banner only shown while consent is undecided
    if (consent !== null) return null

    const privacyHref = `/${locale === 'en' ? '' : locale + '/'}datenschutz`.replace('//', '/')

    return (
        <>
            {/* Backdrop — subtle, non-blocking */}
            <div
                className="cookie-backdrop"
                aria-hidden="true"
            />

            {/* Banner */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={t('ariaLabel')}
                aria-describedby="cookie-banner-desc"
                className="cookie-banner"
            >
                <div className="cookie-banner__inner">
                    {/* Content */}
                    <div className="cookie-banner__content">
                        <p className="cookie-banner__title">
                            {t('bannerTitle')}
                        </p>
                        <p id="cookie-banner-desc" className="cookie-banner__text">
                            {t('bannerText')}
                            {' '}
                            <Link
                                href={privacyHref}
                                className="cookie-banner__link"
                                tabIndex={0}
                            >
                                {t('privacyLink')}
                            </Link>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="cookie-banner__actions">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSettingsOpen(true)}
                        >
                            {t('customize')}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={rejectAll}
                        >
                            {t('rejectAll')}
                        </Button>
                        <Button
                            ref={acceptRef}
                            variant="primary"
                            size="sm"
                            onClick={acceptAll}
                        >
                            {t('acceptAll')}
                        </Button>
                    </div>
                </div>
            </div>

            <CookieSettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    )
}

