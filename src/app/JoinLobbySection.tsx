'use client'

import { useState } from 'react'
import { JoinForm } from '@/features/lobby/components/JoinForm'

export function JoinLobbySection() {
  const [showForm, setShowForm] = useState(false)

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full min-h-[56px] bg-pink-500 text-white font-black uppercase text-lg px-6
          border-2 border-black rounded-xl shadow-brutal
          hover:translate-y-[2px] hover:shadow-brutal-sm
          active:translate-y-[4px] active:shadow-none
          transition-all duration-200"
      >
        🔗 JOIN LOBBY
      </button>
    )
  }

  return (
    <div className="card-brutal p-4">
      <h3 className="text-base font-black text-pink-500 uppercase mb-3 text-center tracking-tight">
        🔗 Join Lobby
      </h3>
      <JoinForm />
    </div>
  )
}
