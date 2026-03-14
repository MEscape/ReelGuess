'use client'

import { useState, useCallback, useRef }  from 'react'
import { AnimatePresence, motion }         from 'framer-motion'

import { FloatingReaction }                from './floating-reaction'
import { useReactions }                    from '../hooks/use-reactions'
import { useReactionCooldown }             from '../hooks/use-reaction-cooldown'
import { REACTION_EMOJIS }                 from '../constants'
import type { ReactionEmoji, Reaction }    from '../types'
import {pruneProcessedIds} from "../utils";

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
 * - On press, broadcasts the reaction instantly via Supabase Realtime broadcast
 *   (all clients including self receive it) and manages a per-player cooldown.
 * - Floats received reactions up the screen as animated emojis.
 * - Removes floating emojis once their animation completes.
 *
 * ### Hover state
 * Hover is tracked via `hoveredEmoji` React state, not direct DOM mutation.
 * `onMouseEnter`/`onMouseLeave` previously wrote to `element.style` directly,
 * bypassing React's render cycle and causing intermittent visual bugs on
 * re-render. All style is now derived from render state.
 *
 * ### Re-render budget
 * `useReactionCooldown` fires `setMsRemaining` every 100 ms during cooldown,
 * re-rendering `ReactionBar` 10×/s. `handleReact` is memoised with
 * `useCallback` so the 5 emoji buttons do not receive new `onClick` references
 * on each interval tick.
 *
 * ### Dedup set
 * `processedIdsRef` prevents duplicate floating emojis when the same broadcast
 * is received more than once. The set is capped at `MAX_PROCESSED_IDS` entries
 * via `pruneProcessedIds` to prevent unbounded memory growth in long sessions.
 *
 * ### Progress bar
 * Uses `progress` (0–1) from `useReactionCooldown` directly — no import of
 * `COOLDOWN_MS` needed. The hook owns the constant; the component owns the UI.
 */
export function ReactionBar({ lobbyId, playerId }: ReactionBarProps) {
    const [floating,     setFloating]     = useState<Reaction[]>([])
    const [hoveredEmoji, setHoveredEmoji] = useState<ReactionEmoji | null>(null)

    const { canReact, progress, startCooldown } = useReactionCooldown()

    // Bounded dedup set — prevents duplicate floating emojis.
    // Mutated only inside the stable `handleNewReaction` callback, never during render.
    const processedIdsRef = useRef(new Set<string>())

    // Called by useReactions for every incoming broadcast (including self).
    // Stable via useCallback — never causes the subscription to re-create.
    const handleNewReaction = useCallback((reaction: Reaction) => {
        if (processedIdsRef.current.has(reaction.id)) return
        pruneProcessedIds(processedIdsRef.current)
        processedIdsRef.current.add(reaction.id)
        setFloating((prev) => [...prev, reaction])
    }, [])

    const { sendReaction } = useReactions(lobbyId, true, handleNewReaction)

    const handleRemoveFloating = useCallback((id: string) => {
        setFloating((prev) => prev.filter((r) => r.id !== id))
    }, [])

    const handleReact = useCallback((emoji: ReactionEmoji) => {
        if (!canReact) return
        startCooldown()
        // Fire-and-forget — the floating emoji appears via the self:true broadcast.
        // Failures are logged inside sendReaction; no user-facing feedback needed.
        void sendReaction(emoji, playerId)
    }, [canReact, startCooldown, sendReaction, playerId])

    return (
        <>
            {/* ── Floating emojis (fixed position, portal-like) ── */}
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
                        onClick={() => handleReact(emoji)}
                        disabled={!canReact}
                        aria-label={`React with ${emoji}`}
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        onMouseLeave={() => setHoveredEmoji(null)}
                        style={{
                            fontSize:     '1.75rem',
                            lineHeight:   1,
                            padding:      'var(--space-2)',
                            background:   'transparent',
                            border:       '2px solid',
                            // All style derived from render state — no direct DOM writes.
                            borderColor:  canReact && hoveredEmoji === emoji
                                ? 'var(--color-border-strong)'
                                : 'transparent',
                            cursor:       canReact ? 'pointer' : 'not-allowed',
                            opacity:      canReact ? 1 : 0.4,
                            transform:    canReact && hoveredEmoji === emoji
                                ? 'scale(1.25)'
                                : 'scale(1)',
                            transition:   `opacity var(--duration-fast), transform var(--duration-fast), border-color var(--duration-fast)`,
                            borderRadius: 'var(--radius-none)',
                            userSelect:   'none',
                        }}
                    >
                        {emoji}
                    </button>
                ))}

                {/* Cooldown progress bar — subtle strip at the bottom.
                    `progress` (0–1) comes directly from the hook, no COOLDOWN_MS import needed. */}
                {progress > 0 && (
                    <div
                        aria-hidden
                        style={{
                            position:   'absolute',
                            bottom:     0,
                            left:       0,
                            height:     '2px',
                            width:      `${progress * 100}%`,
                            background: 'var(--color-accent)',
                            transition: 'width 50ms linear',
                        }}
                    />
                )}
            </motion.div>
        </>
    )
}