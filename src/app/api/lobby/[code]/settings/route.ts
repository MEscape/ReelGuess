import { NextRequest, NextResponse } from 'next/server'
import { updateSettings }            from '@/features/lobby/service'
import { LobbyCodeSchema, LobbySettingsSchema, PlayerIdSchema } from '@/features/lobby/validations'
import { checkRateLimit }            from '@/lib/rate-limit'

/**
 * PATCH /api/lobby/[code]/settings
 *
 * Updates lobby settings without triggering a Next.js router refresh.
 * Using an API Route instead of a Server Action avoids the automatic
 * router.refresh() that Next.js 15/16 fires after every Server Action call,
 * which caused LobbyClient to remount and briefly show NotMemberScreen.
 *
 * Body: { hostPlayerId: string, roundsCount: number, timerSeconds: number }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) {
    const { code } = await params
    const lobbyCode = code.toUpperCase()

    if (!LobbyCodeSchema.safeParse(lobbyCode).success) {
        return NextResponse.json({ error: 'Invalid lobby code' }, { status: 400 })
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { hostPlayerId, ...settingsRaw } = body as Record<string, unknown>

    if (!PlayerIdSchema.safeParse(hostPlayerId).success) {
        return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
    }

    const parsed = LobbySettingsSchema.safeParse(settingsRaw)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid settings', issues: parsed.error.issues }, { status: 400 })
    }

    // Rate limit keyed on hostPlayerId
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? (hostPlayerId as string)
    const rl = await checkRateLimit('updateSettings', ip)
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const result = await updateSettings(lobbyCode, hostPlayerId as string, parsed.data)
    if (result.isErr()) {
        const e = result.error
        const msg = 'message' in e ? e.message : 'Update failed'
        return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
}

