'use server'

import { getLobbyByCode } from './queries'
import { createLobby, addPlayerToLobby, updateLobbyStatus } from './mutations'
import { CreateLobbySchema, JoinLobbySchema } from './validations'
import type { LobbyError } from './errors'
import type { SerializedResult } from '@/lib/errors/error-handler'
import { serializeResult } from '@/lib/errors/error-handler'
import type { Lobby } from './types'
import type { Player } from '@/features/player/types'
import { getReelsByPlayer } from '@/features/reel-import/queries'

export async function createLobbyAction(
  formData: FormData
): Promise<SerializedResult<{ lobby: Lobby; player: Player }, LobbyError>> {
  const parsed = CreateLobbySchema.safeParse({
    playerName: formData.get('playerName'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: 'LOBBY_VALIDATION_ERROR',
        message: 'Invalid input',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    }
  }

  const result = await createLobby(parsed.data.playerName)
  return serializeResult(result)
}

export async function joinLobbyAction(
  formData: FormData
): Promise<SerializedResult<Player, LobbyError>> {
  const parsed = JoinLobbySchema.safeParse({
    code: formData.get('code'),
    playerName: formData.get('playerName'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: 'LOBBY_VALIDATION_ERROR',
        message: 'Invalid input',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    }
  }

  const lobbyResult = await getLobbyByCode(parsed.data.code)

  if (lobbyResult.isErr()) {
    return { ok: false, error: lobbyResult.error }
  }

  const lobby = lobbyResult.value

  if (lobby.status !== 'waiting') {
    return { ok: false, error: { type: 'LOBBY_ALREADY_STARTED' } }
  }
  if (lobby.players.length >= 8) {
    return { ok: false, error: { type: 'LOBBY_FULL', maxPlayers: 8 } }
  }

  const playerResult = await addPlayerToLobby(lobby.id, parsed.data.playerName)
  return serializeResult(playerResult)
}

export async function startGameAction(
  lobbyId: string,
  hostPlayerId: string
): Promise<SerializedResult<void, LobbyError>> {
  const lobbyResult = await getLobbyByCode(lobbyId)

  if (lobbyResult.isErr()) {
    return { ok: false, error: lobbyResult.error }
  }

  const lobby = lobbyResult.value

  if (lobby.hostId !== hostPlayerId) {
    return { ok: false, error: { type: 'NOT_HOST', playerId: hostPlayerId } }
  }
  if (lobby.players.length < 2) {
    return {
      ok: false,
      error: {
        type: 'LOBBY_VALIDATION_ERROR',
        message: 'Need at least 2 players to start',
        issues: [],
      },
    }
  }

  // Check that every player has imported at least 1 reel
  const missingPlayers: string[] = []
  for (const player of lobby.players) {
    const reelResult = await getReelsByPlayer(lobby.id, player.id)
    if (reelResult.isErr() || reelResult.value.length === 0) {
      missingPlayers.push(player.displayName)
    }
  }
  if (missingPlayers.length > 0) {
    return {
      ok: false,
      error: {
        type: 'LOBBY_VALIDATION_ERROR',
        message: `These players haven't imported their Reels yet: ${missingPlayers.join(', ')}`,
        issues: [],
      },
    }
  }

  const statusResult = await updateLobbyStatus(lobby.id, 'playing')
  return serializeResult(statusResult)
}
