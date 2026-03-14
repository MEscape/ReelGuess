'use client'

import { useState, useCallback, useEffect } from 'react'
import {
    getLocalReels,
    addLocalReels,
    removeLocalReel,
    clearLocalReels,
} from '../stores/local-reel-store'
import type { LocalReel, AddReelsResult } from '../types'
import {STORAGE_EVENT_KEY} from "../constants";

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
 *
 * ### `startTransition` removal
 * The hydration read (`setReels(getLocalReels())`) is an urgent correction —
 * the user would briefly see stale `count: 0` if deferred. `startTransition`
 * is reserved for genuinely non-urgent background updates and is not used here.
 *
 * ### `broadcastChange` stability
 * `broadcastChange` is `useCallback([])` so its identity never changes. This
 * makes it safe to call from `addReels`, `removeReel`, and `clear` without
 * adding it to their dependency arrays (a stable reference is never stale).
 */
export function useLocalReels() {
    // Always initialise to [] so the server render and the client's hydration
    // pass produce identical output. The real localStorage values are synced in
    // the effect below, which runs only after hydration is complete.
    const [reels, setReels] = useState<LocalReel[]>([])

    // Sync all hook instances (same tab + other tabs) when storage changes.
    useEffect(() => {
        // Urgent correction — read real data immediately after hydration.
        // Not wrapped in startTransition: the user sees stale count if deferred.
        setReels(getLocalReels())

        function handleStorage(e: StorageEvent) {
            // null key = localStorage.clear(); our key = our write
            if (e.key === null || e.key === STORAGE_EVENT_KEY) {
                setReels(getLocalReels())
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    /**
     * Triggers a synthetic storage event so sibling instances on the same page sync.
     * Stable reference (useCallback with [] deps) — safe to call from any
     * useCallback without being listed as a dependency.
     */
    const broadcastChange = useCallback((): void => {
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_EVENT_KEY }))
    }, [])

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
    }, [broadcastChange])

    const removeReel = useCallback((url: string): void => {
        const updated = removeLocalReel(url)
        setReels(updated)
        broadcastChange()
    }, [broadcastChange])

    const clear = useCallback((): void => {
        clearLocalReels()
        setReels([])
        broadcastChange()
    }, [broadcastChange])

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
