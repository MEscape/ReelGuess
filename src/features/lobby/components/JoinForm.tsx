'use client'

import { useState } from 'react'
import { useJoinLobby } from '../hooks/use-lobby'

export function JoinForm() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const { joinLobby, isPending, error } = useJoinLobby()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (code.length === 6 && name.trim().length >= 2) {
          joinLobby(code, name.trim())
        }
      }}
      className="flex flex-col gap-3 w-full"
    >
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        placeholder="XXXXXX"
        maxLength={6}
        className="w-full px-4 py-3 min-h-[52px] bg-zinc-800 border-2 border-zinc-700 rounded-xl
          text-center text-3xl font-black tracking-[0.3em] text-yellow-400
          placeholder:text-zinc-700 placeholder:tracking-[0.15em] placeholder:text-xl
          focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20
          transition-colors duration-200 uppercase"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name..."
        maxLength={16}
        className="w-full px-4 py-3 min-h-[48px] bg-zinc-800 border-2 border-zinc-700 rounded-xl
          text-white text-base font-bold placeholder:text-zinc-500
          focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20
          transition-colors duration-200"
      />
      <button
        type="submit"
        disabled={isPending || code.length !== 6 || name.trim().length < 2}
        className="w-full min-h-[48px] bg-pink-500 text-white font-black uppercase text-base px-6
          border-2 border-black rounded-xl shadow-brutal
          hover:translate-y-[2px] hover:shadow-brutal-sm
          active:translate-y-[4px] active:shadow-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-brutal
          transition-all duration-200"
      >
        {isPending ? '⏳ JOINING...' : '🔗 JOIN LOBBY'}
      </button>
      {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
    </form>
  )
}
