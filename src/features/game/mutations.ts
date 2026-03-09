import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Round, RoundRow, Vote, VoteRow } from './types'
import { mapRoundRow, mapVoteRow } from './types'
import type { GameError } from './errors'

export function createRound(
  lobbyId: string,
  roundNumber: number,
  reelId: string,
  correctPlayerId: string
): ResultAsync<Round, GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('rounds')
        .insert({
          lobby_id: lobbyId,
          round_number: roundNumber,
          reel_id: reelId,
          correct_player_id: correctPlayerId,
          status: 'voting',
        })
        .select()
        .single()

      if (error || !data) {
        throw {
          type: 'GAME_DATABASE_ERROR',
          message: error?.message ?? 'Failed to create round',
        } satisfies GameError
      }

      return mapRoundRow(data as unknown as RoundRow)
    })(),
    (e) => e as GameError
  )
}

export function updateRoundStatus(
  roundId: string,
  status: 'countdown' | 'voting' | 'reveal' | 'complete'
): ResultAsync<void, GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const updateData: Record<string, unknown> = { status }
      if (status === 'reveal') {
        updateData.revealed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('rounds')
        .update(updateData)
        .eq('id', roundId)

      if (error) {
        throw {
          type: 'GAME_DATABASE_ERROR',
          message: error.message,
        } satisfies GameError
      }
    })(),
    (e) => e as GameError
  )
}

export function insertVote(
  roundId: string,
  voterId: string,
  votedForId: string,
  isCorrect: boolean
): ResultAsync<Vote, GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('votes')
        .insert({
          round_id: roundId,
          voter_id: voterId,
          voted_for_id: votedForId,
          is_correct: isCorrect,
        })
        .select()
        .single()

      if (error || !data) {
        throw {
          type: 'GAME_DATABASE_ERROR',
          message: error?.message ?? 'Failed to insert vote',
        } satisfies GameError
      }

      return mapVoteRow(data as unknown as VoteRow)
    })(),
    (e) => e as GameError
  )
}

export function upsertScore(
  playerId: string,
  lobbyId: string,
  pointsToAdd: number,
  newStreak: number
): ResultAsync<void, GameError> {
  return ResultAsync.fromPromise(
    (async () => {
      const supabase = await createClient()

      const { data: existing } = await supabase
        .from('scores')
        .select('points')
        .eq('player_id', playerId)
        .eq('lobby_id', lobbyId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('scores')
          .update({
            points: existing.points + pointsToAdd,
            streak: newStreak,
          })
          .eq('player_id', playerId)
          .eq('lobby_id', lobbyId)

        if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
      } else {
        const { error } = await supabase
          .from('scores')
          .insert({ player_id: playerId, lobby_id: lobbyId, points: pointsToAdd, streak: newStreak })

        if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
      }
    })(),
    (e) => e as GameError
  )
}

