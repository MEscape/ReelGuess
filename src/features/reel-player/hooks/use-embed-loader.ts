'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LOAD_TIMEOUT_MS, MAX_CONSECUTIVE_FAILS }    from '../constants'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LoadStatus = 'loading' | 'loaded' | 'error'

export type UseEmbedLoaderResult = {
    status:      LoadStatus
    unavailable: boolean
    retryKey:    number
    retry:       () => void
    /** Pass to <iframe onLoad>  — unreliable fallback, not primary signal. */
    onIframeLoad:  () => void
    /** Pass to <iframe onError> — only fires on hard network failures.     */
    onIframeError: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages all loading, failure, and retry state for an Instagram embed iframe.
 *
 * ### Signal priority (highest → lowest reliability)
 *
 * 1. **postMessage `LOADED`** — Instagram's embed JS fires this when the player
 *    is actually interactive. Most reliable. Primary success signal.
 *
 * 2. **`onLoad`** — fires when the iframe HTTP response arrives, not when the
 *    player is ready. On Safari/Firefox this fires for blocked/4xx frames too.
 *    Used as a fallback ONLY if postMessage has not yet resolved this attempt.
 *
 * 3. **Timeout** — fires after `LOAD_TIMEOUT_MS` if neither of the above
 *    resolved the attempt. Treats the load as failed and triggers retry logic.
 *
 * ### Stale-signal prevention
 * `resolvedRef` is set to `true` the moment any signal resolves an attempt.
 * All subsequent signals for the same `[embedUrl, retryKey]` pair are ignored.
 * This prevents a late `onLoad` from overriding a timeout failure, or a late
 * postMessage from a dying iframe resolving the next round's load.
 *
 * ### Synchronous ref resets
 * `failCountRef` and `resolvedRef` are reset synchronously during render
 * (guarded by `lastEmbedUrlRef`) rather than in a `useEffect`. This closes
 * the window where a failure signal from a dying iframe could increment the
 * new round's counter before the effect ran.
 *
 * @param embedUrl - The `/embed` URL of the Instagram Reel to load.
 */
export function useEmbedLoader(embedUrl: string): UseEmbedLoaderResult {
    const [status,      setStatus]      = useState<LoadStatus>('loading')
    const [unavailable, setUnavailable] = useState(false)
    const [retryKey,    setRetryKey]    = useState(0)

    // ── Synchronous ref resets on URL change ────────────────────────────────
    // Runs during render, before any effects or event handlers can fire.
    // This guarantees a clean baseline for every new embed URL.
    const lastEmbedUrlRef = useRef<string>(embedUrl)
    const failCountRef    = useRef(0)
    const resolvedRef     = useRef(false)

    if (lastEmbedUrlRef.current !== embedUrl) {
        lastEmbedUrlRef.current = embedUrl
        failCountRef.current    = 0
        resolvedRef.current     = false
    }

    // ── Core state transitions ──────────────────────────────────────────────

    const markLoaded = useCallback(() => {
        if (resolvedRef.current) return   // already resolved — ignore late signals
        resolvedRef.current  = true
        failCountRef.current = 0
        setStatus('loaded')
    }, [])

    const markFailed = useCallback(() => {
        if (resolvedRef.current) return   // already resolved — ignore late signals
        resolvedRef.current   = true
        failCountRef.current += 1

        if (failCountRef.current >= MAX_CONSECUTIVE_FAILS) {
            setUnavailable(true)
        } else {
            setStatus('error')
        }
    }, [])

    // ── Timeout — last-resort failure signal ────────────────────────────────
    // Depends only on [embedUrl, retryKey]: starts once per load attempt and
    // is never restarted by intermediate status changes.
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        // Reset resolved flag for this new attempt so signals are accepted again.
        resolvedRef.current = false
        setStatus('loading')

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(markFailed, LOAD_TIMEOUT_MS)

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [embedUrl, retryKey])
    // markFailed is intentionally excluded: it is stable (no deps) and adding
    // it would widen the dep array without changing behaviour. If it ever gains
    // deps, add it back.

    // ── postMessage — primary success signal ────────────────────────────────
    useEffect(() => {
        function onMessage(event: MessageEvent) {
            if (
                !event.origin.includes('instagram.com') &&
                !event.origin.includes('cdninstagram.com')
            ) return

            try {
                const data = typeof event.data === 'string'
                    ? (JSON.parse(event.data) as Record<string, unknown>)
                    : (event.data as Record<string, unknown>)

                const isLoaded =
                    data?.type === 'LOADED' ||
                    data?.type === 'loaded' ||
                    data?.loaded === true

                if (isLoaded) {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current)
                    markLoaded()
                }
            } catch {
                // JSON.parse failed — not our message, ignore silently
            }
        }

        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [embedUrl, markLoaded])
    // embedUrl is included so the listener is re-registered for each new reel,
    // ensuring markLoaded references the correct closure for the current URL.

    // ── iframe event handlers ───────────────────────────────────────────────

    /**
     * Fallback success signal.
     * Only acts if postMessage has not already resolved this load attempt.
     * On Chrome, postMessage arrives first so this becomes a no-op.
     * On Safari/Firefox (where postMessage may be blocked by CSP or browser
     * policy), this provides a degraded-but-functional success path.
     */
    const onIframeLoad = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        markLoaded()
    }, [markLoaded])

    /**
     * Hard failure signal.
     * `onError` only fires for genuine network-level failures (DNS, refused
     * connection). It does NOT fire for CSP blocks or 4xx responses — those
     * silently "succeed" from the iframe's perspective. This handler catches
     * the rare hard-failure case that neither postMessage nor timeout covers.
     */
    const onIframeError = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        markFailed()
    }, [markFailed])

    // ── Retry ───────────────────────────────────────────────────────────────

    const retry = useCallback(() => {
        resolvedRef.current  = false
        failCountRef.current = Math.max(0, failCountRef.current - 1)
        setRetryKey((k) => k + 1)
    }, [])

    return { status, unavailable, retryKey, retry, onIframeLoad, onIframeError }
}