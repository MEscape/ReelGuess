'use client'

import { useState } from 'react'
import { useCreateLobby } from '@/features/lobby/hooks/use-lobby'
import { PlayerNameForm } from '@/features/player/components/PlayerNameForm'

export function CreateLobbySection() {
  const [showForm, setShowForm] = useState(false)
  const { createLobby, isPending, error } = useCreateLobby()

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-yellow-400 text-black font-black uppercase text-lg py-4 px-6
          border-2 border-black rounded-xl
          shadow-[4px_4px_0px_0px_#000]
          hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
          active:translate-y-[4px] active:shadow-none
          transition-all"
      >
        🎮 CREATE LOBBY
      </button>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-lg font-black text-yellow-400 uppercase mb-3 text-center">
        🎮 Create Lobby
      </h3>
      <PlayerNameForm
        onSubmit={createLobby}
        isPending={isPending}
        placeholder="Your display name..."
        buttonText="🚀 CREATE & JOIN"
      />
      {error && (
        <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>
      )}
    </div>
  )
}

