'use client'

import { useState, useRef, useCallback } from 'react'
import {
    isLikedPostsJson,
    extractReelsFromInstagramExport,
} from '../utils/parse-export'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FileImportState =
    | { status: 'idle' }
    | { status: 'error';   message: string }
    | { status: 'parsed';  urls: string[] }

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles Instagram export file parsing.
 *
 * Responsibility: file validation → JSON parsing → reel URL extraction.
 * Does NOT touch localStorage — that's the caller's (ImportFlow's) concern.
 *
 * Returns `fileInputRef` so the caller can forward it to the upload zone
 * without managing a separate ref.
 */
export function useFileImport() {
    const [state,      setState]      = useState<FileImportState>({ status: 'idle' })
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const processFile = useCallback((file: File): void => {
        setState({ status: 'idle' })

        if (!file.name.endsWith('.json')) {
            setState({ status: 'error', message: 'Please upload a .json file from your Instagram data export.' })
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)

                if (!isLikedPostsJson(json)) {
                    setState({ status: 'error', message: 'Wrong file. Please upload liked_posts.json — not liked_comments.json.' })
                    return
                }

                // Extract all reels (no cap here — confirm step will show count,
                // cap is applied at save time via MAX_REELS)
                const urls = extractReelsFromInstagramExport(json, Infinity)

                if (urls.length === 0) {
                    setState({ status: 'error', message: 'No liked Reels found in this file.' })
                    return
                }

                setState({ status: 'parsed', urls })
            } catch {
                setState({ status: 'error', message: 'Could not read the file. Is it valid JSON?' })
            }
        }
        reader.readAsText(file)
    }, [])

    const reset = useCallback((): void => {
        setState({ status: 'idle' })
    }, [])

    return {
        state,
        isDragging,
        setIsDragging,
        processFile,
        fileInputRef,
        reset,
    }
}