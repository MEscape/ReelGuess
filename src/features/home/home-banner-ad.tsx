'use client'
// HomeBannerAd — thin client wrapper so the SSR home page can include the ad slot.
import { BannerAd } from '@/features/ads'
export function HomeBannerAd() {
    return (
        <div className="w-full max-w-sm mt-4" aria-label="Advertisement">
            <BannerAd placement="banner-lobby" format="horizontal" />
        </div>
    )
}