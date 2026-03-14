'use client'

import type React from 'react'
import { useTranslations } from 'next-intl'
import { UploadZone } from './upload-zone'

type ImportStepUploadProps = {
    isDragging:    boolean
    setIsDragging: (v: boolean) => void
    processFile:   (f: File) => void
    fileInputRef:  React.RefObject<HTMLInputElement | null>
    fileError:     string | null
}

// Shared rich-text tag renderers — stable references, defined outside component
const richStrong      = (chunks: React.ReactNode) => <strong className="text-[var(--color-foreground)] font-semibold">{chunks}</strong>
const richStrongAccent = (chunks: React.ReactNode) => <strong className="text-[var(--color-accent)] font-semibold">{chunks}</strong>
const richCode        = (chunks: React.ReactNode) => <code className="text-[var(--color-accent)] font-bold" style={{ fontSize: 'var(--text-body-sm)' }}>{chunks}</code>
const RICH_TAGS = { strong: richStrong, strongAccent: richStrongAccent, code: richCode }

export function ImportStepUpload({
    isDragging, setIsDragging, processFile, fileInputRef, fileError,
}: ImportStepUploadProps) {
    const t = useTranslations('reelImport')

    const STEPS = [
        t.rich('steps.step1', RICH_TAGS),
        t.rich('steps.step2', RICH_TAGS),
        t.rich('steps.step3', RICH_TAGS),
        t.rich('steps.step4', RICH_TAGS),
        t.rich('steps.step5', RICH_TAGS),
    ]

    return (
        <div className="flex flex-col gap-4 p-4">

            {/* ── Header ── */}
            <div>
                <h2
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)', textShadow: '0 0 20px rgba(245,200,0,0.3)' }}
                >
                    {t('title')}
                </h2>
                <p className="font-sans text-[var(--color-subtle)] mt-1.5 leading-relaxed" style={{ fontSize: 'var(--text-body-sm)' }}>
                    {t.rich('uploadDescriptionHtml', { strong: richStrong })}
                </p>
            </div>

            {/* ── Instagram export link ── */}
            <a
                href="https://accountscenter.instagram.com/info_and_permissions/dyi/?show_frameless=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm w-full"
                aria-label={t('openInstagramExport')}
            >
                {t('openInstagramExport')}
            </a>

            {/* ── Steps card ── */}
            <div className="card-brutal flex flex-col gap-0">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-[var(--color-border)]">
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                        {t('followSteps').toUpperCase()}
                    </span>
                </div>
                <ol className="flex flex-col divide-y divide-[var(--color-border)]">
                    {STEPS.map((text, i) => (
                        <li key={i} className="flex items-start gap-3 px-4 py-3">
                            <span
                                className="shrink-0 w-5 h-5 flex items-center justify-center font-display bg-[var(--color-accent)] text-[var(--color-accent-fg)] mt-0.5"
                                style={{ fontSize: 'var(--text-label-xs)' }}
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <span className="font-sans text-[var(--color-muted)] leading-relaxed" style={{ fontSize: 'var(--text-body-sm)' }}>
                                {text}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* ── Upload zone ── */}
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
