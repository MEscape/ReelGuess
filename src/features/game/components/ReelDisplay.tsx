'use client'

declare global {
  interface Window {
    instgrm?: { Embeds?: { process: () => void } }
  }
}

type ReelDisplayProps = {
  embedHtml: string | null
  instagramUrl: string
}

function getShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

export function ReelDisplay({ embedHtml, instagramUrl }: ReelDisplayProps) {
  const shortcode = getShortcode(instagramUrl)

  // Use direct iframe embed – shows only the reel video + caption, no header/footer clutter
  if (shortcode) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-zinc-700 bg-black shadow-[0_0_24px_rgba(0,0,0,0.6)]">
        <iframe
          src={`https://www.instagram.com/reel/${shortcode}/embed/captioned/`}
          className="w-full"
          style={{ height: 560, border: 'none', display: 'block' }}
          allowFullScreen
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      </div>
    )
  }

  // Fallback if no shortcode parseable
  if (embedHtml) {
    return (
      <div
        className="w-full max-w-sm mx-auto rounded-xl overflow-hidden"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-zinc-900 rounded-xl border-2 border-zinc-800 p-6 text-center">
      <div className="text-6xl mb-4">🎬</div>
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-pink-500 text-white font-bold uppercase text-sm
          py-2 px-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000]
          hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
      >
        📺 Watch on Instagram
      </a>
    </div>
  )
}
