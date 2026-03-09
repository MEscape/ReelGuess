export type Player = {
  id: string
  lobbyId: string
  displayName: string
  avatarSeed: string
  isHost: boolean
  joinedAt: Date
}

export type PlayerRow = {
  id: string
  lobby_id: string
  display_name: string
  avatar_seed: string
  is_host: boolean
  joined_at: string
}

export function mapPlayerRow(row: PlayerRow): Player {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    displayName: row.display_name,
    avatarSeed: row.avatar_seed,
    isHost: row.is_host,
    joinedAt: new Date(row.joined_at),
  }
}

