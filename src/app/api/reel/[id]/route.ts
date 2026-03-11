import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'

/**
 * GET /api/reel/[id]
 *
 * Returns the Instagram URL for a specific reel.
 * Cached for 1 hour at the edge — reel content never changes.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id }   = await params
    const supabase = await createClient()

    const { data: reel } = await supabase
        .from('reels')
        .select('instagram_url')
        .eq('id', id)
        .maybeSingle()

    if (!reel) {
        return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    return NextResponse.json(
        { instagramUrl: reel.instagram_url as string },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } },
    )
}