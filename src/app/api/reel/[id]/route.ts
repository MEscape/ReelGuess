import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: reel } = await supabase
    .from('reels')
    .select('id, embed_html, instagram_url')
    .eq('id', id)
    .single()

  if (!reel) {
    return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
  }

  return NextResponse.json(
    { embedHtml: (reel.embed_html as string | null) ?? null, instagramUrl: reel.instagram_url },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
  )
}

