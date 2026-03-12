import { NextRequest, NextResponse } from 'next/server'
import { z }                        from 'zod'
import { checkRateLimit }           from '@/lib/rate-limit'
import { insertReaction }           from '@/features/reactions/mutations'
import { REACTION_EMOJIS }          from '@/features/reactions/types'

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const ReactionSchema = z.object({
    lobbyId:  z.string().min(1),
    playerId: z.string().uuid(),
    emoji:    z.enum(REACTION_EMOJIS),
})

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/reactions
 *
 * Inserts an emoji reaction for a player. Rate limited to 10 per 10 seconds per
 * player to prevent spam.
 *
 * Body: `{ lobbyId, playerId, emoji }`
 */
export async function POST(req: NextRequest) {
    // ── Rate limiting (keyed by playerId) ────────────────────────────────────
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = ReactionSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { lobbyId, playerId, emoji } = parsed.data

    const rl = await checkRateLimit('submitReaction', playerId)
    if (!rl.success) {
        return NextResponse.json(
            { error: 'Too many reactions. Please wait.' },
            { status: 429, headers: rl.headers },
        )
    }

    // ── Insert ───────────────────────────────────────────────────────────────
    const result = await insertReaction(lobbyId, playerId, emoji)
    if (result.isErr()) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, reaction: result.value }, { status: 201 })
}
