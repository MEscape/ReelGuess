'use client'

import { useEmbedLoader }                            from '../hooks/use-embed-loader'
import { UnavailableCard, LoadingOverlay, ErrorOverlay } from './overlays'
import { EMBED_FRAME_HEIGHT }                        from '../constants'
import {toEmbedUrl} from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type ReelDisplayProps = {
    instagramUrl: string
}

/**
 * Renders an Instagram Reel embed with robust cross-browser load handling.
 *
 * Delegates all load/failure/retry state to `useEmbedLoader`.
 * This component is responsible only for layout and overlay selection.
 *
 * ### Why is the iframe always rendered and never hidden?
 * Setting `display: none` prevents Instagram's embed JS from initialising,
 * causing a frozen/blank player on reveal. The iframe is always visible;
 * loading and error overlays sit on top of it via `position: absolute`.
 *
 * ### Why the iframe `key` prop matters
 * The key is `${embedUrl}-${retryKey}`. React unmounts and remounts the entire
 * iframe on URL change (new round) or retry, guaranteeing a fresh player with
 * no stale state from a previous embed.
 *
 * ### Load signal priority — see `useEmbedLoader` for full documentation
 * postMessage (primary) → onLoad (fallback) → timeout (last resort)
 */
export function ReelDisplay({ instagramUrl }: ReelDisplayProps) {
    const embedUrl = toEmbedUrl(instagramUrl)

    const {
        status,
        unavailable,
        retryKey,
        retry,
        onIframeLoad,
        onIframeError,
    } = useEmbedLoader(embedUrl)

    if (unavailable) {
        return <UnavailableCard instagramUrl={instagramUrl} />
    }

    return (
        <div
            className="w-full max-w-sm mx-auto relative overflow-hidden"
            style={{
                border:    '3px solid var(--color-border-strong)',
                borderTop: '4px solid var(--color-accent)',
                boxShadow: 'var(--shadow-brutal)',
                height:    `${EMBED_FRAME_HEIGHT}px`,
            }}
        >
            {/*
             * Always rendered — never hidden.
             * Hiding via display:none stops Instagram's embed JS from
             * initialising, causing the "frozen reel" bug on Firefox/Safari.
             * Overlays sit on top via position:absolute instead.
             */}
            <iframe
                key={`${embedUrl}-${retryKey}`}
                src={embedUrl}
                title="Instagram Reel"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                onLoad={onIframeLoad}
                onError={onIframeError}
                style={{
                    width:         '100%',
                    height:        '100%',
                    border:        'none',
                    display:       'block',
                    // Prevent the iframe from capturing pointer events while an
                    // overlay is visible — clicks must reach the overlay buttons.
                    pointerEvents: status === 'loaded' ? 'auto' : 'none',
                }}
            />

            {status === 'loading' && <LoadingOverlay />}

            {status === 'error' && (
                <ErrorOverlay
                    instagramUrl={instagramUrl}
                    onRetry={retry}
                />
            )}
        </div>
    )
}