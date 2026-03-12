'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion }          from 'framer-motion'

import { FloatingReaction }         from './FloatingReaction'
import { useReactions }             from '../hooks/useReactions'
import { useReactionCooldown, COOLDOWN_MS } from '../hooks/useReactionCooldown'
import { REACTION_EMOJIS }          from '../types'
import type { ReactionEmoji, Reaction } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ReactionBarProps = {
    lobbyId:  string
    playerId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emoji reaction bar — shown during the reveal phase.
 *
 * Responsibilities:
 * - Renders a horizontal strip of emoji buttons.
 * - On press, POSTs the reaction to `/api/reactions` and starts the cooldown.
 * - Subscribes to Supabase Realtime so reactions from all players float up.
 * - Removes floating emojis after their animation completes.
 */
export function ReactionBar({ lobbyId, playerId }: ReactionBarProps) {
    const { reactions }                            = useReactions(lobbyId, true)
    const { canReact, msRemaining, startCooldown } = useReactionCooldown()

    // Floating reactions visible on this client (union of all players' reactions)
    const [floating, setFloating] = useState<Reaction[]>([])

    // Sync incoming realtime reactions into the floating set.
    // We track the last-seen length to only add newly arrived reactions.
    const [lastSeenCount, setLastSeenCount] = useState(0)
    useEffect(() => {
        if (reactions.length > lastSeenCount) {
            const newReactions = reactions.slice(lastSeenCount)
            setLastSeenCount(reactions.length)
            setFloating((prev) => [...prev, ...newReactions])
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reactions])

    const handleRemoveFloating = useCallback((id: string) => {
        setFloating((prev) => prev.filter((r) => r.id !== id))
    }, [])

    async function handleReact(emoji: ReactionEmoji) {
        if (!canReact) return
        startCooldown()

        try {
            await fetch('/api/reactions', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ lobbyId, playerId, emoji }),
            })
        } catch {
            // Best-effort — the optimistic animation already ran via Realtime echo
        }
    }

    const cooldownPercent = msRemaining > 0
        ? (msRemaining / COOLDOWN_MS) * 100
        : 0

    return (
        <>
            {/* ── Floating emojis (portal-like — fixed position) ── */}
            <AnimatePresence>
                {floating.map((r) => (
                    <FloatingReaction
                        key={r.id}
                        reaction={r}
                        onComplete={handleRemoveFloating}
                    />
                ))}
            </AnimatePresence>

            {/* ── Reaction bar strip ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            'var(--space-2)',
                    padding:        'var(--space-3) var(--space-4)',
                    background:     'var(--color-surface)',
                    border:         '2px solid var(--color-border-subtle)',
                    position:       'relative',
                    overflow:       'hidden',
                }}
            >
                {REACTION_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => void handleReact(emoji)}
                        disabled={!canReact}
                        aria-label={`React with ${emoji}`}
                        style={{
                            fontSize:      '1.75rem',
                            lineHeight:    1,
                            padding:       'var(--space-2)',
                            background:    'transparent',
                            border:        '2px solid transparent',
                            cursor:        canReact ? 'pointer' : 'not-allowed',
                            opacity:       canReact ? 1 : 0.4,
                            transition:    `opacity var(--duration-fast), transform var(--duration-fast)`,
                            borderRadius:  'var(--radius-none)',
                            userSelect:    'none',
                        }}
                        onMouseEnter={(e) => {
                            if (canReact) {
                                ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.25)'
                                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-strong)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
                            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                        }}
                    >
                        {emoji}
                    </button>
                ))}

                {/* Cooldown progress bar — subtle strip at the bottom */}
                {cooldownPercent > 0 && (
                    <div
                        aria-hidden
                        style={{
                            position:   'absolute',
                            bottom:     0,
                            left:       0,
                            height:     '2px',
                            width:      `${cooldownPercent}%`,
                            background: 'var(--color-accent)',
                            transition: 'width 50ms linear',
                        }}
                    />
                )}
            </motion.div>
        </>
    )
}

