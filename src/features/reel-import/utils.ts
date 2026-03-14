import {LOCAL_MAX_REELS, MAX_REELS} from './constants'
import type { LocalReel }     from './types'
import {InstagramReelUrlSchema} from "./validations";

// ─────────────────────────────────────────────────────────────────────────────
// Shuffle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-place Fisher-Yates shuffle.
 *
 * Mutates `arr` directly — callers that need the original array should pass a
 * copy. Every permutation is equally likely in O(n) time.
 *
 * Shared by `parse-export.ts` (client-side extraction) and `game-reels.ts`
 * (server-side selection) to avoid duplication.
 */
export function fisherYatesShuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Game reel selection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Randomly selects up to `count` reel URLs from the local pool for a game session.
 *
 * Uses Fisher-Yates so every reel has an equal chance of being picked.
 * Returns URL strings only — the game layer doesn't need metadata.
 *
 * Called server-side in `actions.ts` — the client cannot influence which reels
 * are selected, preventing cherry-picking.
 *
 * @param reels - Full local reel pool (already validated by the action).
 * @param count - Max reels to select. Defaults to {@link MAX_REELS}.
 */
export function selectGameReels(reels: LocalReel[], count: number = MAX_REELS): string[] {
    const arr = reels.map((r) => r.url)
    fisherYatesShuffle(arr)
    return arr.slice(0, count)
}

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns `true` if the parsed JSON looks like an Instagram `liked_posts.json`.
 *
 * The file is an array of objects each having a `label_values` array.
 * Lightweight shape-check — not a full schema validation.
 */
export function isLikedPostsJson(json: unknown): boolean {
    if (!Array.isArray(json) || json.length === 0) return false
    return json.some(
        (item) =>
            item !== null &&
            typeof item === 'object' &&
            'label_values' in item &&
            Array.isArray((item as Record<string, unknown>).label_values),
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts and shuffles Instagram Reel URLs from a `liked_posts.json` export.
 *
 * Steps:
 * 1. Walk every `label_values` entry for `{ label: "URL", href: "…/reel/…" }`.
 * 2. Deduplicate via a Set.
 * 3. Fisher-Yates shuffle to prevent guessing order.
 * 4. Cap at `maxReels` to avoid unbounded memory usage.
 *
 * Default cap is LOCAL_MAX_REELS (500) — enough for any realistic export while
 * preventing runaway allocations. Pass `Infinity` to get everything.
 *
 * @param json     - Parsed JSON (already validated with {@link isLikedPostsJson}).
 * @param maxReels - Upper bound on returned URLs. Defaults to LOCAL_MAX_REELS.
 */
export function extractReelsFromInstagramExport(
    json:     unknown,
    maxReels: number = LOCAL_MAX_REELS,
): string[] {
    if (!Array.isArray(json)) return []

    const urls = new Set<string>()

    for (const item of json) {
        if (!item || typeof item !== 'object') continue
        const labelValues = (item as Record<string, unknown>).label_values
        if (!Array.isArray(labelValues)) continue

        for (const entry of labelValues) {
            if (!entry || typeof entry !== 'object') continue
            const e = entry as Record<string, unknown>
            if (e.label !== 'URL' || typeof e.href !== 'string') continue

            const result = InstagramReelUrlSchema.safeParse(e.href)

            if (result.success) {
                urls.add(result.data)
            }
        }
    }

    const arr = [...urls]
    fisherYatesShuffle(arr)
    return arr.slice(0, maxReels)
}