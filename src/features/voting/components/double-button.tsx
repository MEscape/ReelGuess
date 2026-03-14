'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence }       from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DoubleButtonProps = {
    roundId: string
    voterId: string
    /**
     * Async callback that performs the double action.
     * Must return a Promise — the component awaits it to manage pending state.
     * Should throw an Error with a user-facing message on failure.
     * Provided by the parent via GameRoundContext (no direct action import).
     * Named with "Action" suffix to satisfy Next.js serializable-props convention.
     */
    onDoubleAction: (roundId: string, voterId: string) => Promise<void>
    /**
     * Whether the player is eligible to activate Double-or-Nothing.
     * False when the player's current points are below {@link minPoints}.
     * @default true
     */
    canActivate?: boolean
    /**
     * Minimum points required to activate Double-or-Nothing.
     * Shown in the subtitle when `canActivate` is false.
     * @default 100
     */
    minPoints?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Double-or-Nothing button — appears after a vote is submitted.
 *
 * The actual server call is injected via `onDoubleAction` so this component
 * has zero direct dependencies on the game feature (no circular imports).
 *
 * Rules:
 * - Only one activation per round (button disappears after click).
 * - Disabled if the reveal phase has already started (onDoubleAction throws).
 * - Correct → points × 2. Incorrect → −base points.
 *
 * Animates in with a spring entrance and disappears after activation.
 */
export function DoubleButton({
    roundId,
    voterId,
    onDoubleAction,
    canActivate = true,
    minPoints   = 100,
}: DoubleButtonProps) {
    const [used,      setUsed]      = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [error,     setError]     = useState<string | null>(null)

    const guardRef = useRef(false)

    const handleClick = useCallback(async () => {
        if (guardRef.current || !canActivate) return
        guardRef.current = true
        setIsPending(true)
        setError(null)
        try {
            await onDoubleAction(roundId, voterId)
            setUsed(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to activate double')
        } finally {
            setIsPending(false)
            guardRef.current = false
        }
    }, [onDoubleAction, roundId, voterId, canActivate])

    const isDisabled = isPending || !canActivate

    return (
        <AnimatePresence>
            {!used && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="space-y-1"
                >
                    <button
                        onClick={handleClick}
                        disabled={isDisabled}
                        aria-label={canActivate ? 'Activate Double-or-Nothing' : `Need ${minPoints} pts to activate Double-or-Nothing`}
                        style={{
                            width:      '100%',
                            padding:    '0.75rem 1.5rem',
                            background: isDisabled
                                ? 'var(--color-surface-raised)'
                                : 'linear-gradient(135deg, rgba(245,200,0,0.15) 0%, rgba(245,200,0,0.05) 100%)',
                            border:     `2px solid ${isDisabled ? 'var(--color-border-strong)' : 'var(--color-accent)'}`,
                            boxShadow:  isDisabled ? 'none' : '4px 4px 0px var(--color-accent)',
                            cursor:     isDisabled ? 'not-allowed' : 'pointer',
                            opacity:    !canActivate ? 0.5 : 1,
                            transition: 'box-shadow 0.1s, transform 0.1s',
                            transform:  isPending ? 'translate(2px, 2px)' : undefined,
                        }}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚡</span>
                            <div className="text-center">
                                <p
                                    className="font-display uppercase"
                                    style={{
                                        fontSize:      'var(--text-title-sm)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         isDisabled ? 'var(--color-muted)' : 'var(--color-accent)',
                                        lineHeight:    1,
                                    }}
                                >
                                    DOUBLE OR NOTHING
                                </p>
                                <p
                                    className="font-sans"
                                    style={{
                                        fontSize:  'var(--text-label-xs)',
                                        color:     'var(--color-muted)',
                                        marginTop: '0.2rem',
                                    }}
                                >
                                    {canActivate
                                        ? 'Correct → ×2 pts · Wrong → −50% of your points'
                                        : `Requires ${minPoints} pts to activate`}
                                </p>
                            </div>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚡</span>
                        </div>
                    </button>

                    {error && (
                        <p
                            className="text-center font-sans"
                            style={{
                                fontSize: 'var(--text-label-sm)',
                                color:    'var(--color-danger)',
                            }}
                        >
                            {error}
                        </p>
                    )}
                </motion.div>
            )}

            {used && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center justify-center gap-2 py-3 px-4"
                    style={{
                        background: 'rgba(245,200,0,0.08)',
                        border:     '2px solid var(--color-accent)',
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>⚡</span>
                    <span
                        className="font-display uppercase"
                        style={{
                            fontSize:      'var(--text-ui)',
                            letterSpacing: 'var(--tracking-display)',
                            color:         'var(--color-accent)',
                        }}
                    >
                        DOUBLE ACTIVATED!
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
