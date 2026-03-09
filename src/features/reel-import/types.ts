export type Reel = {
  id: string
  lobbyId: string
  ownerId: string
  instagramUrl: string
  embedHtml: string | null
  thumbnailUrl: string | null
  caption: string | null
  used: boolean
  createdAt: Date
}

export type ReelRow = {
  id: string
  lobby_id: string
  owner_id: string
  instagram_url: string
  embed_html: string | null
  thumbnail_url: string | null
  caption: string | null
  used: boolean
  created_at: string
}

export type OEmbedResponse = {
  embedHtml: string
  thumbnailUrl: string
  caption: string
}

export type BookmarkletPayload = {
  v: number
  reels: string[]
}

export function mapReelRow(row: ReelRow): Reel {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    ownerId: row.owner_id,
    instagramUrl: row.instagram_url,
    embedHtml: row.embed_html,
    thumbnailUrl: row.thumbnail_url,
    caption: row.caption,
    used: row.used,
    createdAt: new Date(row.created_at),
  }
}

