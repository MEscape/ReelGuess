'use client'

// ─────────────────────────────────────────────────────────────────────────────
// AdBlockGuard — wraps any subtree and overlays AdBlockWall if a blocker is
// detected AND the ad system is fully configured (publisher ID present).
//
// Usage in layout.tsx:
//   <AdBlockGuard>{children}</AdBlockGuard>
//
// The guard is silent during the async probe (isChecking = true) so there is
// no flash of the wall on first load. Only after confirmation does it block.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react'
import { useAdBlockDetection } from '../hooks/use-ad-block-detection'
import { AdBlockWall }         from './ad-block-wall'

type Props = { children: ReactNode }

export function AdBlockGuard({ children }: Props) {
    const { isBlocked, isChecking } = useAdBlockDetection()

    // Only show the wall when:
    // 1. The probe has completed (not still checking)
    // 2. An ad blocker was detected
    // 3. The site actually has an AdSense publisher ID configured
    const publisherConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_ID)

    if (!isChecking && isBlocked && !publisherConfigured) {
        return <AdBlockWall />
    }

    return <>{children}</>
}

