'use client'

import { useEffect, useState } from 'react'

export function useAdBlockDetection(): { isBlocked: boolean; isChecking: boolean } {
    const [isBlocked,  setIsBlocked]  = useState(false)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function detect() {
            try {
                const res = await fetch(
                    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`,
                    { method: 'HEAD', cache: 'no-store' }
                )
                if (!cancelled) setIsBlocked(!res.ok)
            } catch {
                if (!cancelled) setIsBlocked(true)
            } finally {
                if (!cancelled) setIsChecking(false)
            }
        }

        void detect()
        return () => { cancelled = true }
    }, [])

    return { isBlocked, isChecking }
}
