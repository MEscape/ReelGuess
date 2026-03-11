import { getLobbyByCode } from '@/features/lobby/queries'
import { notFound }       from 'next/navigation'
import { LobbyPageClient } from './LobbyPageClient'

type Props = {
    params:       Promise<{ code: string }>
    searchParams: Promise<{ import?: string }>
}

export default async function LobbyPage({ params, searchParams }: Props) {
    const { code }   = await params
    const search     = await searchParams
    const upperCode  = code.toUpperCase()

    const lobbyResult = await getLobbyByCode(upperCode)
    if (lobbyResult.isErr()) notFound()

    return (
        <LobbyPageClient
            lobby={lobbyResult.value}
            showImport={search.import === 'true'}
        />
    )
}