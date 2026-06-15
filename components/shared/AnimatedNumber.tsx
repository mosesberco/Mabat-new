'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  duration?: number
  formatter?: (v: number) => string
  className?: string
}

export default function AnimatedNumber({ value, duration = 800, formatter = String, className = '' }: Props) {
  const [displayed, setDisplayed] = useState(value)
  const startRef = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = startRef.current
    const end = value
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else startRef.current = end
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={`num ${className}`}>{formatter(displayed)}</span>
}
