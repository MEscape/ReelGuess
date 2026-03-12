'use client'

import { useState, useCallback, useEffect, startTransition } from 'react'
import {
    getLocalReels,
    addLocalReels,
    removeLocalReel,
    clearLocalReels,
} from '../stores/local-reel-store'
import type { LocalReel, AddReelsResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_EVENT_KEY = 'rg_reels_v1'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reactive wrapper around the localStorage reel store.
 *
 * Key design decisions:
 * - Reads synchronously on init so `hasReels` / `count` are correct on the
 *   first render after hydration — no empty-array flash.
 * - Listens to the native `storage` event so all mounted instances on the page
 *   (and across tabs) stay in sync without a page refresh.
 * - Dispatches a synthetic `storage` event after same-tab writes so sibling
 *   instances update immediately.
 * - `addReels` returns an {@link AddReelsResult} with `added` / `duplicates`
 *   counts for rich UI feedback.
 */
export function useLocalReels() {
    // Always initialise to [] so the server render and the client's hydration
    // pass produce identical output. The real localStorage values are synced in
    // the effect below, which runs only after hydration is complete.
    const [reels, setReels] = useState<LocalReel[]>([])

    // Sync all hook instances (same tab + other tabs) when storage changes.
    useEffect(() => {
        // Read real data from localStorage immediately after hydration.
        startTransition(() => setReels(getLocalReels()))

        function handleStorage(e: StorageEvent) {
            // null key = localStorage.clear(); our key = our write
            if (e.key === null || e.key === STORAGE_EVENT_KEY) {
                setReels(getLocalReels())
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    /** Triggers a synthetic storage event so sibling instances on the same page sync. */
    function broadcastChange(): void {
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_EVENT_KEY }))
    }

    /** Re-reads from localStorage. Useful after an out-of-band write. */
    const reloadFromStorage = useCallback(() => {
        setReels(getLocalReels())
    }, [])

    /**
     * Adds new URLs, deduplicating against the existing pool.
     * Returns full {@link AddReelsResult} for UI feedback.
     */
    const addReels = useCallback((urls: string[]): AddReelsResult => {
        const result = addLocalReels(urls)
        setReels(result.reels)
        broadcastChange()
        return result
    }, [])

    const removeReel = useCallback((url: string): void => {
        const updated = removeLocalReel(url)
        setReels(updated)
        broadcastChange()
    }, [])

    const clear = useCallback((): void => {
        clearLocalReels()
        setReels([])
        broadcastChange()
    }, [])

    return {
        reels,
        count:             reels.length,
        hasReels:          reels.length > 0,
        addReels,
        removeReel,
        clear,
        reloadFromStorage,
    }
}