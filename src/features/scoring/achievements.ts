/**
 * Achievement Detection — pure functions that derive achievements from round scoring deltas.
 *
 * Called by the reveal service after scoring to produce overlay events.
 * All functions are pure (no DB calls, no side effects).
 */

import type { Achievement, ScoreEntry } from './types'
import type { Vote }                    from '@/features/voting'
import {BIG_POINTS_THRESHOLD} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Main detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects achievements earned during a round based on scoring deltas.
 *
 * Compares `updatedScores` (post-round) against `priorScores` (pre-round)
 * to identify notable events. Each achievement fires at most once per round
 * per player.
 *
 * Achievement types:
 * - **STREAK_5**:       Player reached a 5+ correct-vote streak.
 * - **STREAK_10**:      Player reached a 10+ correct-vote streak.
 * - **DOUBLE_SUCCESS**: Player used Double-or-Nothing and guessed correctly.
 * - **BIG_POINTS**:     Player earned ≥250 points in a single round.
 *
 * @param roundId       - The round ID, embedded in every achievement for cross-round dedup.
 * @param updatedVotes  - All votes for this round WITH `pointsAwarded` filled in.
 * @param updatedScores - Score entries AFTER this round's scoring.
 * @param priorScores   - Score entries BEFORE this round's scoring.
 * @returns Array of achievements to display as hero overlays.
 */
export function detectAchievements(
    roundId:       string,
    updatedVotes:  Vote[],
    updatedScores: ScoreEntry[],
    priorScores:   ScoreEntry[]
): Achievement[] {
    const achievements: Achievement[] = []

    const priorScoreMap = new Map(priorScores.map((s) => [s.playerId, s]))
    const scoreMap      = new Map(updatedScores.map((s) => [s.playerId, s]))

    // ── Streak achievements ──────────────────────────────────────────────────
    for (const score of updatedScores) {
        const prior = priorScoreMap.get(score.playerId)
        const priorStreak = prior?.streak ?? 0

        // STREAK_10 — crossed the 10-streak boundary this round
        if (score.streak >= 10 && priorStreak < 10) {
            achievements.push({
                type:       'STREAK_10',
                playerId:   score.playerId,
                playerName: score.displayName,
                streak:     score.streak,
                roundId,
            })
        }
        // STREAK_5 — crossed the 5-streak boundary (but not 10, to avoid double-fire)
        else if (score.streak >= 5 && priorStreak < 5) {
            achievements.push({
                type:       'STREAK_5',
                playerId:   score.playerId,
                playerName: score.displayName,
                streak:     score.streak,
                roundId,
            })
        }
    }

    // ── Vote-based achievements ──────────────────────────────────────────────

    // DOUBLE_SUCCESS and BIG_POINTS — per-vote checks
    for (const vote of updatedVotes) {
        const player = scoreMap.get(vote.voterId)
        if (!player) continue

        // DOUBLE_SUCCESS — used double and guessed correctly
        if (vote.usedDouble && vote.isCorrect && vote.pointsAwarded != null) {
            achievements.push({
                type:         'DOUBLE_SUCCESS',
                playerId:     vote.voterId,
                playerName:   player.displayName,
                pointsEarned: vote.pointsAwarded,
                roundId,
            })
        }

        // BIG_POINTS — earned ≥ threshold in a single round
        if (vote.pointsAwarded != null && vote.pointsAwarded >= BIG_POINTS_THRESHOLD) {
            achievements.push({
                type:         'BIG_POINTS',
                playerId:     vote.voterId,
                playerName:   player.displayName,
                pointsEarned: vote.pointsAwarded,
                roundId,
            })
        }
    }

    return achievements
}
