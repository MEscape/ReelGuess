'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

type ShareCodeProps = {
  code: string
}

export function ShareCode({ code }: ShareCodeProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">
        Lobby Code
      </p>
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 bg-zinc-900 border-2 border-yellow-400 rounded-xl px-6 py-4 hover:bg-zinc-800 transition-colors group"
      >
        <span className="text-4xl font-black tracking-[0.3em] text-yellow-400">
          {code}
        </span>
        {copied ? (
          <Check className="w-6 h-6 text-green-400" />
        ) : (
          <Copy className="w-6 h-6 text-zinc-400 group-hover:text-yellow-400 transition-colors" />
        )}
      </button>
      <p className="text-xs text-zinc-500">
        {copied ? '✅ Copied!' : 'Click to copy'}
      </p>
    </div>
  )
}
