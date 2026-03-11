'use client'

import { memo, useMemo } from 'react'
import { createAvatar }  from '@dicebear/core'
import * as bottts       from '@dicebear/bottts'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlayerAvatarProps = {
    /** DiceBear seed string — determines the generated avatar. */
    seed:       string
    /** Pixel size (width = height). @default 48 */
    size?:      number
    className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic robot avatar generated from a seed string.
 *
 * `createAvatar` (SVG generation) is CPU-intensive. `useMemo` ensures it only
 * runs when `seed` or `size` change. `memo` prevents re-renders when the parent
 * updates unrelated state (e.g. vote counts).
 */
export const PlayerAvatar = memo(function PlayerAvatar({
                                                           seed,
                                                           size      = 48,
                                                           className = '',
                                                       }: PlayerAvatarProps) {
    const dataUri = useMemo(
        () => createAvatar(bottts, { seed, size }).toDataUri(),
        [seed, size],
    )

    return (
        <img
            src={dataUri}
            alt={`Avatar for player`}
            width={size}
            height={size}
            className={`rounded-full border-2 border-[var(--color-accent)] ${className}`}
        />
    )
})
