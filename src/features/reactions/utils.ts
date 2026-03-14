import {MAX_PROCESSED_IDS} from "./constants";

/**
 * Prunes the oldest half of `set` when it exceeds `MAX_PROCESSED_IDS`.
 * Sets maintain insertion order, so `[...set].slice(0, n)` gives the oldest entries.
 * Called before each insert — O(1) amortised cost.
 */
export function pruneProcessedIds(set: Set<string>): void {
    if (set.size < MAX_PROCESSED_IDS) return
    const toDelete = [...set].slice(0, MAX_PROCESSED_IDS / 2)
    for (const id of toDelete) set.delete(id)
}