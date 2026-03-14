'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocalReels }       from '../hooks/use-local-reels'
import { useFileImport }       from '../hooks/use-file-import'
import { LOCAL_MAX_REELS }     from '../constants'
import type { AddReelsResult } from '../types'

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
 * State machine:
 *
 *   upload  → (file parsed)  → confirm
 *   confirm → (save pressed) → done
 *   done    → onComplete() / idle
 *
 * Zero JSX markup lives here — each branch renders exactly one sub-component.
 *
 * ### Step transition
 * The `upload → confirm` transition is driven by a `useEffect` that watches
 * `fileImport.state.status`. Previously this was a conditional `setStep` call
 * in the render body — a React anti-pattern that causes double renders and
 * breaks in concurrent mode. The `useEffect` pattern is the correct approach.
 *
 * ### Stable references
 * `parsedUrls` is `useMemo`-stable (same empty array reference when not parsed).
 * `handleConfirmSubmit` and `handleBack` are `useCallback`-wrapped so child
 * components do not receive new prop references on every parent render.
 */
export function ImportFlow({ onComplete }: ImportFlowProps) {
    const { count: localCount, addReels } = useLocalReels()
    const fileImport = useFileImport()

    const [step,       setStep]       = useState<Step>('upload')
    const [saveResult, setSaveResult] = useState<AddReelsResult | null>(null)

    // Stable derived value — same [] reference when not in parsed state.
    const parsedUrls = useMemo(
        () => fileImport.state.status === 'parsed' ? fileImport.state.urls : [],
        [fileImport.state],
    )

    // ── File parsed → advance to confirm ─────────────────────────────────
    // Driven by useEffect, not a conditional setStep in the render body.
    // The render-body pattern causes double renders and breaks React's
    // concurrent mode state transition rules.
    useEffect(() => {
        if (fileImport.state.status === 'parsed' && step === 'upload') {
            setStep('confirm')
        }
    }, [fileImport.state.status, step])

    // ── Confirm: save to localStorage ────────────────────────────────────
    const handleConfirmSubmit = useCallback((): void => {
        if (parsedUrls.length === 0) return
        // Save up to LOCAL_MAX_REELS (500) to localStorage.
        // The game-session cap (MAX_REELS = 50) is applied server-side when
        // the player joins or creates a lobby — NOT here.
        const result = addReels(parsedUrls.slice(0, LOCAL_MAX_REELS))
        setSaveResult(result)
        setStep('done')
    }, [parsedUrls, addReels])

    // ── Back from confirm ─────────────────────────────────────────────────
    const handleBack = useCallback((): void => {
        fileImport.reset()
        setStep('upload')
    }, [fileImport])

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