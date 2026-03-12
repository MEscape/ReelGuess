'use server'

/**
 * Lobby Server Actions — thin controllers.
 *
 * Each action: rate-limit → validate → delegate to service → serialize.
 * No business logic lives here.
 *
 * Dependency direction: actions.ts → service.ts → DAL
 */

import { CreateLobbySchema, JoinLobbySchema } from './validations'
import { createLobbyWithHost, joinLobby, startGame, createRematch } from './service'
import type { LobbyError }       from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import { serializeResult }       from '@/lib/errors/error-handler'
import type { Lobby }            from './types'
import type { Player }           from '@/features/player/types'
import { rateLimitFromIP }       from '@/lib/rate-limit'

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
    oldLobbyId:          string,
    requestingPlayerId:  string,
): Promise<SerializedResult<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> {
    const rl = await rateLimitFromIP('rematch', requestingPlayerId)
    if (!rl.success) {
        return {
            ok:    false,
            error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many rematch requests. Please wait.', issues: [] },
        }
    }

    return serializeResult(await createRematch(oldLobbyId, requestingPlayerId))
}
