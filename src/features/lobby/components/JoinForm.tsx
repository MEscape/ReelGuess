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
        placeholder="LOBBY CODE"
        maxLength={6}
        className="w-full px-4 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-lg
          text-center text-2xl font-black tracking-[0.3em] text-yellow-400
          placeholder:text-zinc-600 placeholder:tracking-normal placeholder:text-lg placeholder:font-bold
          focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20
          transition-all uppercase"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name..."
        maxLength={16}
        className="w-full px-4 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-lg
          text-white text-lg font-bold placeholder:text-zinc-500
          focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20
          transition-all"
      />
      <button
        type="submit"
        disabled={isPending || code.length !== 6 || name.trim().length < 2}
        className="w-full bg-pink-500 text-white font-black uppercase text-lg py-3 px-6
          border-2 border-black rounded-lg
          shadow-[4px_4px_0px_0px_#000]
          hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
          active:translate-y-[4px] active:shadow-none
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all"
      >
        {isPending ? '⏳ JOINING...' : '🔗 JOIN LOBBY'}
      </button>
      {error && (
        <p className="text-red-500 text-sm font-bold text-center">{error}</p>
      )}
    </form>
  )
}

