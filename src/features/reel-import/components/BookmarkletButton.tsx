'use client'

import { getBookmarkletHref } from '../bookmarklet'

export function BookmarkletButton() {
  const href = getBookmarkletHref()

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-zinc-400 font-bold">
        ⬇️ Drag this to your bookmarks bar:
      </p>
      <a
        href={href}
        onClick={(e) => e.preventDefault()}
        draggable
        className="inline-flex items-center gap-2 bg-yellow-400 text-black font-black text-sm uppercase px-6 py-3 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] cursor-grab active:cursor-grabbing hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all select-none"
      >
        📎 ReelGuess Collector
      </a>
      <p className="text-xs text-zinc-500 text-center max-w-xs">
        Or right-click → &quot;Add to bookmarks&quot;
      </p>
    </div>
  )
}
