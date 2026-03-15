'use client'

import { InterstitialAd } from './interstitial-ad'
import type { AdPlacement } from '@/lib/ads/types'

type Props = {
    placement?: Extract<AdPlacement, `rewarded-${string}`>
    onClose:  () => void
    onReward: () => void
}

export function RewardedAd({ placement = 'rewarded-bonus', onClose, onReward }: Props) {
    return (
        <InterstitialAd
            placement={placement}
            onClose={onClose}
            onReward={onReward}
        />
    )
}