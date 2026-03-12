import type React from 'react'
import { cn }          from '@/lib/utils/cn'
import { ErrorMessage } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UploadZoneProps = {
    isDragging:    boolean
    setIsDragging: (v: boolean) => void
    processFile:   (f: File) => void
    fileInputRef:  React.RefObject<HTMLInputElement | null>
    fileError:     string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drag-and-drop / tap-to-select JSON upload zone.
 *
 * Pure UI — zero business logic. All state is passed in via props.
 */
export function UploadZone({
                               isDragging,
                               setIsDragging,
                               processFile,
                               fileInputRef,
                               fileError,
                           }: UploadZoneProps) {
    return (
        <div className="flex flex-col gap-2">
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload liked_posts.json"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) processFile(f)
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                className={cn(
                    'w-full flex flex-col items-center gap-3 py-8 px-5 cursor-pointer',
                    'border-2 border-dashed',
                    'transition-[border-color,background-color] duration-[var(--duration-base)]',
                    isDragging
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06]'
                        : [
                            'border-[var(--color-border-subtle)] bg-[var(--color-surface)]',
                            'hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]',
                        ].join(' '),
                )}
            >
                {/* Icon */}
                <span
                    className="text-4xl leading-none transition-transform duration-[var(--duration-base)]"
                    style={{ transform: isDragging ? 'scale(1.2)' : 'scale(1)' }}
                    aria-hidden
                >
                    {isDragging ? '🎯' : '📂'}
                </span>

                {/* Labels */}
                <div className="text-center">
                    <p
                        className="font-display uppercase text-[var(--color-muted)]"
                        style={{
                            fontSize:      'var(--text-ui)',
                            letterSpacing: 'var(--tracking-display)',
                        }}
                    >
                        {isDragging ? 'Drop it!' : 'Drop or tap to browse'}
                    </p>
                    <p
                        className="font-sans text-[var(--color-subtle)] mt-1"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        Upload{' '}
                        <code
                            className="font-bold text-[var(--color-accent)]"
                            style={{ fontSize: 'var(--text-body-sm)' }}
                        >
                            liked_posts.json
                        </code>
                        {' '}from your Instagram export
                    </p>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) processFile(f)
                    }}
                />
            </div>

            <ErrorMessage message={fileError} />
        </div>
    )
}