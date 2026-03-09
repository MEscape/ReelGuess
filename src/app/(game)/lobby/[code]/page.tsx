import { getLobbyByCode } from '@/features/lobby/queries'
import { LobbyRoom } from '@/features/lobby/components/LobbyRoom'
import { ImportFlow } from '@/features/reel-import/components/ImportFlow'
import { notFound } from 'next/navigation'
import { LobbyPageClient } from './LobbyPageClient'

type LobbyPageProps = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ import?: string }>
}

export default async function LobbyPage({ params, searchParams }: LobbyPageProps) {
  const { code } = await params
  const search = await searchParams

  const lobbyResult = await getLobbyByCode(code.toUpperCase())

  if (lobbyResult.isErr()) {
    notFound()
  }

  const lobby = lobbyResult.value
  const showImport = search.import === 'true'

  return <LobbyPageClient lobby={lobby} showImport={showImport} />
}

