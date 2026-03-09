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
        className="w-full min-h-[56px] bg-yellow-400 text-black font-black uppercase text-lg px-6
          border-2 border-black rounded-xl shadow-brutal
          hover:translate-y-[2px] hover:shadow-brutal-sm
          active:translate-y-[4px] active:shadow-none
          transition-all duration-200"
      >
        🎮 CREATE LOBBY
      </button>
    )
  }

  return (
    <div className="card-brutal p-4">
      <h3 className="text-base font-black text-yellow-400 uppercase mb-3 text-center tracking-tight">
        🎮 Create Lobby
      </h3>
      <PlayerNameForm
        onSubmit={createLobby}
        isPending={isPending}
        placeholder="Your display name..."
        buttonText="🚀 CREATE & JOIN"
      />
      {error && <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>}
    </div>
  )
}
