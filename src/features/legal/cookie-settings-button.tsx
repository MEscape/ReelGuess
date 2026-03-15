'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CookieSettingsButton — opens the settings modal from the footer.
// Client-only because it requires cookie consent context.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { CookieSettingsModal } from '@/features/legal/cookie-settings-modal'

type Props = {
    label: string
}

export function CookieSettingsButton({ label }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="site-footer__link site-footer__link--button"
            >
                {label}
            </button>
            <CookieSettingsModal
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    )
}

