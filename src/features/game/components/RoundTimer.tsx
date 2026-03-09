'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

type RoundTimerProps = {
  seconds: number
  onComplete?: () => void
  isActive: boolean
}

export function RoundTimer({ seconds, onComplete, isActive }: RoundTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (!isActive) {
      setRemaining(seconds)
      return
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, seconds, onComplete])

  const percentage = (remaining / seconds) * 100
  const isUrgent = remaining <= 5

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-zinc-800"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <motion.path
            className={isUrgent ? 'text-red-500' : 'text-yellow-400'}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            animate={{ strokeDasharray: `${percentage}, 100` }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-black ${isUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {remaining}
          </span>
        </div>
      </div>
    </div>
  )
}

