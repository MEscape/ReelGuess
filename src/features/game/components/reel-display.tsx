'use client'

import { useEffect, useRef, useState, useCallback, startTransition } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type ReelDisplayProps = {
    instagramUrl: string
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function toEmbedUrl(url: string): string {
    const clean = url.split('?')[0].replace(/\/$/, '')
    return `${clean}/embed`
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

/** How long we wait before treating a load as failed. */
const LOAD_TIMEOUT_MS = 12_000
/** How many consecutive failures before showing the permanent error UI. */
const MAX_CONSECUTIVE_FAILS = 3
/** Height kept consistent across all states so layout doesn't shift. */
const EMBED_HEIGHT = 560

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

/**
 * Renders an Instagram Reel embed with robust cross-browser handling.
 *
 * ### Why not just `<iframe onLoad>`?
 * `onLoad` is unreliable for embeds:
 * - **Safari/Firefox** fire it for blocked / 4xx iframes too (the browser
 *   loaded *something*, just not the reel).
 * - Instagram's embed JS sends a `postMessage` with `type: "LOADED"` when
 *   the player is actually ready. We use that as the primary success signal.
 * - A generous 12-second timeout acts as a fallback for browsers that block
 *   postMessage from cross-origin iframes.
 *
 * ### Why is the iframe always visible (not display:none)?
 * Hiding the iframe via `display:none` stops Instagram's embed JS from
 * initialising its player, which causes the "frozen reel" symptom on reveal.
 * Instead we layer a loading/error overlay **on top** of the always-visible
 * iframe using `position: absolute`.
 *
 * ### Stale reel fix
 * The `key` prop on `<iframe>` is the embed URL. React will unmount and
 * remount the entire iframe whenever the URL changes, guaranteeing a fresh
 * player even if the component instance is reused across rounds.
 */
export function ReelDisplay({ instagramUrl }: ReelDisplayProps) {
    const embedUrl = toEmbedUrl(instagramUrl)

    const [status, setStatus]       = useState<'loading' | 'loaded' | 'error'>('loading')
    const [unavailable, setUnavailable] = useState(false)
    const [retryKey, setRetryKey]   = useState(0)

    const failCountRef  = useRef(0)
    const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Track the embedUrl this instance was created with, so postMessage
    // handlers from a previous round don't resolve the current load.
    const activeUrlRef  = useRef(embedUrl)

    // Reset all state whenever the reel URL changes (new round).
    useEffect(() => {
        activeUrlRef.current = embedUrl
        failCountRef.current = 0
        startTransition(() => {
            setStatus('loading')
            setUnavailable(false)
            setRetryKey(0)
        })
    }, [embedUrl])

    const handleSuccess = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        failCountRef.current = 0
        setStatus('loaded')
    }, [])

    const handleFailure = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        failCountRef.current += 1
        if (failCountRef.current >= MAX_CONSECUTIVE_FAILS) {
            setUnavailable(true)
        } else {
            setStatus('error')
        }
    }, [])

    // ── Loading timeout ──────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'loading') return

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(handleFailure, LOAD_TIMEOUT_MS)

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [status, embedUrl, retryKey, handleFailure])

    // ── Instagram postMessage listener ───────────────────────────────────────
    // Instagram's embed JS fires window.postMessage({type:'LOADED'}) when the
    // player is actually interactive. This is more reliable than onLoad across
    // all browsers because it comes from the player JS itself.
    useEffect(() => {
        function onMessage(event: MessageEvent) {
            // Guard: only accept messages from Instagram domains
            if (
                !event.origin.includes('instagram.com') &&
                !event.origin.includes('cdninstagram.com')
            ) return

            try {
                const data = typeof event.data === 'string'
                    ? (JSON.parse(event.data) as Record<string, unknown>)
                    : (event.data as Record<string, unknown>)

                if (
                    data &&
                    typeof data === 'object' &&
                    // Instagram fires various message types; LOADED / loaded both observed
                    (data.type === 'LOADED' || data.type === 'loaded' || data.loaded === true)
                ) {
                    // Only resolve if the URL hasn't changed since this handler was set up
                    if (activeUrlRef.current === embedUrl) {
                        handleSuccess()
                    }
                }
            } catch {
                // JSON.parse failed — not our message, ignore
            }
        }

        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [embedUrl, handleSuccess])

    function retry() {
        failCountRef.current = 0
        setStatus('loading')
        setRetryKey((k) => k + 1)
    }

    // ─────────────────────────────────────────────────────
    // Permanently unavailable
    // ─────────────────────────────────────────────────────

    if (unavailable) {
        return (
            <div
                className="w-full max-w-sm mx-auto flex flex-col items-center gap-4 p-6"
                style={{
                    background: 'var(--color-surface)',
                    border: '3px solid var(--color-danger)',
                    borderTop: '6px solid var(--color-danger)',
                    boxShadow: 'var(--shadow-brutal-danger)',
                    minHeight: `${EMBED_HEIGHT}px`,
                    justifyContent: 'center',
                }}
            >
                <span
                    className="font-display"
                    style={{ fontSize: '3.5rem', lineHeight: 1 }}
                    aria-hidden
                >
                    📵
                </span>

                <div className="text-center space-y-1">
                    <p
                        className="font-display uppercase"
                        style={{
                            fontSize: 'var(--text-title-sm)',
                            letterSpacing: 'var(--tracking-display)',
                            color: 'var(--color-danger)',
                        }}
                    >
                        REEL UNAVAILABLE
                    </p>
                    <p
                        className="font-sans"
                        style={{
                            fontSize: 'var(--text-body-sm)',
                            color: 'var(--color-muted)',
                        }}
                    >
                        Instagram blocked the embed. The game continues — you
                        can still vote based on the context clues!
                    </p>
                </div>

                <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    onClick={() => window.open(instagramUrl, '_blank', 'noopener,noreferrer')}
                >
                    OPEN ON INSTAGRAM ↗
                </Button>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────
    // Main frame
    // ─────────────────────────────────────────────────────

    return (
        <div
            className="w-full max-w-sm mx-auto relative overflow-hidden"
            style={{
                border: '3px solid var(--color-border-strong)',
                borderTop: '4px solid var(--color-accent)',
                boxShadow: 'var(--shadow-brutal)',
                // Fix height so overlays don't collapse the container
                height: `${EMBED_HEIGHT}px`,
            }}
        >
            {/*
             * The iframe is ALWAYS rendered and ALWAYS visible.
             *
             * Hiding it with display:none prevents Instagram's embed JS from
             * initialising the player → causes the "frozen reel" bug on Firefox
             * and Safari. The loading/error overlays sit on top via position:absolute.
             */}
            <iframe
                // key forces a full unmount/remount on URL change OR manual retry.
                // This is the most reliable way to reset the embed player state.
                key={`${embedUrl}-${retryKey}`}
                src={embedUrl}
                title="Instagram Reel"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                // onLoad is kept as a secondary signal for browsers that DO fire
                // it reliably (Chrome). The postMessage listener is the primary.
                onLoad={handleSuccess}
                onError={handleFailure}
                style={{
                    width:        '100%',
                    height:       '100%',
                    border:       'none',
                    // Always visible — overlays cover it during loading/error states.
                    display:      'block',
                    // Prevent iframe from receiving pointer events while overlays
                    // are shown, so buttons in overlays remain clickable.
                    pointerEvents: status === 'loaded' ? 'auto' : 'none',
                }}
            />

            {/* ── Loading overlay ──────────────────────────────────── */}
            {status === 'loading' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{ background: 'var(--color-surface)', zIndex: 2 }}
                >
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ fontSize: '3rem', lineHeight: 1 }}
                        aria-hidden
                    >
                        🎬
                    </motion.span>
                    <span
                        className="font-display uppercase"
                        style={{
                            fontSize: 'var(--text-label-sm)',
                            letterSpacing: 'var(--tracking-loose)',
                            color: 'var(--color-muted)',
                        }}
                    >
                        LOADING REEL…
                    </span>
                </motion.div>
            )}

            {/* ── Error overlay ────────────────────────────────────── */}
            {status === 'error' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{ background: 'var(--color-surface)', zIndex: 2 }}
                >
                    <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden>
                        ⚠️
                    </span>
                    <p
                        className="font-display uppercase"
                        style={{
                            fontSize: 'var(--text-ui)',
                            letterSpacing: 'var(--tracking-display)',
                            color: 'var(--color-muted)',
                        }}
                    >
                        FAILED TO LOAD
                    </p>
                    <Button variant="ghost" size="sm" onClick={retry}>
                        ↺ RETRY
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(instagramUrl, '_blank', 'noopener,noreferrer')}
                    >
                        OPEN ON INSTAGRAM ↗
                    </Button>
                </motion.div>
            )}
        </div>
    )
}

