'use client'

import { useState, useRef }        from 'react'
import type React                  from 'react'
import { Button, ErrorMessage }    from '@/components/ui'
import { useReelImport }           from '../hooks/use-reel-import'
import { isLikedPostsJson, extractReelsFromInstagramExport } from '../utils/parse-export'
import { MIN_REELS, MAX_REELS }    from '../validations'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ImportFlowProps = {
    lobbyId:     string
    playerId:    string
    /** Called after a successful import so the parent can navigate back to the lobby. */
    onComplete?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Multi-step reel import flow.
 *
 * Step 1 (`upload`) — instructions + drag-and-drop / file-picker for `liked_posts.json`.
 * Step 2 (`confirm`) — shows the count of found reels before submitting.
 * Done state — success message + "back to lobby" button.
 *
 * Design decisions:
 * - All magic numbers come from `MIN_REELS` / `MAX_REELS` constants.
 * - No inline Tailwind colour classes — all colours via CSS vars.
 */
export function ImportFlow({ lobbyId, playerId, onComplete }: ImportFlowProps) {
    const { submitReels, isPending, error, importedCount, reelUrls, setReelUrls } =
        useReelImport(lobbyId, playerId)

    const [step,      setStep]      = useState<'upload' | 'confirm'>('upload')
    const [fileError, setFileError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function processFile(file: File) {
        setFileError(null)
        if (!file.name.endsWith('.json')) {
            setFileError('Please upload a .json file from your Instagram data export.')
            return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)
                if (!isLikedPostsJson(json)) {
                    setFileError('Wrong file. Please upload liked_posts.json — not liked_comments.json.')
                    return
                }
                const found = extractReelsFromInstagramExport(json)
                if (found.length === 0) {
                    setFileError('No liked Reels found in this file.')
                    return
                }
                setReelUrls(found)
                setStep('confirm')
            } catch {
                setFileError('Could not read the file. Is it valid JSON?')
            }
        }
        reader.readAsText(file)
    }

    // ── Done ────────────────────────────────────────────────────────────────
    if (importedCount > 0) {
        return (
            <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="text-6xl">🎉</div>
                <h2 className="text-2xl font-black text-[var(--color-success)] uppercase">Done!</h2>
                <p className="text-[var(--color-muted)]">
                    Your liked Reels are saved — you won&apos;t see which ones until the game reveals them!
                </p>
                {onComplete && (
                    <Button size="sm" onClick={onComplete}>← BACK TO LOBBY</Button>
                )}
            </div>
        )
    }

    // ── Step 2: Confirm ──────────────────────────────────────────────────────
    if (step === 'confirm') {
        return (
            <div className="flex flex-col gap-5 w-full max-w-md mx-auto p-4">
                <div className="text-center">
                    <div className="text-5xl mb-2">🎬</div>
                    <h2 className="text-2xl font-black uppercase text-[var(--color-accent)]">Ready!</h2>
                    <p className="text-[var(--color-muted)] text-sm mt-1">
                        Found <span className="text-[var(--color-foreground)] font-black">{reelUrls.length} Reels</span> — shuffled so you can&apos;t see which ones.
                    </p>
                </div>

                <div className="card p-4 text-center">
                    <div className="text-4xl font-black text-[var(--color-accent)]">{reelUrls.length}</div>
                    <div className="text-[var(--color-muted)] text-sm">liked Reels found</div>
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {Array.from({ length: Math.min(reelUrls.length, 12) }).map((_, i) => (
                            <div key={i} className="w-8 h-8 bg-[var(--color-border)] rounded flex items-center justify-center text-sm">🎬</div>
                        ))}
                        {reelUrls.length > 12 && (
                            <div className="w-8 h-8 bg-[var(--color-border)] rounded flex items-center justify-center text-xs text-[var(--color-muted)]">
                                +{reelUrls.length - 12}
                            </div>
                        )}
                    </div>
                </div>

                <ErrorMessage message={error} />

                <Button size="lg" fullWidth onClick={submitReels} disabled={isPending}>
                    {isPending ? '⏳ SAVING…' : '🚀 SUBMIT REELS'}
                </Button>
                <button
                    onClick={() => { setStep('upload'); setReelUrls([]) }}
                    className="text-[var(--color-subtle)] text-sm underline text-center"
                >
                    ← Upload a different file
                </button>
            </div>
        )
    }

    // ── Step 1: Upload ───────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5 w-full max-w-md mx-auto p-4">
            <div className="text-center">
                <h2 className="text-3xl font-black uppercase text-[var(--color-accent)]">📥 Import Reels</h2>
                <p className="text-[var(--color-muted)] text-sm mt-1">
                    Upload your Instagram data export — the game picks your liked Reels{' '}
                    <strong className="text-[var(--color-foreground)]">without showing them to you</strong>.
                </p>
            </div>

            {/* Instagram export link */}
            <a
                href="https://accountscenter.instagram.com/info_and_permissions/dyi/?show_frameless=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-md w-full"
            >
                📲 Open Instagram Data Export ↗
            </a>

            {/* How-to steps */}
            <div className="card p-4 flex flex-col gap-3">
                <p className="text-sm font-black text-[var(--color-muted)] uppercase">Follow these steps</p>
                <ol className="flex flex-col gap-2.5">
                    {([
                        <>Select <strong className="text-[var(--color-foreground)]">&ldquo;Download or transfer information&rdquo;</strong></>,
                        <>Choose <strong className="text-[var(--color-foreground)]">&ldquo;Some of your information&rdquo;</strong> → check only <strong className="text-[var(--color-accent)]">Likes</strong> → Next</>,
                        <>Select <strong className="text-[var(--color-foreground)]">&ldquo;Download to device&rdquo;</strong> → Next</>,
                        <>Date range: <strong className="text-[var(--color-accent)]">Last year</strong> · Format: <strong className="text-[var(--color-accent)]">JSON</strong> → Create files</>,
                        <>Unzip → go to <code className="text-[var(--color-accent)] text-xs">likes/</code> → upload <code className="text-[var(--color-accent)] text-xs">liked_posts.json</code></>,
                    ] as React.ReactNode[]).map((text, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
              <span className="w-5 h-5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
                            <span>{text}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-[var(--radius-lg)] border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-[var(--duration-base)]
          ${isDragging
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-subtle)]'
                }`}
            >
                <div className="text-4xl">📂</div>
                <p className="text-[var(--color-muted)] font-bold text-sm text-center">
                    Tap to select <code className="text-[var(--color-accent)]">liked_posts.json</code>
                    <span className="text-[var(--color-subtle)]"> or drag &amp; drop</span>
                </p>
                <p className="text-xs text-[var(--color-faint)]">
                    We&apos;ll randomly pick up to {MAX_REELS} Reels from your likes
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
                    className="hidden"
                />
            </div>

            <ErrorMessage message={fileError} />
        </div>
    )
}
