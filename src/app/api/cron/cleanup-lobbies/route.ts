import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'

/**
 * GET /api/cron/cleanup-lobbies
 *
 * ── Why it might not run ──────────────────────────────────────────────────
 * 1. Vercel Cron requires the Hobby plan or above. Free plan = no cron.
 * 2. CRON_SECRET must be set in Vercel project environment variables.
 *    Vercel automatically injects `Authorization: Bearer <CRON_SECRET>`
 *    when it invokes the cron — you never send this manually.
 * 3. The route must be `dynamic = 'force-dynamic'` to prevent Next.js from
 *    statically pre-rendering it (which would make it a no-op at runtime).
 *
 * ── Setup ─────────────────────────────────────────────────────────────────
 * 1. Add CRON_SECRET to Vercel project env vars (any random string, e.g.
 *    `openssl rand -hex 32`).
 * 2. Ensure vercel.json has the crons entry (already present).
 * 3. Deploy — Vercel runs this at 03:00 UTC every day automatically.
 *
 * ── Retention policy ──────────────────────────────────────────────────────
 * - `waiting`  lobbies older than 2h  → abandoned before game start
 * - `playing`  lobbies older than 24h → crashed mid-game
 * - `finished` lobbies older than 7d  → data retention window
 */

// REQUIRED: prevents Next.js from statically caching this route.
// Without this, the function may never actually execute at runtime.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    // Vercel automatically sends Authorization: Bearer <CRON_SECRET>
    // for its own cron invocations. We always require it in production.
    const secret = process.env.CRON_SECRET
    if (!secret) {
        console.error('[cleanup] CRON_SECRET env var is not set — rejecting request')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }
    if (req.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const now      = new Date()

    const cutoffs = [
        { status: 'waiting',  cutoff: new Date(now.getTime() - 2  * 60 * 60 * 1000) },   // 2h
        { status: 'playing',  cutoff: new Date(now.getTime() - 24 * 60 * 60 * 1000) },   // 24h
        { status: 'finished', cutoff: new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000) }, // 7d
    ] as const

    const results: Record<string, number> = {}

    for (const { status, cutoff } of cutoffs) {
        const { data, error } = await supabase
            .from('lobbies')
            .delete()
            .eq('status', status)
            .lt('created_at', cutoff.toISOString())
            .select('id')

        if (error) {
            console.error(`[cleanup] Failed to delete ${status} lobbies:`, error.message)
            results[status] = 0
        } else {
            results[status] = data?.length ?? 0
        }
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0)
    console.log('[cleanup] Deleted lobbies:', results, '— total:', total)

    return NextResponse.json({ ok: true, deleted: results, total, timestamp: now.toISOString() })
}
