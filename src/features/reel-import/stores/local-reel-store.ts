/**
 * LocalReelStore — client-side localStorage persistence for imported Reels.
 *
 * Design decisions:
 * - Completely independent of any lobby; users import before creating/joining.
 * - No hard cap on stored reels — the game layer enforces MAX_REELS at session time.
 * - Versioned key (`rg_reels_v1`) enables future migrations without data loss.
 * - All exports are pure functions (no React) — use `useLocalReels` for reactive UI.
 */

import type { LocalReel, LocalReelStore, AddReelsResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY     = 'rg_reels_v1'
const CURRENT_VERSION = 1

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function isServer(): boolean {
    return typeof window === 'undefined'
}

function readStore(): LocalReelStore {
    if (isServer()) return { reels: [], version: CURRENT_VERSION }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { reels: [], version: CURRENT_VERSION }
        const parsed = JSON.parse(raw) as Partial<LocalReelStore>
        if (parsed.version !== CURRENT_VERSION) {
            return { reels: [], version: CURRENT_VERSION }
        }
        return { reels: parsed.reels ?? [], version: CURRENT_VERSION }
    } catch {
        return { reels: [], version: CURRENT_VERSION }
    }
}

function writeStore(store: LocalReelStore): void {
    if (isServer()) return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
        // Silently ignore QuotaExceededError — extremely unlikely with URLs only
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all locally stored reels. */
export function getLocalReels(): LocalReel[] {
    return readStore().reels
}

/** Returns the number of stored reels. */
export function getLocalReelCount(): number {
    return readStore().reels.length
}

/**
 * Adds new reel URLs to the store, deduplicating by URL.
 * Existing reels are preserved; only truly new URLs are appended.
 *
 * @returns Full result with counts for UI feedback.
 */
export function addLocalReels(urls: string[]): AddReelsResult {
    const store    = readStore()
    const existing = new Set(store.reels.map((r) => r.url))
    const now      = Date.now()

    const newReels: LocalReel[] = urls
        .filter((url) => !existing.has(url))
        .map((url)    => ({ url, importedAt: now }))

    const updated = { ...store, reels: [...store.reels, ...newReels] }
    writeStore(updated)

    return {
        reels:      updated.reels,
        added:      newReels.length,
        duplicates: urls.length - newReels.length,
        total:      updated.reels.length,
    }
}

/** Removes a single reel by URL. Returns the updated list. */
export function removeLocalReel(url: string): LocalReel[] {
    const store   = readStore()
    const updated = { ...store, reels: store.reels.filter((r) => r.url !== url) }
    writeStore(updated)
    return updated.reels
}

/** Clears all locally stored reels. */
export function clearLocalReels(): void {
    writeStore({ reels: [], version: CURRENT_VERSION })
}