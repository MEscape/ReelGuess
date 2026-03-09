'use client'

import { createAvatar } from '@dicebear/core'
import * as bottts from '@dicebear/bottts'
import { useMemo } from 'react'

type PlayerAvatarProps = {
  seed: string
  size?: number
  className?: string
}

export function PlayerAvatar({ seed, size = 48, className = '' }: PlayerAvatarProps) {
  const svg = useMemo(() => {
    const avatar = createAvatar(bottts, {
      seed,
      size,
    })
    return avatar.toDataUri()
  }, [seed, size])

  return (
    <img
      src={svg}
      alt="Player avatar"
      width={size}
      height={size}
      className={`rounded-full border-2 border-yellow-400 ${className}`}
    />
  )
}


