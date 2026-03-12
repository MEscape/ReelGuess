import type React from 'react'
import { UploadZone } from './upload-zone'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ImportStepUploadProps = {
    isDragging:    boolean
    setIsDragging: (v: boolean) => void
    processFile:   (f: File) => void
    fileInputRef:  React.RefObject<HTMLInputElement | null>
    fileError:     string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
    <>Select <strong className="text-[var(--color-foreground)]">&ldquo;Download or transfer information&rdquo;</strong></>,
    <>Choose <strong className="text-[var(--color-foreground)]">&ldquo;Some of your information&rdquo;</strong> → check only{' '}
        <strong className="text-[var(--color-accent)]">Likes</strong> → Next</>,
    <>Select <strong className="text-[var(--color-foreground)]">&ldquo;Download to device&rdquo;</strong> → Next</>,
    <>Date range: <strong className="text-[var(--color-accent)]">Last year</strong> &nbsp;·&nbsp; Format:{' '}
        <strong className="text-[var(--color-accent)]">JSON</strong> → Create files</>,
    <>Unzip → open <code className="text-[var(--color-accent)] font-bold" style={{ fontSize: 'var(--text-body-sm)' }}>likes/</code>{' '}
        → upload <code className="text-[var(--color-accent)] font-bold" style={{ fontSize: 'var(--text-body-sm)' }}>liked_posts.json</code></>,
] as React.ReactNode[]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1 — Instagram export instructions + file upload zone.
 *
 * Pure UI. `isLobbyMode` has been removed — import is always standalone now.
 */
export function ImportStepUpload({
                                     isDragging,
                                     setIsDragging,
                                     processFile,
                                     fileInputRef,
                                     fileError,
                                 }: ImportStepUploadProps) {
    return (
        <div className="flex flex-col gap-4 p-4">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div>
                <h2
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{
                        fontSize:      'var(--text-title)',
                        letterSpacing: 'var(--tracking-display)',
                        textShadow:    '0 0 20px rgba(245,200,0,0.3)',
                    }}
                >
                    Import Reels
                </h2>
                <p
                    className="font-sans text-[var(--color-subtle)] mt-1.5 leading-relaxed"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    Upload once — Reels are stored{' '}
                    <strong className="text-[var(--color-foreground)] font-semibold">locally on your device</strong>,
                    ready for any future game.
                </p>
            </div>

            {/* ── Instagram export link ─────────────────────────────────── */}
            <a
                href="https://accountscenter.instagram.com/info_and_permissions/dyi/?show_frameless=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm w-full"
            >
                Open Instagram Export ↗
            </a>

            {/* ── Steps card ────────────────────────────────────────────── */}
            <div className="card-brutal flex flex-col gap-0">

                <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-[var(--color-border)]">
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                        Follow these steps
                    </span>
                </div>

                <ol className="flex flex-col divide-y divide-[var(--color-border)]">
                    {STEPS.map((text, i) => (
                        <li key={i} className="flex items-start gap-3 px-4 py-3">
                            <span
                                className="shrink-0 w-5 h-5 flex items-center justify-center font-display bg-[var(--color-accent)] text-[var(--color-accent-fg)] mt-0.5"
                                style={{ fontSize: 'var(--text-label-xs)' }}
                            >
                                {i + 1}
                            </span>
                            <span
                                className="font-sans text-[var(--color-muted)] leading-relaxed"
                                style={{ fontSize: 'var(--text-body-sm)' }}
                            >
                                {text}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* ── Upload zone ───────────────────────────────────────────── */}
            <UploadZone
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                processFile={processFile}
                fileInputRef={fileInputRef}
                fileError={fileError}
            />

        </div>
    )
}