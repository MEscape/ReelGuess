'use client'

import { useState, useRef } from 'react'
import type React from 'react'
import { useReelImport } from '../hooks/use-reel-import'

type ImportFlowProps = {
  lobbyId: string
  playerId: string
  onComplete?: () => void
}

const MAX_REELS = 50

/**
 * Validiert dass die JSON-Datei wirklich eine liked_posts.json ist.
 * Struktur: Array von Objekten mit "label_values" Array, das ein Objekt mit label="URL"
 * und einem href enthält.
 */
function isLikedPostsJson(json: unknown): boolean {
  if (!Array.isArray(json) || json.length === 0) return false
  // Mindestens ein Eintrag muss "label_values" mit label="URL" haben
  return json.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      'label_values' in item &&
      Array.isArray((item as Record<string, unknown>).label_values)
  )
}

function extractReelsFromInstagramExport(json: unknown): string[] {
  if (!Array.isArray(json)) return []

  const reelRegex = /instagram\.com\/reel\/[A-Za-z0-9_-]+/
  const urls = new Set<string>()

  for (const item of json) {
    if (!item || typeof item !== 'object') continue
    const labelValues = (item as Record<string, unknown>).label_values
    if (!Array.isArray(labelValues)) continue

    for (const entry of labelValues) {
      if (
        entry &&
        typeof entry === 'object' &&
        (entry as Record<string, unknown>).label === 'URL' &&
        typeof (entry as Record<string, unknown>).href === 'string'
      ) {
        const href = (entry as Record<string, unknown>).href as string
        if (reelRegex.test(href)) {
          const match = href.match(/https?:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+/)
          if (match) urls.add(match[0])
        }
      }
    }
  }

  // Shuffle (Fisher-Yates)
  const arr = [...urls]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, MAX_REELS)
}

export function ImportFlow({ lobbyId, playerId, onComplete }: ImportFlowProps) {
  const { submitReels, isPending, error, importedCount, reelUrls, setReelUrls } =
    useReelImport(lobbyId, playerId)

  const [step, setStep] = useState<'upload' | 'confirm'>('upload')
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
          setFileError(
            'Wrong file. Please upload liked_posts.json — not liked_comments.json or any other file.'
          )
          return
        }
        const found = extractReelsFromInstagramExport(json)
        if (found.length === 0) {
          setFileError(
            'No liked Reels found. Make sure your liked_posts.json contains liked Reels (not just posts or comments).'
          )
          return
        }
        setReelUrls(found)
        setStep('confirm')
      } catch {
        setFileError('Could not read the file. Is it a valid JSON file?')
      }
    }
    reader.readAsText(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  if (importedCount > 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-black text-green-400 uppercase">Done!</h2>
        <p className="text-zinc-400">
          Your liked Reels are saved — you won&apos;t see which ones until the game reveals them!
        </p>
        {onComplete && (
          <button
            onClick={onComplete}
            className="bg-yellow-400 text-black font-black uppercase text-sm py-2 px-6
              border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_#000]
              hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
          >
            ← BACK TO LOBBY
          </button>
        )}
      </div>
    )
  }

  // ── Step 2: Confirm ──────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-5 w-full max-w-md mx-auto p-4">
        <div className="text-center">
          <div className="text-5xl mb-2">🎬</div>
          <h2 className="text-2xl font-black uppercase text-yellow-400">Ready!</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Found <span className="text-white font-black">{reelUrls.length} Reels</span> in your
            export — they&apos;re shuffled so you can&apos;t see which ones.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-4xl font-black text-yellow-400">{reelUrls.length}</div>
          <div className="text-zinc-400 text-sm">liked Reels found</div>
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {Array.from({ length: Math.min(reelUrls.length, 12) }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-sm">
                🎬
              </div>
            ))}
            {reelUrls.length > 12 && (
              <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center text-xs text-zinc-400">
                +{reelUrls.length - 12}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

        <button
          onClick={submitReels}
          disabled={isPending}
          className="w-full bg-green-400 text-black font-black uppercase text-lg py-4 px-6
            border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000]
            hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
            active:translate-y-[4px] active:shadow-none
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? '⏳ SAVING...' : '🚀 SUBMIT REELS'}
        </button>
        <button
          onClick={() => { setStep('upload'); setReelUrls([]) }}
          className="text-zinc-500 text-sm underline text-center"
        >
          ← Upload a different file
        </button>
      </div>
    )
  }

  // ── Step 1: Upload ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 w-full max-w-md mx-auto p-4">
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase text-yellow-400">📥 Import Reels</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Upload your Instagram data export — the game picks your liked Reels
          <strong className="text-white"> without showing them to you</strong>.
        </p>
      </div>

      {/* CTA Button */}
      <a
        href="https://accountscenter.instagram.com/info_and_permissions/dyi/?show_frameless=1"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2
          bg-pink-500 text-white font-black uppercase text-sm py-3.5 px-6
          border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000]
          hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
          active:translate-y-[4px] active:shadow-none
          transition-all"
      >
        📲 Open Instagram Data Export ↗
      </a>

      {/* How-to */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-black text-zinc-300 uppercase">Follow these steps</p>
        <ol className="flex flex-col gap-2.5">
          {([
            { text: <>Select <strong className="text-white">&ldquo;Download or transfer information&rdquo;</strong></> },
            { text: <>Choose <strong className="text-white">&ldquo;Some of your information&rdquo;</strong> → check only <strong className="text-yellow-400">Likes</strong> → Next</> },
            { text: <>Select <strong className="text-white">&ldquo;Download to device&rdquo;</strong> → Next</> },
            { text: <>Date range: <strong className="text-yellow-400">Last year</strong> · Format: <strong className="text-yellow-400">JSON</strong> · Media quality: <strong className="text-yellow-400">Low</strong> → Create files</> },
            { text: <>Unzip the file → go into <code className="text-yellow-400 text-xs">your_instagram_activity/likes/</code> → upload <code className="text-yellow-400 text-xs">liked_posts.json</code> below</> },
          ] as { text: React.ReactNode }[]).map(({ text }, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
              <span className="w-5 h-5 bg-yellow-400 text-black rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
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
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3
          cursor-pointer transition-all
          ${isDragging
            ? 'border-yellow-400 bg-yellow-400/5'
            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
          }`}
      >
        <div className="text-4xl">📂</div>
        <p className="text-zinc-300 font-bold text-sm text-center">
          Tap to select <code className="text-yellow-400">liked_posts.json</code>
          <span className="text-zinc-500"> or drag & drop</span>
        </p>
        <p className="text-xs text-zinc-600">
          We&apos;ll randomly pick up to {MAX_REELS} Reels from your likes
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {fileError && (
        <p className="text-red-400 text-sm font-bold text-center">{fileError}</p>
      )}
    </div>
  )
}

