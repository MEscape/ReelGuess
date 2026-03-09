import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Call this route via a cron service (e.g. Vercel Cron, GitHub Actions, cron-job.org):
// GET /api/cron/cleanup-lobbies
// Header: Authorization: Bearer <CRON_SECRET>
//
// Vercel cron.json example:
// { "crons": [{ "path": "/api/cron/cleanup-lobbies", "schedule": "0 3 * * *" }] }
//
// Deletes lobbies that:
// - are still 'waiting' and were created more than 2 hours ago (abandoned before game start)
// - are 'finished' and were created more than 7 days ago
// - are 'playing' and were created more than 24 hours ago (crashed mid-game)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date()

    const cutoffs = {
      waiting:  new Date(now.getTime() - 2  * 60 * 60 * 1000),  // 2h
      playing:  new Date(now.getTime() - 24 * 60 * 60 * 1000),  // 24h
      finished: new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000), // 7d
    }

    const results: Record<string, number> = {}

    for (const [status, cutoff] of Object.entries(cutoffs)) {
      const { data, error } = await supabase
        .from('lobbies')
        .delete()
        .eq('status', status)
        .lt('created_at', cutoff.toISOString())
        .select('id')

      if (error) {
        console.error(`[cleanup] Error deleting ${status} lobbies:`, error.message)
        results[status] = 0
      } else {
        results[status] = data?.length ?? 0
      }
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0)
    console.log(`[cleanup] Deleted lobbies:`, results)

    return NextResponse.json({
      ok: true,
      deleted: results,
      total,
      timestamp: now.toISOString(),
    })
  } catch (e) {
    console.error('[cleanup] Unexpected error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

