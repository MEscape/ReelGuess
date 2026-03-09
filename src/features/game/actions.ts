'use server'

import { SubmitVoteSchema, StartNextRoundSchema, RevealRoundSchema } from './validations'
import { getCurrentRound, getRoundById, getVotesForRound, getScores } from './queries'
import { createRound, updateRoundStatus, insertVote, upsertScore } from './mutations'
import { getLobbyByCode } from '@/features/lobby/queries'
import type { GameError } from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import type { Round, Vote, RoundReveal, ScoreEntry } from './types'
import { createClient } from '@/lib/supabase/server'

export type StartRoundResult = Round & { instagramUrl: string }

export async function startNextRoundAction(
  lobbyId: string,
  hostPlayerId: string
): Promise<SerializedResult<StartRoundResult, GameError>> {
  const parsed = StartNextRoundSchema.safeParse({ lobbyId, hostPlayerId })
  if (!parsed.success) {
    return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
  }

  const lobbyResult = await getLobbyByCode(lobbyId)
  if (lobbyResult.isErr()) {
    return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Lobby not found' } }
  }

  const lobby = lobbyResult.value
  if (lobby.hostId !== hostPlayerId) {
    return { ok: false, error: { type: 'GAME_NOT_HOST', playerId: hostPlayerId } }
  }

  const currentRoundResult = await getCurrentRound(lobbyId)
  if (currentRoundResult.isErr()) {
    return { ok: false, error: currentRoundResult.error }
  }

  const currentRound = currentRoundResult.value
  const nextRoundNumber = currentRound ? currentRound.roundNumber + 1 : 1

  if (nextRoundNumber > lobby.settings.roundsCount) {
    return { ok: false, error: { type: 'GAME_ALREADY_FINISHED', lobbyId } }
  }

  const supabase = await createClient()
  const { data: unusedReels, error: reelError } = await supabase
    .from('reels')
    .select('*')
    .eq('lobby_id', lobbyId)
    .eq('used', false)

  if (reelError || !unusedReels || unusedReels.length === 0) {
    return { ok: false, error: { type: 'NO_REELS_AVAILABLE', lobbyId } }
  }

  // Pick a random unused reel – no oEmbed pre-check needed
  const shuffled = [...unusedReels].sort(() => Math.random() - 0.5)
  const chosenReel = shuffled[0]

  await supabase.from('reels').update({ used: true }).eq('id', chosenReel.id)

  const roundResult = await createRound(lobbyId, nextRoundNumber, chosenReel.id, chosenReel.owner_id)
  if (roundResult.isErr()) {
    return { ok: false, error: roundResult.error }
  }

  return {
    ok: true,
    value: { ...roundResult.value, instagramUrl: chosenReel.instagram_url as string },
  }
}

export async function submitVoteAction(
  roundId: string,
  voterId: string,
  votedForId: string
): Promise<SerializedResult<Vote, GameError>> {
  const parsed = SubmitVoteSchema.safeParse({ roundId, voterId, votedForId })
  if (!parsed.success) {
    return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid input' } }
  }

  const roundResult = await getRoundById(roundId)
  if (roundResult.isErr()) {
    return { ok: false, error: roundResult.error }
  }

  const round = roundResult.value
  if (round.status !== 'voting') {
    return { ok: false, error: { type: 'NOT_VOTING_PHASE', roundId, currentStatus: round.status } }
  }

  const existingVotes = await getVotesForRound(roundId)
  if (existingVotes.isErr()) {
    return { ok: false, error: existingVotes.error }
  }

  if (existingVotes.value.find((v) => v.voterId === voterId)) {
    return { ok: false, error: { type: 'ALREADY_VOTED', roundId, voterId } }
  }

  const voteResult = await insertVote(
    roundId,
    voterId,
    votedForId,
    votedForId === round.correctPlayerId
  )
  if (voteResult.isErr()) {
    return { ok: false, error: voteResult.error }
  }

  // Auto-reveal if all players voted
  const lobby = await getLobbyByCode(round.lobbyId)
  if (lobby.isOk()) {
    const totalVotes = existingVotes.value.length + 1
    if (totalVotes >= lobby.value.players.length) {
      await revealRoundAction(roundId)
    }
  }

  return { ok: true, value: voteResult.value }
}

export async function revealRoundAction(
  roundId: string
): Promise<SerializedResult<RoundReveal, GameError>> {
  const parsed = RevealRoundSchema.safeParse({ roundId })
  if (!parsed.success) {
    return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Invalid round ID' } }
  }

  // Fetch current round first to check status (idempotency guard)
  const roundResult = await getRoundById(roundId)
  if (roundResult.isErr()) {
    return { ok: false, error: roundResult.error }
  }
  const round = roundResult.value

  // If already complete, just return existing data without recomputing scores
  if (round.status === 'complete') {
    const [votesResult, scoresResult, lobby] = await Promise.all([
      getVotesForRound(roundId),
      getScores(round.lobbyId),
      getLobbyByCode(round.lobbyId),
    ])
    const scores = scoresResult.isOk() ? scoresResult.value : []
    const correctPlayer = lobby.isOk()
      ? lobby.value.players.find((p) => p.id === round.correctPlayerId)
      : null
    return {
      ok: true,
      value: {
        round,
        correctPlayerName: correctPlayer?.displayName ?? 'Unknown',
        scores,
        votes: votesResult.isOk() ? votesResult.value : [],
      },
    }
  }

  // If already in reveal status (another client beat us), skip DB write but still compute
  const shouldUpdateScores = round.status !== 'reveal'

  if (round.status !== 'voting' && round.status !== 'reveal') {
    return { ok: false, error: { type: 'GAME_DATABASE_ERROR', message: 'Round cannot be revealed' } }
  }

  // Only update status to 'reveal' if currently 'voting'
  if (round.status === 'voting') {
    const statusResult = await updateRoundStatus(roundId, 'reveal')
    if (statusResult.isErr()) {
      return { ok: false, error: statusResult.error }
    }
  }

  const votesResult = await getVotesForRound(roundId)
  if (votesResult.isErr()) {
    return { ok: false, error: votesResult.error }
  }

  // Only compute + write scores if we were the ones who transitioned voting→reveal
  if (shouldUpdateScores) {
    // Process each vote: correct = +100pts (+ streak bonus), wrong = 0pts, streak reset
    for (const vote of votesResult.value) {
      if (vote.isCorrect) {
        // Read current streak for this player to compute bonus
        const supabase = await createClient()
        const { data: existing } = await supabase
          .from('scores')
          .select('points, streak')
          .eq('player_id', vote.voterId)
          .eq('lobby_id', round.lobbyId)
          .maybeSingle()
        const currentStreak = existing?.streak ?? 0
        const newStreak = currentStreak + 1
        // Streak bonus: +50 from the 2nd correct answer in a row (streak >= 1 before this round)
        const streakBonus = currentStreak >= 1 ? 50 : 0
        await upsertScore(vote.voterId, round.lobbyId, 100 + streakBonus, newStreak)
      } else {
        await upsertScore(vote.voterId, round.lobbyId, 0, 0)
      }
    }
    // Note: status is NOT set to 'complete' here – the host client does that after the reveal delay
  }

  const updatedScores = await getScores(round.lobbyId)
  const scores: ScoreEntry[] = updatedScores.isOk() ? updatedScores.value : []

  const lobby = await getLobbyByCode(round.lobbyId)
  const correctPlayer = lobby.isOk()
    ? lobby.value.players.find((p) => p.id === round.correctPlayerId)
    : null


  return {
    ok: true,
    value: {
      round,
      correctPlayerName: correctPlayer?.displayName ?? 'Unknown',
      scores,
      votes: votesResult.value,
    },
  }
}

export async function completeRoundAction(
  roundId: string
): Promise<SerializedResult<void, GameError>> {
  const result = await updateRoundStatus(roundId, 'complete')
  if (result.isErr()) return { ok: false, error: result.error }
  return { ok: true, value: undefined }
}

