import type { Player } from '@/features/player/types'
import { mapPlayerRow, type PlayerRow } from '@/features/player/types'

export type LobbyStatus = 'waiting' | 'playing' | 'finished'

export type GameSettings = {
  roundsCount: number
  timerSeconds: number
}

export type Lobby = {
  id: string
  hostId: string
  status: LobbyStatus
  settings: GameSettings
  players: Player[]
  createdAt: Date
}

export type LobbyRow = {
  id: string
  host_id: string
  status: string
  settings: { rounds_count: number; timer_seconds: number }
  created_at: string
  players?: PlayerRow[]
}

export function mapLobbyRow(row: LobbyRow): Lobby {
  return {
    id: row.id,
    hostId: row.host_id,
    status: row.status as LobbyStatus,
    settings: {
      roundsCount: row.settings.rounds_count,
      timerSeconds: row.settings.timer_seconds,
    },
    players: (row.players ?? []).map(mapPlayerRow),
    createdAt: new Date(row.created_at),
  }
}
