/**
 * Instagram data-export parsing utilities.
 *
 * Extracted from ImportFlow.tsx so parsing logic is independently testable
 * without mounting a React component.
 */

import { MAX_REELS } from '../validations'

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns `true` if the parsed JSON looks like an Instagram `liked_posts.json`.
 *
 * The file is an array of objects, each having a `label_values` array.
 * This is a lightweight shape-check — not a full schema validation.
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

/** Matches a clean Instagram Reel URL (no query params). */
const REEL_URL_RE = /https?:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+/

/**
 * Extracts and shuffles Instagram Reel URLs from a `liked_posts.json` export.
 *
 * Steps:
 * 1. Walk every `label_values` entry looking for `{ label: "URL", href: "…/reel/…" }`.
 * 2. Deduplicate via a Set.
 * 3. Fisher-Yates shuffle to prevent guessing order.
 * 4. Cap at `maxReels` to keep game balanced.
 *
 * @param json     - Parsed JSON (already validated with {@link isLikedPostsJson}).
 * @param maxReels - Upper bound on returned URLs. @default MAX_REELS (50)
 */
export function extractReelsFromInstagramExport(
    json: unknown,
    maxReels = MAX_REELS,
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

            const match = e.href.match(REEL_URL_RE)
            if (match) urls.add(match[0])
        }
    }

    // Fisher-Yates shuffle
    const arr = [...urls]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }

    return arr.slice(0, maxReels)
}