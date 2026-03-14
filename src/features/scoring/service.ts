/**
 * Scoring Service — pure scoring calculation logic.
 *
 * All functions are pure (no DB calls, no side effects).
 * Called by the game service layer during reveal to compute final points.
 */

import type { ScoreInput, ScoreOutput, ScoreEntry, ScoreRow } from './types'
import type { Vote }  from '@/features/voting'
import {BASE_POINTS} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Multiplier helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the streak multiplier for a given new streak value.
 *
 * | New streak | Multiplier |
 * |------------|-----------|
 * | 1          | ×1.0      |
 * | 2          | ×1.1      |
 * | 3–4        | ×1.25     |
 * | 5–9        | ×1.5      |
 * | 10+        | ×2.0      |
 */
export function getStreakMultiplier(newStreak: number): number {
    if (newStreak >= 10) return 2.0
    if (newStreak >= 5)  return 1.5
    if (newStreak >= 3)  return 1.25
    if (newStreak >= 2)  return 1.1
    return 1.0
}

/**
 * Returns the speed multiplier for a given vote time.
 *
 * | Time to vote | Multiplier |
 * |-------------|-----------|
 * | < 2 s       | ×1.5      |
 * | < 4 s       | ×1.3      |
 * | < 8 s       | ×1.1      |
 * | ≥ 8 s       | ×1.0      |
 *
 * Returns ×1.0 when `voteTimeMs` is null (unknown timing).
 */
export function getSpeedMultiplier(voteTimeMs: number | null): number {
    if (voteTimeMs === null) return 1.0
    const seconds = voteTimeMs / 1000
    if (seconds < 2) return 1.5
    if (seconds < 4) return 1.3
    if (seconds < 8) return 1.1
    return 1.0
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the score earned for a single round vote.
 *
 * Formula for correct votes:
 *   pointsEarned = round(BASE_POINTS × streakMultiplier × speedMultiplier)
 *   If usedDouble: pointsEarned × 2
 *
 * Formula for incorrect votes:
 *   pointsEarned = 0
 *   If usedDouble: pointsEarned = −⌊0.5 × currentPoints⌋ (min −BASE_POINTS if currentPoints is very low)
 *
 * Streak resets to 0 on incorrect votes regardless of double.
 *
 * @param input - Scoring parameters for this vote.
 */
export function calculateRoundScore(input: ScoreInput): ScoreOutput {
    const { isCorrect, voteTimeMs, streak, usedDouble, currentPoints } = input

    if (!isCorrect) {
        // Penalise by half the player's accumulated points, minimum BASE_POINTS.
        const pointsEarned = usedDouble ? -Math.max(BASE_POINTS, Math.floor(currentPoints * 0.5)) : 0
        return {
            pointsEarned,
            newStreak:        0,
            streakMultiplier: 1.0,
            speedMultiplier:  1.0,
        }
    }

    const newStreak        = streak + 1
    const streakMultiplier = getStreakMultiplier(newStreak)
    const speedMultiplier  = getSpeedMultiplier(voteTimeMs)

    let pointsEarned = Math.round(BASE_POINTS * streakMultiplier * speedMultiplier)
    if (usedDouble) pointsEarned *= 2

    return { pointsEarned, newStreak, streakMultiplier, speedMultiplier }
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scores ALL votes for a round in one pass, producing updated vote records,
 * updated score entries, and raw DB rows for the upsert.
 *
 * Orchestrates per-vote scoring by:
 * 1. Building a lookup of each player's prior streak from `priorScores`.
 * 2. Running {@link calculateRoundScore} for every vote.
 * 3. Writing `pointsAwarded` back onto each vote (for the reveal UI).
 * 4. Producing updated `ScoreEntry[]` with new totals and streaks.
 * 5. Producing `ScoreRow[]` (snake_case) for the DB upsert.
 *
 * Players who did NOT vote this round retain their prior score untouched —
 * their streak is preserved (not reset) because they were absent, not wrong.
 *
 * `ScoreRow` does not include `lobby_id` — that is a write-time concern
 * supplied by the caller of `batchUpsertScores`, not a scoring concern.
 *
 * @param votes       - All votes cast in this round (may be empty if timer expired).
 * @param priorScores - Score entries from BEFORE this round's scoring.
 * @returns `{ updatedVotes, updatedScores, scoreRows }`.
 */
export function calculateRoundScores(
    votes:       Vote[],
    priorScores: ScoreEntry[],
): {
    updatedVotes:  Vote[]
    updatedScores: ScoreEntry[]
    scoreRows:     ScoreRow[]
} {
    // Build mutable copies of prior scores keyed by playerId.
    const scoreMap = new Map<string, {
        points:      number
        streak:      number
        displayName: string
        avatarSeed:  string
    }>()

    for (const s of priorScores) {
        scoreMap.set(s.playerId, {
            points:      s.points,
            streak:      s.streak,
            displayName: s.displayName,
            avatarSeed:  s.avatarSeed,
        })
    }

    // Score each vote and update the map in place.
    const updatedVotes: Vote[] = votes.map((vote) => {
        const prior       = scoreMap.get(vote.voterId)
        const priorStreak = prior?.streak ?? 0

        const result = calculateRoundScore({
            isCorrect:     vote.isCorrect,
            voteTimeMs:    vote.voteTimeMs,
            streak:        priorStreak,
            usedDouble:    vote.usedDouble,
            currentPoints: prior?.points ?? 0,
        })

        if (prior) {
            prior.points += result.pointsEarned
            prior.streak  = result.newStreak
        } else {
            // Player had no prior score row — create one.
            scoreMap.set(vote.voterId, {
                points:      Math.max(0, result.pointsEarned),
                streak:      result.newStreak,
                displayName: '',
                avatarSeed:  '',
            })
        }

        return { ...vote, pointsAwarded: result.pointsEarned }
    })

    // Build the output arrays.
    const updatedScores: ScoreEntry[] = []
    const scoreRows:     ScoreRow[]   = []

    for (const [playerId, entry] of scoreMap) {
        updatedScores.push({
            playerId,
            displayName: entry.displayName,
            avatarSeed:  entry.avatarSeed,
            points:      entry.points,
            streak:      entry.streak,
        })

        // lobby_id is intentionally excluded — supplied by batchUpsertScores.
        scoreRows.push({
            player_id: playerId,
            points:    entry.points,
            streak:    entry.streak,
        })
    }

    // Sort by points descending (leaderboard order).
    updatedScores.sort((a, b) => b.points - a.points)

    return { updatedVotes, updatedScores, scoreRows }
}