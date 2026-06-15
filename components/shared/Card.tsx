'use client'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: 'primary' | 'gold' | 'danger'
  padding?: string
}

export default function Card({ children, className = '', glow, padding = 'p-5' }: CardProps) {
  const glowClass = glow ? `glow-${glow}` : ''
  return (
    <div className={`glass ${glowClass} ${padding} ${className}`}>
      {children}
    </div>
  )
}
