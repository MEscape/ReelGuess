'use client'

import { useState, useRef } from 'react'

type PasteImportProps = {
  onPaste: (text: string) => void
  isPending?: boolean
}

export function PasteImport({ onPaste, isPending }: PasteImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleFocus() {
    // Auto-read clipboard on focus
    try {
      const text = await navigator.clipboard.readText()
      if (text.includes('"reels"') && text.includes('"v"')) {
        onPaste(text)
      }
    } catch {
      // Clipboard access denied, user will paste manually
    }
  }

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        onFocus={handleFocus}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text')
          onPaste(text)
        }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const text = e.dataTransfer.getData('text')
          if (text) onPaste(text)
        }}
        placeholder="📋 Paste your copied reels data here..."
        disabled={isPending}
        className={`w-full h-32 px-4 py-3 bg-zinc-900 rounded-xl text-white text-sm font-mono
          placeholder:text-zinc-500 resize-none
          focus:outline-none focus:ring-2 focus:ring-yellow-400/50
          transition-all
          ${isDragging
            ? 'border-2 border-dashed border-yellow-400 bg-yellow-400/5'
            : 'border-2 border-dashed border-zinc-700'
          }`}
      />
    </div>
  )
}

