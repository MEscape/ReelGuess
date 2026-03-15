/**
 * rewardSlotsStore — persists the number of extra reel slots earned
 * by watching Rewarded Ads. Stored in localStorage under `rg_reward_slots`.
 */

import { REWARD_SLOTS_KEY } from '../constants'

function isServer(): boolean { return typeof window === 'undefined' }

export function getRewardSlots(): number {
    if (isServer()) return 0
    try {
        const raw = localStorage.getItem(REWARD_SLOTS_KEY)
        if (!raw) return 0
        const n = parseInt(raw, 10)
        return isNaN(n) ? 0 : Math.max(0, n)
    } catch { return 0 }
}

export function addRewardSlots(extra: number): number {
    const current = getRewardSlots()
    const next = current + extra
    if (!isServer()) {
        try { localStorage.setItem(REWARD_SLOTS_KEY, String(next)) } catch { /* ignore */ }
    }
    return next
}

