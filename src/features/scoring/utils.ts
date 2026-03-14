import {Achievement} from "./types";

/**
 * Formats a multiplier value for display, stripping unnecessary decimal places.
 *
 * | Input | Output |
 * |-------|--------|
 * | 1.0   | "1"    |
 * | 1.1   | "1.1"  |
 * | 1.25  | "1.25" |
 * | 1.5   | "1.5"  |
 * | 2.0   | "2"    |
 *
 * Replaces the previous `toString().replace(/\.?0+$/, '')` which produced
 * incorrect output for 2.0 (the regex matched the trailing "0" in "2.0",
 * then consumed the "." leaving "2" via the wrong path — worked by accident
 * for 2.0 but would break for e.g. 10.0 → "1").
 */
export function formatMultiplier(value: number): string {
    return value % 1 === 0 ? value.toFixed(0) : String(value)
}

/**
 * Stable identity key for an achievement.
 *
 * Combines `type`, `playerId`, and `roundId` so that the same achievement
 * type earned by the same player in two different rounds produces distinct
 * keys — preventing cross-round suppression by `seenRef` in HeroOverlay.
 */
export function achievementKey(a: Achievement): string {
    return `${a.type}:${a.playerId}:${a.roundId}`
}

/**
 * Formats an achievement into display-friendly text and emoji.
 * Designed for use in the HeroOverlay component.
 *
 * @param a Achievement to format
 * @returns Object containing `emoji`, `title`, and `subtitle` for display
 */
export function formatAchievement(a: Achievement): { emoji: string; title: string; subtitle: string } {
    switch (a.type) {
        case 'STREAK_5':
            return {
                emoji:    '🔥',
                title:    `${a.playerName} is on fire!`,
                subtitle: `${a.streak} correct guesses in a row`,
            }
        case 'STREAK_10':
            return {
                emoji:    '💥',
                title:    `${a.playerName} is unstoppable!`,
                subtitle: `${a.streak} streak — ×2.0 multiplier!`,
            }
        case 'DOUBLE_SUCCESS':
            return {
                emoji:    '💰',
                title:    `${a.playerName} doubled up!`,
                subtitle: `+${a.pointsEarned} pts — Double-or-Nothing paid off`,
            }
        case 'BIG_POINTS':
            return {
                emoji:    '🚀',
                title:    `${a.playerName} is dominating!`,
                subtitle: `+${a.pointsEarned} pts this round`,
            }
    }
}