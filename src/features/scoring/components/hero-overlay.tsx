'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence }                   from 'framer-motion'
import type { Achievement }                          from '../types'
import { achievementKey, formatAchievement }         from '../utils'
import {OVERLAY_DISPLAY_MS, OVERLAY_EXIT_MS} from "../constants";

type HeroOverlayProps = {
    achievements: Achievement[]
}

/**
 * Full-screen hero overlay that celebrates in-game achievements.
 *
 * - Queues multiple achievements and shows them one at a time.
 * - Auto-dismisses after {@link OVERLAY_DISPLAY_MS} ms, or immediately on backdrop click.
 * - Deduplicates via `seenRef` (`type:playerId`) to prevent repeated overlays.
 */
export function HeroOverlay({ achievements }: HeroOverlayProps) {
    const [current, setCurrent] = useState<Achievement | null>(null)
    const [visible, setVisible] = useState(false)

    const queueRef    = useRef<Achievement[]>([])
    const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
    const showingRef  = useRef(false)
    const seenRef     = useRef(new Set<string>())
    const showNextRef = useRef<() => void>(() => {})

    const dismiss = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setVisible(false)
        timerRef.current = setTimeout(() => showNextRef.current(), OVERLAY_EXIT_MS)
    }, [])

    const showNext = useCallback(() => {
        const next = queueRef.current.shift()
        if (!next) { showingRef.current = false; return }

        showingRef.current = true
        setCurrent(next)
        setVisible(true)
        timerRef.current = setTimeout(dismiss, OVERLAY_DISPLAY_MS)
    }, [dismiss])

    useEffect(() => { showNextRef.current = showNext }, [showNext])

    useEffect(() => {
        if (achievements.length === 0) return
        const fresh = achievements.filter((a) => !seenRef.current.has(achievementKey(a)))
        if (fresh.length === 0) return
        fresh.forEach((a) => seenRef.current.add(achievementKey(a)))
        queueRef.current.push(...fresh)
        if (!showingRef.current) showNext()
    }, [achievements, showNext])

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

    const formatted = current ? formatAchievement(current) : null

    return (
        <AnimatePresence>
            {visible && formatted && current && (
                <>
                    {/* Backdrop — click to dismiss */}
                    <motion.div
                        key={`backdrop-${achievementKey(current)}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={dismiss}
                        style={{
                            position:            'fixed',
                            inset:               0,
                            zIndex:              9998,
                            background:          'rgba(0, 0, 0, 0.72)',
                            backdropFilter:      'blur(4px)',
                            WebkitBackdropFilter:'blur(4px)',
                            cursor:              'pointer',
                        }}
                    />

                    {/* Popup card */}
                    <motion.div
                        key={achievementKey(current)}
                        initial={{ opacity: 0, scale: 0.4, y: 40  }}
                        animate={{ opacity: 1, scale: 1,   y: 0   }}
                        exit={{    opacity: 0, scale: 0.85, y: -24 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 22, mass: 0.9 }}
                        style={{
                            position:       'fixed',
                            inset:          0,
                            zIndex:         9999,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            pointerEvents:  'none',
                            padding:        '1.5rem',
                        }}
                    >
                        <div
                            style={{
                                width:      'min(calc(100vw - 3rem), 26rem)',
                                background: 'var(--color-surface)',
                                border:     '3px solid var(--color-accent)',
                                boxShadow:  '8px 8px 0px var(--color-accent), var(--shadow-glow-accent-lg)',
                                padding:    '2rem',
                                textAlign:  'center',
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.5, rotate: -15 }}
                                animate={{ scale: 1,   rotate: 0   }}
                                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.08 }}
                                style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem' }}
                                aria-hidden
                            >
                                {formatted.emoji}
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0  }}
                                transition={{ delay: 0.15, duration: 0.25 }}
                                className="font-display uppercase"
                                style={{
                                    fontSize:      'clamp(1.1rem, 5vw, 1.6rem)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         'var(--color-accent)',
                                    lineHeight:    1.1,
                                    marginBottom:  '0.5rem',
                                }}
                            >
                                {formatted.title}
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                className="font-sans"
                                style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}
                            >
                                {formatted.subtitle}
                            </motion.p>

                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.3, duration: 0.45, ease: 'easeOut' }}
                                style={{
                                    marginTop:       '1.25rem',
                                    height:          '3px',
                                    background:      'var(--color-accent)',
                                    opacity:         0.5,
                                    transformOrigin: 'left center',
                                }}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}