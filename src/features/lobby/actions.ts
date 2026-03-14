'use server'

/**
 * Lobby Server Actions — thin controllers.
 *
 * Each action: rate-limit → validate → delegate to service → serialize.
 * No business logic lives here.
 *
 * Dependency direction: actions.ts → service.ts → DAL
 */

import { CreateLobbySchema, JoinLobbySchema, LobbyCodeSchema, LobbySettingsSchema } from './validations'
import { createLobbyWithHost, joinLobby, startGame, createRematch, updateSettings } from './service'
import type { LobbyError }       from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import { serializeResult }       from '@/lib/errors/error-handler'
import type { Lobby }            from './types'
import type { Player }           from '@/features/player'
import { rateLimitFromIP }       from '@/lib/rate-limit'
import {PlayerIdSchema} from "./validations";

// ─────────────────────────────────────────────────────────────────────────────
// createLobbyAction
// ─────────────────────────────────────────────────────────────────────────────

export async function createLobbyAction(
    formData: FormData,
): Promise<SerializedResult<{ lobby: Lobby; player: Player }, LobbyError>> {
    const rl = await rateLimitFromIP('createLobby')
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many lobbies created. Please wait.', issues: [] },
        }
    }

    const parsed = CreateLobbySchema.safeParse({ playerName: formData.get('playerName') })
    if (!parsed.success) {
        return {
            ok:    false,
            error: {
                type:    'LOBBY_VALIDATION_ERROR',
                message: 'Invalid input',
                issues:  parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            },
        }
    }

    return serializeResult(await createLobbyWithHost(parsed.data.playerName))
}

// ─────────────────────────────────────────────────────────────────────────────
// joinLobbyAction
// ─────────────────────────────────────────────────────────────────────────────

export async function joinLobbyAction(
    formData: FormData,
): Promise<SerializedResult<Player, LobbyError>> {
    const rl = await rateLimitFromIP('joinLobby')
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many join attempts. Please wait.', issues: [] },
        }
    }

    const parsed = JoinLobbySchema.safeParse({
        code:       formData.get('code'),
        playerName: formData.get('playerName'),
    })
    if (!parsed.success) {
        return {
            ok:    false,
            error: {
                type:    'LOBBY_VALIDATION_ERROR',
                message: 'Invalid input',
                issues:  parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            },
        }
    }

    return serializeResult(await joinLobby(parsed.data.code, parsed.data.playerName))
}

// ─────────────────────────────────────────────────────────────────────────────
// startGameAction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates `lobbyCode` and `hostPlayerId` formats before delegating to the
 * service. Malformed inputs surface as `LOBBY_VALIDATION_ERROR` rather than
 * reaching the DB and returning a confusing `LOBBY_NOT_FOUND`.
 */
export async function startGameAction(
    lobbyCode:    string,
    hostPlayerId: string,
): Promise<SerializedResult<void, LobbyError>> {
    const rl = await rateLimitFromIP('startGame', hostPlayerId)
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many requests. Please wait.', issues: [] },
        }
    }

    if (!LobbyCodeSchema.safeParse(lobbyCode).success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid lobby code', issues: [] },
        }
    }

    if (!PlayerIdSchema.safeParse(hostPlayerId).success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid player ID', issues: [] },
        }
    }

    return serializeResult(await startGame(lobbyCode, hostPlayerId))
}

// ─────────────────────────────────────────────────────────────────────────────
// createRematchAction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a rematch lobby from a finished lobby, or returns the existing one
 * if another player already triggered it (idempotent).
 *
 * Rate limited per player: 5 rematch requests per minute.
 *
 * @param oldLobbyId         - Code of the finished lobby.
 * @param requestingPlayerId - The player pressing "Rematch".
 * @returns `{ newLobbyCode, newPlayerId }` — the client stores the new player
 *          ID and navigates to the new lobby.
 */
export async function createRematchAction(
    oldLobbyId:         string,
    requestingPlayerId: string,
): Promise<SerializedResult<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> {
    const rl = await rateLimitFromIP('rematch', requestingPlayerId)
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many rematch requests. Please wait.', issues: [] },
        }
    }

    if (!LobbyCodeSchema.safeParse(oldLobbyId).success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid lobby code', issues: [] },
        }
    }

    if (!PlayerIdSchema.safeParse(requestingPlayerId).success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid player ID', issues: [] },
        }
    }

    return serializeResult(await createRematch(oldLobbyId, requestingPlayerId))
}

// ─────────────────────────────────────────────────────────────────────────────
// updateLobbySettingsAction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the configurable settings of a waiting lobby.
 *
 * Only the host may call this, and only while the lobby is in `waiting` status.
 * Validates settings bounds against `LobbySettingsSchema` (derived from
 * `SETTINGS_CONFIG`) so UI and server stay in sync automatically.
 *
 * @param lobbyCode    - The 6-char lobby code.
 * @param hostPlayerId - Must match `lobby.hostId`.
 * @param settings     - New settings payload.
 */
export async function updateLobbySettingsAction(
    lobbyCode:    string,
    hostPlayerId: string,
    settings:     { roundsCount: number; timerSeconds: number },
): Promise<SerializedResult<void, LobbyError>> {
    const rl = await rateLimitFromIP('updateSettings', hostPlayerId)
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many requests. Please wait.', issues: [] },
        }
    }

    if (!LobbyCodeSchema.safeParse(lobbyCode).success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid lobby code', issues: [] },
        }
    }

    if (!PlayerIdSchema.safeParse(hostPlayerId).success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid player ID', issues: [] },
        }
    }

    const parsed = LobbySettingsSchema.safeParse(settings)
    if (!parsed.success) {
        return {
            ok:    false,
            error: {
                type:    'LOBBY_VALIDATION_ERROR',
                message: 'Invalid settings values',
                issues:  parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            },
        }
    }

    return serializeResult(await updateSettings(lobbyCode, hostPlayerId, parsed.data))
}
