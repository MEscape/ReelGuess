'use client'

import { useTransition, useState } from 'react'
import { createLobbyAction, joinLobbyAction } from '../actions'
import { useRouter } from 'next/navigation'

export function useCreateLobby() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function createLobby(playerName: string) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('playerName', playerName)

      const result = await createLobbyAction(formData)

      if (result.ok) {
        sessionStorage.setItem(`player_${result.value.lobby.id}`, result.value.player.id)
        router.push(`/lobby/${result.value.lobby.id}`)
      } else {
        setError('Something went wrong. Try again!')
      }
    })
  }

  return { createLobby, isPending, error }
}

export function useJoinLobby() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function joinLobby(code: string, playerName: string) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('code', code.toUpperCase())
      formData.set('playerName', playerName)

      const result = await joinLobbyAction(formData)

      if (result.ok) {
        sessionStorage.setItem(`player_${code.toUpperCase()}`, result.value.id)
        router.push(`/lobby/${code.toUpperCase()}`)
      } else {
        const err = result.error
        switch (err.type) {
          case 'LOBBY_NOT_FOUND':
            setError('Lobby not found. Check the code!')
            break
          case 'LOBBY_FULL':
            setError('Lobby is full!')
            break
          case 'LOBBY_ALREADY_STARTED':
            setError('Game already started!')
            break
          default:
            setError('Something went wrong')
        }
      }
    })
  }

  return { joinLobby, isPending, error }
}

