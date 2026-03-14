import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { checkRateLimit }            from '@/lib/rate-limit'

// Simple UUID v4 regex for early rejection of obviously invalid IDs
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * GET /api/reel/[id]
 *
 * Returns the Instagram URL for a specific reel.
 * Cached for 1 hour at the edge — reel content never changes.
 *
 * Protected by:
 * - UUID format validation (early-rejects garbage IDs).
 * - IP-based rate limiting (10/min — adequate for normal prefetch, blocks scrapers).
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown'

    const rl = await checkRateLimit('revealRound', ip)
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params

    if (!UUID_RE.test(id)) {
        return NextResponse.json({ error: 'Invalid reel ID' }, { status: 400 })
    }

    const supabase = createClient()

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