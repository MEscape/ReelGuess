import { ResultAsync }                      from 'neverthrow'
import { createClient }                    from '@/lib/supabase/server'
import { mapRoundRow, mapVoteRow }         from './types'
import type { Round, RoundRow, Vote, VoteRow, ScoreEntry, ScoreRow, ReelData } from './types'
import type { GameError }                  from './errors'

// ─────────────────────────────────────────────────────────────────────────────
// Rounds
// ─────────────────────────────────────────────────────────────────────────────

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

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return data ? mapRoundRow(data as unknown as RoundRow) : null
        })(),
        (e) => e as GameError,
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

            if (error || !data) throw { type: 'ROUND_NOT_FOUND', roundId } satisfies GameError
            return mapRoundRow(data as unknown as RoundRow)
        })(),
        (e) => e as GameError,
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Votes
// ─────────────────────────────────────────────────────────────────────────────

export function getVotesForRound(roundId: string): ResultAsync<Vote[], GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('votes')
                .select('id, round_id, voter_id, voted_for_id, is_correct, vote_time_ms, used_double, points_awarded')
                .eq('round_id', roundId)

            // PostgreSQL error 42703 = "undefined_column".
            // Happens when the scoring migration (20260312120004) hasn't been
            // applied yet.  Fall back to the original column set so reads still work.
            if (error?.code === '42703') {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('votes')
                    .select('id, round_id, voter_id, voted_for_id, is_correct')
                    .eq('round_id', roundId)

                if (fallbackError) throw { type: 'GAME_DATABASE_ERROR', message: fallbackError.message } satisfies GameError
                return (fallbackData as unknown as VoteRow[]).map(mapVoteRow)
            }

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return (data as unknown as VoteRow[]).map(mapVoteRow)
        })(),
        (e) => e as GameError,
    )
}

/**
 * Returns the number of votes cast for a round (HEAD query — no data transfer).
 * Used to seed vote count on page refresh so the progress bar is accurate.
 *
 * @param roundId - Target round.
 */
export function getVoteCountForRound(roundId: string): ResultAsync<number, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { count, error } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('round_id', roundId)

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return count ?? 0
        })(),
        (e) => e as GameError,
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scores
// ─────────────────────────────────────────────────────────────────────────────

export function getScores(lobbyId: string): ResultAsync<ScoreEntry[], GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('scores')
                .select('*, players!scores_player_id_fkey(display_name, avatar_seed)')
                .eq('lobby_id', lobbyId)
                .order('points', { ascending: false })

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError

            return (data as unknown as ScoreRow[]).map((row) => ({
                playerId:    row.player_id,
                displayName: row.players?.display_name ?? 'Unknown',
                avatarSeed:  row.players?.avatar_seed  ?? '',
                points:      row.points,
                streak:      row.streak,
            }))
        })(),
        (e) => e as GameError,
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the Instagram URL for a given reel.
 * Only `instagram_url` is selected — embed_html / thumbnail_url / caption
 * are always null and have been removed from all types.
 *
 * Cost: 1 indexed PK lookup.
 */
export function getReelForRound(reelId: string): ResultAsync<ReelData, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('instagram_url')
                .eq('id', reelId)
                .maybeSingle()

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            if (!data)  throw { type: 'ROUND_NOT_FOUND', roundId: reelId }          satisfies GameError

            return { instagramUrl: data.instagram_url as string }
        })(),
        (e) => e as GameError,
    )
}