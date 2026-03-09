'use client'

import { useState, useTransition } from 'react'
import { startNextRoundAction } from '../actions'

export function useGameState(
  lobbyId: string,
  hostPlayerId: string,
  onSuccess?: (instagramUrl: string) => void
) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startNextRound() {
    setError(null)
    startTransition(async () => {
      const result = await startNextRoundAction(lobbyId, hostPlayerId)

      if (!result.ok) {
        switch (result.error.type) {
          case 'NO_REELS_AVAILABLE':
            setError('No more reels available!')
            break
          case 'GAME_ALREADY_FINISHED':
            setError('Game is already finished!')
            break
          default:
            setError('Failed to start next round')
        }
      } else {
        onSuccess?.(result.value.instagramUrl)
      }
    })
  }

  return { startNextRound, isPending, error }
}
