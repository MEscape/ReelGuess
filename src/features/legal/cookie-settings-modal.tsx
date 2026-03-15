'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useCookieConsent } from './cookie-consent-context'
import type { AdvertisingConsent } from './cookie-consent-context'

type Props = {
    open:    boolean
    onClose: () => void
}

function CookieSettingsModalInner({ onClose }: { onClose: () => void }) {
    const t       = useTranslations('cookieConsent')
    const tCommon = useTranslations('common')
    const { consent, savePreferences } = useCookieConsent()

    // consent is ConsentState | null — null means banner not yet answered.
    // Fall back to safe defaults if somehow opened before consent is set.
    const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
        consent !== null ? consent.analytics : false
    )
    const [adLevel, setAdLevel] = useState<AdvertisingConsent>(
        consent !== null ? consent.advertising : 'non-personalized'
    )

    function handleSave() {
        savePreferences(analyticsEnabled, adLevel)
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
                        <span className="cookie-settings__label">{t('necessary.label')}</span>
                        <span className="cookie-settings__badge cookie-settings__badge--required">
                            ✓ {tCommon('confirm')}
                        </span>
                    </div>
                    <p className="cookie-settings__desc">{t('necessary.description')}</p>
                </div>

                {/* Analytics — toggle */}
                <div className="cookie-settings__item">
                    <div className="cookie-settings__header">
                        <span className="cookie-settings__label">{t('analytics.label')}</span>
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
                    <p className="cookie-settings__desc">{t('analytics.description')}</p>
                </div>

                {/* Advertising — non-personalized cannot be turned off (TTDSG §25 II) */}
                <div className="cookie-settings__item">
                    <div className="cookie-settings__header" style={{ marginBottom: '0.5rem' }}>
                        <span className="cookie-settings__label">{t('advertising.label')}</span>
                        <span className="cookie-settings__badge cookie-settings__badge--required">
                            ✓ {t('advertising.alwaysOn')}
                        </span>
                    </div>
                    <p className="cookie-settings__desc" style={{ marginBottom: '0.75rem' }}>
                        {t('advertising.descriptionLegal')}
                    </p>
                    <div
                        role="radiogroup"
                        aria-label={t('advertising.label')}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                        <label className="cookie-settings__radio-option">
                            <input
                                type="radio"
                                name="ad-level"
                                value="personalized"
                                checked={adLevel === 'personalized'}
                                onChange={() => setAdLevel('personalized')}
                            />
                            <span className="cookie-settings__radio-dot" aria-hidden />
                            <span className="cookie-settings__radio-text">
                                <span className="cookie-settings__radio-label">{t('advertising.personalized')}</span>
                                <span className="cookie-settings__radio-desc">{t('advertising.personalizedDesc')}</span>
                            </span>
                        </label>
                        <label className="cookie-settings__radio-option">
                            <input
                                type="radio"
                                name="ad-level"
                                value="non-personalized"
                                checked={adLevel === 'non-personalized'}
                                onChange={() => setAdLevel('non-personalized')}
                            />
                            <span className="cookie-settings__radio-dot" aria-hidden />
                            <span className="cookie-settings__radio-text">
                                <span className="cookie-settings__radio-label">{t('advertising.nonPersonalized')}</span>
                                <span className="cookie-settings__radio-desc">{t('advertising.nonPersonalizedDesc')}</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export function CookieSettingsModal({ open, onClose }: Props) {
    if (!open) return null
    return <CookieSettingsModalInner onClose={onClose} />
}