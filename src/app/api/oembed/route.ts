import { NextRequest, NextResponse } from 'next/server'
import { ResultAsync } from 'neverthrow'

type OEmbedData = {
  html: string
  thumbnail_url: string
  title: string
}

type OEmbedError = {
  type: 'OEMBED_FETCH_ERROR'
  message: string
}

function fetchOEmbed(url: string): ResultAsync<OEmbedData, OEmbedError> {
  return ResultAsync.fromPromise(
    fetch(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Instagram oEmbed returned ${res.status}`)
        }
        return res.json() as Promise<OEmbedData>
      }),
    (error) => ({
      type: 'OEMBED_FETCH_ERROR' as const,
      message: error instanceof Error ? error.message : 'Unknown error fetching oEmbed',
    })
  )
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  if (!url.includes('instagram.com/reel/')) {
    return NextResponse.json(
      { error: 'URL must be an Instagram Reel' },
      { status: 400 }
    )
  }

  const result = await fetchOEmbed(url)

  return result.match(
    (data) =>
      NextResponse.json(
        {
          embedHtml: data.html,
          thumbnailUrl: data.thumbnail_url,
          caption: data.title ?? '',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
          },
        }
      ),
    (error) =>
      NextResponse.json(
        { error: error.message },
        { status: 502 }
      )
  )
}

