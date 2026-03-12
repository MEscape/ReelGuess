'use client'

import { useState }              from 'react'
import { useLocalReels }         from '../hooks/use-local-reels'
import { useFileImport }         from '../hooks/use-file-import'
import { MAX_REELS }             from '../validations'
import type { AddReelsResult }   from '../types'

import { ImportStepUpload }  from './import-step-upload'
import { ImportStepConfirm } from './import-step-confirm'
import { ImportDone }        from './import-step-done'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ImportFlowProps = {
    /** Called after the user closes the done screen (e.g. to dismiss a modal). */
    onComplete?: () => void
}

type Step = 'upload' | 'confirm' | 'done'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone reel import flow — orchestrator only.
 *
 * Lobby-mode import has been removed. Reels are always saved to localStorage
 * here; the game layer selects from the pool when a player joins a lobby.
 *
 * State machine:
 *
 *   upload  → (file parsed)  → confirm
 *   confirm → (save pressed) → done
 *   done    → onComplete() / idle
 *
 * Zero JSX markup lives here — each branch renders exactly one sub-component.
 */
export function ImportFlow({ onComplete }: ImportFlowProps) {
    const { count: localCount, addReels } = useLocalReels()
    const fileImport = useFileImport()

    const [step,       setStep]       = useState<Step>('upload')
    const [saveResult, setSaveResult] = useState<AddReelsResult | null>(null)

    // Parsed URLs from the file — held here so confirm can show the count
    const parsedUrls = fileImport.state.status === 'parsed' ? fileImport.state.urls : []

    // ── File parsed → advance to confirm ─────────────────────────────────
    // React to state changes via derived step logic
    if (fileImport.state.status === 'parsed' && step === 'upload') {
        setStep('confirm')
    }

    // ── Confirm: save to localStorage ────────────────────────────────────
    function handleConfirmSubmit() {
        if (parsedUrls.length === 0) return
        // Cap at MAX_REELS — the full set is stored, game selection happens at join time
        const result = addReels(parsedUrls.slice(0, MAX_REELS))
        setSaveResult(result)
        setStep('done')
    }

    // ── Back from confirm ─────────────────────────────────────────────────
    function handleBack() {
        fileImport.reset()
        setStep('upload')
    }

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────

    if (step === 'done' && saveResult) {
        return (
            <ImportDone
                added={saveResult.added}
                duplicates={saveResult.duplicates}
                total={saveResult.total}
                onBack={onComplete}
            />
        )
    }

    if (step === 'confirm') {
        return (
            <ImportStepConfirm
                urlCount={parsedUrls.length}
                localCount={localCount}
                onSubmit={handleConfirmSubmit}
                onBack={handleBack}
            />
        )
    }

    return (
        <ImportStepUpload
            isDragging={fileImport.isDragging}
            setIsDragging={fileImport.setIsDragging}
            processFile={fileImport.processFile}
            fileInputRef={fileImport.fileInputRef}
            fileError={fileImport.state.status === 'error' ? fileImport.state.message : null}
        />
    )
}