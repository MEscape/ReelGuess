import { getLobbyByCode }  from '@/features/lobby/queries'
import { notFound }        from 'next/navigation'
import { LobbyClient } from './lobby-client'

// ─────────────────────────────────────────────────────────────────────────────
// LobbyPage — server component
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    params: Promise<{ code: string }>
}

export default async function LobbyPage({ params }: Props) {
    const { code } = await params
    const result   = await getLobbyByCode(code.toUpperCase())

    if (result.isErr()) notFound()

    return <LobbyClient lobby={result.value} />
}