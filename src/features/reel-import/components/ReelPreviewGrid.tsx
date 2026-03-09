'use client'

type ReelPreviewGridProps = {
  reelUrls: string[]
}

export function ReelPreviewGrid({ reelUrls }: ReelPreviewGridProps) {
  if (reelUrls.length === 0) return null

  return (
    <div className="w-full">
      <h3 className="text-lg font-black text-white mb-2">
        🎬 {reelUrls.length} Reels Ready
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
        {reelUrls.map((url, i) => {
          const reelId = url.split('/reel/')[1]?.split('/')[0] ?? ''
          return (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-center"
            >
              <div className="w-full aspect-[9/16] bg-zinc-800 rounded-md flex items-center justify-center mb-1">
                <span className="text-3xl">🎬</span>
              </div>
              <p className="text-xs text-zinc-500 truncate font-mono">
                {reelId.slice(0, 10)}...
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

