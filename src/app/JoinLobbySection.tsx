'use client'

import { useState } from 'react'
import { JoinForm } from '@/features/lobby/components/JoinForm'

export function JoinLobbySection() {
  const [showForm, setShowForm] = useState(false)

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-pink-500 text-white font-black uppercase text-lg py-4 px-6
          border-2 border-black rounded-xl
          shadow-[4px_4px_0px_0px_#000]
          hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
          active:translate-y-[4px] active:shadow-none
          transition-all"
      >
        🔗 JOIN LOBBY
      </button>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-lg font-black text-pink-500 uppercase mb-3 text-center">
        🔗 Join Lobby
      </h3>
      <JoinForm />
    </div>
  )
}

