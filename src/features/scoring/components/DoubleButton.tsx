'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence }       from 'framer-motion'
import { useMutation }                   from '@tanstack/react-query'
import { submitDoubleAction }            from '@/features/game/actions'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DoubleButtonProps = {
    roundId:   string
    voterId:   string
    /**
     * Called when the double is successfully activated.
     * Parent should reflect the pending state optimistically.
     */
    onDoubled: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Double-or-Nothing button — appears after a vote is submitted.
 *
 * Rules:
 * - Only one activation per round (button disappears after click).
 * - Disabled if the reveal phase has already started.
 * - Correct → points × 2. Incorrect → −base points.
 *
 * Animates in with a spring entrance and disappears after activation.
 */
export function DoubleButton({ roundId, voterId, onDoubled }: DoubleButtonProps) {
    const [used, setUsed]   = useState(false)
    const guardRef           = useRef(false)

    const mutation = useMutation<void, string>({
        mutationFn: async () => {
            const result = await submitDoubleAction(roundId, voterId)
            if (!result.ok) {
                throw result.error.type === 'NOT_VOTING_PHASE'
                    ? 'Round already revealed — double not allowed'
                    : 'Failed to activate double'
            }
        },
        onSuccess: () => {
            setUsed(true)
            onDoubled()
        },
        onSettled: () => { guardRef.current = false },
    })

    const handleClick = useCallback(() => {
        if (guardRef.current || used) return
        guardRef.current = true
        mutation.mutate()
    }, [mutation, used])

    return (
        <AnimatePresence>
            {!used && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                    <button
                        onClick={handleClick}
                        disabled={mutation.isPending || used}
                        aria-label="Activate Double-or-Nothing"
                        style={{
                            width:        '100%',
                            padding:      '0.75rem 1.5rem',
                            background:   mutation.isPending
                                ? 'var(--color-surface-raised)'
                                : 'linear-gradient(135deg, rgba(245,200,0,0.15) 0%, rgba(245,200,0,0.05) 100%)',
                            border:       '2px solid var(--color-accent)',
                            boxShadow:    '4px 4px 0px var(--color-accent)',
                            cursor:       mutation.isPending ? 'wait' : 'pointer',
                            transition:   'box-shadow 0.1s, transform 0.1s',
                            transform:    mutation.isPending ? 'translate(2px, 2px)' : undefined,
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
                                        color:         'var(--color-accent)',
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
                                    Correct → ×2 pts · Wrong → −100 pts
                                </p>
                            </div>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚡</span>
                        </div>
                    </button>
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
