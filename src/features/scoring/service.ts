/**
 * Scoring Service — pure scoring calculation logic.
 *
 * All functions are pure (no DB calls, no side effects).
 * Called by the game service layer during reveal to compute final points.
 */

import type { ScoreInput, ScoreOutput } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Base points awarded for a correct guess (before multipliers). */
export const BASE_POINTS = 100

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
 *   If usedDouble: pointsEarned = −BASE_POINTS (penalty)
 *
 * Streak resets to 0 on incorrect votes regardless of double.
 *
 * @param input - Scoring parameters for this vote.
 */
export function calculateRoundScore(input: ScoreInput): ScoreOutput {
    const { isCorrect, voteTimeMs, streak, usedDouble } = input

    if (!isCorrect) {
        const pointsEarned = usedDouble ? -BASE_POINTS : 0
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
