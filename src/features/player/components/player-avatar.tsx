'use client'

import { memo, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { createAvatar }  from '@dicebear/core'
import * as bottts       from '@dicebear/bottts'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlayerAvatarProps = {
    /** DiceBear seed string — determines the generated avatar. */
    seed:       string
    /**
     * Player display name — used for accessible `alt` text.
     * When provided: `"Avatar for {name}"`.
     * When omitted: `"Player avatar"` (generic fallback).
     *
     * Always provide this when rendering a list of players (leaderboard,
     * lobby) so screen readers can distinguish between avatars.
     */
    name?:      string
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
 *
 * ### Border token
 * `borderColor` is applied via `style` (not a Tailwind arbitrary value) so it
 * is consistent with the design token usage pattern in this codebase. If
 * `--color-accent` is undefined in the current theme, the border renders
 * transparent — visible in dev rather than silently wrong.
 *
 * ### Accessibility
 * Pass `name` whenever this component is rendered in a list. Without it,
 * a screen reader announces "Player avatar" for every item, making the list
 * indistinguishable.
 */
export const PlayerAvatar = memo(function PlayerAvatar({
                                                           seed,
                                                           name,
                                                           size      = 48,
                                                           className = '',
                                                       }: PlayerAvatarProps) {
    const dataUri = useMemo(
        () => createAvatar(bottts, { seed, size }).toDataUri(),
        [seed, size],
    )
    const t       = useTranslations('player')

    return (
        <img
            src={dataUri}
            alt={name ? t('avatarAlt', { name }) : t('avatarAltGeneric')}
            width={size}
            height={size}
            className={`rounded-full border-2 ${className}`}
            style={{ borderColor: 'var(--color-accent)' }}
        />
    )
})