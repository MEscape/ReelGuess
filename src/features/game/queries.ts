import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Round, RoundRow, Vote, VoteRow, ScoreEntry, ScoreRow } from './types'
import { mapRoundRow, mapVoteRow } from './types'
import type { GameError } from './errors'

export function getCurrentRound(lobbyId: string): ResultAsync<Round | null, GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('lobby_id', lobbyId)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw {
          type: 'GAME_DATABASE_ERROR',
          message: error.message,
        } satisfies GameError
      }

      return data ? mapRoundRow(data as unknown as RoundRow) : null
    })(),
    (e) => e as GameError
  )
}

export function getRoundById(roundId: string): ResultAsync<Round, GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', roundId)
        .single()

      if (error || !data) {
        throw { type: 'ROUND_NOT_FOUND', roundId } satisfies GameError
      }

      return mapRoundRow(data as unknown as RoundRow)
    })(),
    (e) => e as GameError
  )
}

export function getVotesForRound(roundId: string): ResultAsync<Vote[], GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', roundId)

      if (error) {
        throw {
          type: 'GAME_DATABASE_ERROR',
          message: error.message,
        } satisfies GameError
      }

      return (data as unknown as VoteRow[]).map(mapVoteRow)
    })(),
    (e) => e as GameError
  )
}

export function getScores(lobbyId: string): ResultAsync<ScoreEntry[], GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('scores')
        .select('*, players!scores_player_id_fkey(display_name, avatar_seed)')
        .eq('lobby_id', lobbyId)
        .order('points', { ascending: false })

      if (error) {
        throw {
          type: 'GAME_DATABASE_ERROR',
          message: error.message,
        } satisfies GameError
      }

      return (data as unknown as ScoreRow[]).map((row) => ({
        playerId: row.player_id,
        displayName: row.players?.display_name ?? 'Unknown',
        avatarSeed: row.players?.avatar_seed ?? '',
        points: row.points,
        streak: row.streak,
      }))
    })(),
    (e) => e as GameError
  )
}

