'use client'

import { useTransition, useState } from 'react'
import { importReelsAction } from '../actions'

export function useReelImport(lobbyId: string, playerId: string) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)
  const [reelUrls, setReelUrls] = useState<string[]>([])

  function submitReels() {
    if (reelUrls.length < 3) {
      setError('You need at least 3 reels!')
      return
    }

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('lobbyId', lobbyId)
      formData.set('playerId', playerId)
      formData.set('reelUrls', JSON.stringify(reelUrls))

      const result = await importReelsAction(formData)

      if (result.ok) {
        setImportedCount(result.value.length)
      } else {
        setError('Failed to import reels. Please try again.')
      }
    })
  }

  return {
    submitReels,
    isPending,
    error,
    importedCount,
    reelUrls,
    setReelUrls,
  }
}
