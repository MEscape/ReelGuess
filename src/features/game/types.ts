export type RoundStatus = 'countdown' | 'voting' | 'reveal' | 'complete'

export type Round = {
  id: string
  lobbyId: string
  roundNumber: number
  reelId: string
  correctPlayerId: string | null
  status: RoundStatus
  startedAt: Date
  revealedAt: Date | null
}

export type RoundRow = {
  id: string
  lobby_id: string
  round_number: number
  reel_id: string
  correct_player_id: string | null
  status: string
  started_at: string
  revealed_at: string | null
}

export type Vote = {
  id: string
  roundId: string
  voterId: string
  votedForId: string
  isCorrect: boolean
}

export type VoteRow = {
  id: string
  round_id: string
  voter_id: string
  voted_for_id: string
  is_correct: boolean
  submitted_at: string
}

export type ScoreEntry = {
  playerId: string
  displayName: string
  avatarSeed: string
  points: number
  streak: number
}

export type ScoreRow = {
  player_id: string
  lobby_id: string
  points: number
  streak: number
  players?: {
    display_name: string
    avatar_seed: string
  }
}

export type RoundReveal = {
  round: Round
  correctPlayerName: string
  scores: ScoreEntry[]
  votes: Vote[]
}

export function mapRoundRow(row: RoundRow): Round {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    roundNumber: row.round_number,
    reelId: row.reel_id,
    correctPlayerId: row.correct_player_id,
    status: row.status as RoundStatus,
    startedAt: new Date(row.started_at),
    revealedAt: row.revealed_at ? new Date(row.revealed_at) : null,
  }
}

export function mapVoteRow(row: VoteRow): Vote {
  return {
    id: row.id,
    roundId: row.round_id,
    voterId: row.voter_id,
    votedForId: row.voted_for_id,
    isCorrect: row.is_correct,
  }
}

