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
        className="w-full px-4 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-lg
          text-white text-lg font-bold placeholder:text-zinc-500
          focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20
          transition-all"
      />
      <button
        type="submit"
        disabled={isPending || name.trim().length < 2}
        className="w-full bg-yellow-400 text-black font-black uppercase text-lg py-3 px-6
          border-2 border-black rounded-lg
          shadow-[4px_4px_0px_0px_#000]
          hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
          active:translate-y-[4px] active:shadow-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          disabled:hover:shadow-[4px_4px_0px_0px_#000]
          transition-all"
      >
        {isPending ? '⏳ LOADING...' : buttonText}
      </button>
    </form>
  )
}

