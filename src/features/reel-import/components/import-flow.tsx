'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocalReels }       from '../hooks/use-local-reels'
import { useFileImport }       from '../hooks/use-file-import'
import { getLocalReels }       from '../stores/local-reel-store'
import { LOCAL_MAX_REELS, SOFT_LOCAL_LIMIT } from '../constants'
import { getRewardSlots }      from '../stores/reward-slots-store'
import type { AddReelsResult } from '../types'

import { ImportStepUpload }  from './import-step-upload'
import { ImportStepConfirm } from './import-step-confirm'
import { ImportDone }        from './import-step-done'

type ImportFlowProps = {
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
    const { addReels } = useLocalReels()
    const fileImport = useFileImport()

    const [step,        setStep]        = useState<Step>('upload')
    const [saveResult,  setSaveResult]  = useState<AddReelsResult | null>(null)
    const [slotsCapped, setSlotsCapped] = useState(0)

    const parsedUrls = useMemo(
        () => fileImport.state.status === 'parsed' ? fileImport.state.urls : [],
        [fileImport.state],
    )

    useEffect(() => {
        if (fileImport.state.status === 'parsed' && step === 'upload') {
            setStep('confirm')
        }
    }, [fileImport.state.status, step])

    const handleConfirmSubmit = useCallback((): void => {
        if (parsedUrls.length === 0) return

        // 1. Read pool at submit-time to get accurate current state
        const poolNow      = getLocalReels()
        const poolSet      = new Set(poolNow.map((r) => r.url))
        const currentCount = poolNow.length

        // 2. Remove URLs already in pool FIRST — prevents duplicate slots wasting free space
        const freshUrls = parsedUrls.filter((u) => !poolSet.has(u))
        const dupCount  = parsedUrls.length - freshUrls.length

        // 3. How many free slots are available?
        const effectiveLimit = SOFT_LOCAL_LIMIT + getRewardSlots()
        const freeSlots      = Math.max(0, effectiveLimit - currentCount)

        // 4. Take up to freeSlots from the fresh (non-duplicate) URLs
        const saveCount = Math.min(freshUrls.length, freeSlots, LOCAL_MAX_REELS)
        const capped    = freshUrls.length - saveCount   // fresh URLs cut by slot limit

        if (saveCount === 0) {
            setSaveResult({ reels: poolNow, added: 0, duplicates: dupCount, total: currentCount })
            setSlotsCapped(capped)
            setStep('done')
            return
        }

        const result = addReels(freshUrls.slice(0, saveCount))
        // Combine internal duplicates (from addReels) with pre-filtered duplicates
        setSaveResult({ ...result, duplicates: result.duplicates + dupCount })
        setSlotsCapped(capped)
        setStep('done')
    }, [parsedUrls, addReels])

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
                slotsCapped={slotsCapped}
                onBack={onComplete}
            />
        )
    }

    if (step === 'confirm') {
        return (
            <ImportStepConfirm
                urlCount={parsedUrls.length}
                localCount={getLocalReels().length}
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