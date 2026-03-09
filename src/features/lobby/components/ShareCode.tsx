'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
        Lobby Code
      </p>
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 w-full justify-center
          bg-zinc-900 border-2 border-yellow-400 rounded-2xl px-6 py-4
          shadow-brutal-yellow
          hover:translate-y-[2px] hover:shadow-brutal-sm
          active:translate-y-[4px] active:shadow-none
          transition-all duration-200 group"
      >
        <span className="text-4xl font-black tracking-[0.25em] text-yellow-400 font-mono">
          {code}
        </span>
        <span className="ml-1">
          {copied ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <Copy className="w-5 h-5 text-zinc-500 group-hover:text-yellow-400 transition-colors duration-200" />
          )}
        </span>
      </button>
      <p className="text-xs text-zinc-600 h-4">
        {copied ? '✅ Copied to clipboard!' : 'Tap to copy'}
      </p>
    </div>
  )
}
