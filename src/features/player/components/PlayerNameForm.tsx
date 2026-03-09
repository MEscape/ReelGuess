'use client'

import { useState } from 'react'

type PlayerNameFormProps = {
  onSubmit: (name: string) => void
  isPending?: boolean
  placeholder?: string
  buttonText?: string
}

export function PlayerNameForm({
  onSubmit,
  isPending = false,
  placeholder = 'Your name...',
  buttonText = '🚀 LET\'S GO',
}: PlayerNameFormProps) {
  const [name, setName] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim().length >= 2) onSubmit(name.trim())
      }}
      className="flex flex-col gap-3 w-full"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        maxLength={16}
        className="w-full px-4 py-3 min-h-[48px] bg-zinc-800 border-2 border-zinc-700 rounded-xl
          text-white text-base font-bold placeholder:text-zinc-500
          focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20
          transition-colors duration-200"
      />
      <button
        type="submit"
        disabled={isPending || name.trim().length < 2}
        className="w-full min-h-[48px] bg-yellow-400 text-black font-black uppercase text-base px-6
          border-2 border-black rounded-xl shadow-brutal
          hover:translate-y-[2px] hover:shadow-brutal-sm
          active:translate-y-[4px] active:shadow-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-brutal
          transition-all duration-200"
      >
        {isPending ? '⏳ LOADING...' : buttonText}
      </button>
    </form>
  )
}
