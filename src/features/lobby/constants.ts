/** Default game settings applied to every new lobby. */
export const DEFAULT_SETTINGS = { rounds_count: 50, timer_seconds: 60 } as const

/**
 * Placeholder UUID written to `lobbies.host_id` on initial insert.
 * Immediately overwritten with the real player UUID in a subsequent PATCH.
 * A nil UUID is used so FK constraints succeed until the real ID is known.
 */
export const PLACEHOLDER_HOST_ID = '00000000-0000-0000-0000-000000000000' as const

/**
 * Lobby code generation and validation utilities.
 *
 * Ambiguous characters (0/O, 1/I, L) are excluded to prevent read errors
 * when codes are shared verbally or written by hand.
 */
export const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

// ─────────────────────────────────────────────────────────────────────────────
// Settings configuration — single source of truth for all lobby options.
// Extend this array to add new settings; no other code needs changing.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Declarative configuration for each configurable lobby setting.
 *
 * Each entry drives:
 *  - UI rendering in `SettingsPanel` (label, preset options)
 *  - Validation bounds in `LobbySettingsSchema`
 *  - Display formatting (unit suffix shown in the UI)
 *
 * Adding a new setting:
 * 1. Add it to `GameSettings` in `types.ts`.
 * 2. Add a matching entry here.
 * 3. Extend `LobbySettingsSchema` in `validations.ts` accordingly.
 * 4. The UI panel and validation pick it up automatically.
 */
export const SETTINGS_CONFIG = [
    {
        /** Maps to `GameSettings.roundsCount` */
        key:     'roundsCount' as const,
        label:   'Rounds',
        unit:    '',
        min:     5,
        max:     100,
        step:    5,
        /** Preset quick-select options (subset of min–max range). */
        options: [10, 20, 30, 50, 75, 100] as const,
        default: DEFAULT_SETTINGS.rounds_count,
    },
    {
        /** Maps to `GameSettings.timerSeconds` */
        key:     'timerSeconds' as const,
        label:   'Timer',
        unit:    's',
        min:     10,
        max:     120,
        step:    5,
        options: [15, 30, 45, 60, 90, 120] as const,
        default: DEFAULT_SETTINGS.timer_seconds,
    },
] as const

/** Derived type for a single setting key, inferred from the config. */
export type SettingKey = (typeof SETTINGS_CONFIG)[number]['key']
