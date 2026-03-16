'use client'

import type React from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { UploadZone } from './upload-zone'

type ImportStepUploadProps = {
    isDragging: boolean
    setIsDragging: (v: boolean) => void
    processFile: (f: File) => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    fileError: string | null
}

export function ImportStepUpload({
                                     isDragging, setIsDragging, processFile, fileInputRef, fileError,
                                 }: ImportStepUploadProps) {
    const t = useTranslations('reelImport')
    const locale = useLocale()
    const guideHref = locale === 'de' ? '/de/how-to-import' : '/how-to-import'

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
                    {t('uploadDescription')}
                </p>
                <Link
                    href={guideHref}
                    className="text-[var(--color-accent)] font-semibold underline underline-offset-2 hover:text-[var(--color-accent-dim)] mt-2 block"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {locale === 'de' ? '🎬 Vollständiger Leitfaden mit Video →' : '🎬 Full step-by-step guide with video →'}
                </Link>
            </div>

            {/* ── Instagram export shortcut ── */}
            <a
                href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm w-full"
                aria-label={t('openInstagramExport')}
            >
                {t('openInstagramExport')}
            </a>

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