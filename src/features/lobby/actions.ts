'use server'

/**
 * Lobby Server Actions — thin controllers.
 * Each action: Sentry tracing → rate-limit → validate → delegate to service → serialize.
 */

import { CreateLobbySchema, JoinLobbySchema, LobbyCodeSchema, LobbySettingsSchema, PlayerIdSchema } from './validations'
import { createLobbyWithHost, joinLobby, startGame, createRematch, updateSettings } from './service'
import type { LobbyError }       from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import { serializeResult }       from '@/lib/errors/error-handler'
import type { Lobby }            from './types'
import type { Player }           from '@/features/player'
import { rateLimitFromIP }       from '@/lib/rate-limit'
import { withSentry }            from '@/lib/sentry-action'

// ─────────────────────────────────────────────────────────────────────────────
// createLobbyAction
// ─────────────────────────────────────────────────────────────────────────────

export const createLobbyAction = withSentry(
    'createLobbyAction',
    async (formData: FormData): Promise<SerializedResult<{ lobby: Lobby; player: Player }, LobbyError>> => {
        const rl = await rateLimitFromIP('createLobby')
        if (!rl.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many lobbies created. Please wait.', issues: [] } }
        }
        const parsed = CreateLobbySchema.safeParse({ playerName: formData.get('playerName') })
        if (!parsed.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid input', issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) } }
        }
        return serializeResult(await createLobbyWithHost(parsed.data.playerName))
    },
)

// ─────────────────────────────────────────────────────────────────────────────
// joinLobbyAction
// ─────────────────────────────────────────────────────────────────────────────

export const joinLobbyAction = withSentry(
    'joinLobbyAction',
    async (formData: FormData): Promise<SerializedResult<Player, LobbyError>> => {
        const rl = await rateLimitFromIP('joinLobby')
        if (!rl.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many join attempts. Please wait.', issues: [] } }
        }
        const parsed = JoinLobbySchema.safeParse({ code: formData.get('code'), playerName: formData.get('playerName') })
        if (!parsed.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid input', issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) } }
        }
        return serializeResult(await joinLobby(parsed.data.code, parsed.data.playerName))
    },
)

// ─────────────────────────────────────────────────────────────────────────────
// startGameAction
// ─────────────────────────────────────────────────────────────────────────────

export const startGameAction = withSentry(
    'startGameAction',
    async (lobbyCode: string, hostPlayerId: string): Promise<SerializedResult<void, LobbyError>> => {
        const rl = await rateLimitFromIP('startGame', hostPlayerId)
        if (!rl.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many requests. Please wait.', issues: [] } }
        }
        if (!LobbyCodeSchema.safeParse(lobbyCode).success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid lobby code', issues: [] } }
        }
        if (!PlayerIdSchema.safeParse(hostPlayerId).success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid player ID', issues: [] } }
        }
        return serializeResult(await startGame(lobbyCode, hostPlayerId))
    },
)

// ─────────────────────────────────────────────────────────────────────────────
// createRematchAction
// ─────────────────────────────────────────────────────────────────────────────

export const createRematchAction = withSentry(
    'createRematchAction',
    async (oldLobbyId: string, requestingPlayerId: string): Promise<SerializedResult<{ newLobbyCode: string; newPlayerId: string }, LobbyError>> => {
        const rl = await rateLimitFromIP('rematch', requestingPlayerId)
        if (!rl.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many rematch requests. Please wait.', issues: [] } }
        }
        if (!LobbyCodeSchema.safeParse(oldLobbyId).success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid lobby code', issues: [] } }
        }
        if (!PlayerIdSchema.safeParse(requestingPlayerId).success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid player ID', issues: [] } }
        }
        return serializeResult(await createRematch(oldLobbyId, requestingPlayerId))
    },
)

// ─────────────────────────────────────────────────────────────────────────────
// updateLobbySettingsAction
// ─────────────────────────────────────────────────────────────────────────────

export const updateLobbySettingsAction = withSentry(
    'updateLobbySettingsAction',
    async (
        lobbyCode:    string,
        hostPlayerId: string,
        settings:     { roundsCount: number; timerSeconds: number },
    ): Promise<SerializedResult<void, LobbyError>> => {
        const rl = await rateLimitFromIP('updateSettings', hostPlayerId)
        if (!rl.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Too many requests. Please wait.', issues: [] } }
        }
        if (!LobbyCodeSchema.safeParse(lobbyCode).success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid lobby code', issues: [] } }
        }
        if (!PlayerIdSchema.safeParse(hostPlayerId).success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid player ID', issues: [] } }
        }
        const parsed = LobbySettingsSchema.safeParse(settings)
        if (!parsed.success) {
            return { ok: false, error: { type: 'LOBBY_VALIDATION_ERROR', message: 'Invalid settings values', issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) } }
        }
        return serializeResult(await updateSettings(lobbyCode, hostPlayerId, parsed.data))
    },
)
