'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CookieSettingsModal — granular cookie category toggles
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useCookieConsent } from './cookie-consent-context'

type Props = {
    open:    boolean
    onClose: () => void
}

/**
 * Inner component — remounted every time the modal opens via `key={openCount}`.
 * This guarantees the `useState` initializer always reads the latest consent,
 * avoiding the stale-state bug without an ESLint-banned setState-in-effect.
 */
function CookieSettingsModalInner({ onClose }: { onClose: () => void }) {
    const t       = useTranslations('cookieConsent')
    const tCommon = useTranslations('common')
    const { consent, savePreferences } = useCookieConsent()

    // Initialised fresh on every mount (modal open), so it always reflects
    // the current consent — e.g. after "Accept All" was clicked.
    const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
        consent?.analytics ?? false
    )

    function handleSave() {
        savePreferences(analyticsEnabled)
        onClose()
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={t('settingsTitle')}
            subtitle={t('settingsSubtitle')}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {tCommon('cancel')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave}>
                        {t('save')}
                    </Button>
                </>
            }
        >
            <div className="cookie-settings__list">
                {/* Necessary — always on */}
                <div className="cookie-settings__item">
                    <div className="cookie-settings__header">
                        <span className="cookie-settings__label">
                            {t('necessary.label')}
                        </span>
                        <span className="cookie-settings__badge cookie-settings__badge--required">
                            ✓ {tCommon('confirm')}
                        </span>
                    </div>
                    <p className="cookie-settings__desc">
                        {t('necessary.description')}
                    </p>
                </div>

                {/* Analytics — toggleable */}
                <div className="cookie-settings__item">
                    <div className="cookie-settings__header">
                        <span className="cookie-settings__label">
                            {t('analytics.label')}
                        </span>
                        <button
                            role="switch"
                            aria-checked={analyticsEnabled}
                            aria-label={t('analytics.label')}
                            onClick={() => setAnalyticsEnabled((v) => !v)}
                            className={`cookie-toggle${analyticsEnabled ? ' cookie-toggle--on' : ''}`}
                            type="button"
                        >
                            <span className="cookie-toggle__thumb" />
                        </button>
                    </div>
                    <p className="cookie-settings__desc">
                        {t('analytics.description')}
                    </p>
                </div>
            </div>
        </Modal>
    )
}

export function CookieSettingsModal({ open, onClose }: Props) {
    // Render nothing when closed — and remount the inner component each time
    // the modal opens so useState always initialises from fresh consent.
    if (!open) return null
    return <CookieSettingsModalInner onClose={onClose} />
}


