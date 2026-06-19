'use client'
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Sync with whatever the no-flash script in <head> already applied.
  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('kamah_theme', next) } catch {}
    if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }

  const Icon = theme === 'dark' ? Sun : Moon
  const label = theme === 'dark' ? 'מצב יום' : 'מצב לילה'

  if (compact) {
    return (
      <button onClick={toggle} aria-label={label} title={label}
        className="p-2 rounded-lg transition-colors hover:bg-[var(--surface2)]" style={{ color: 'var(--muted)' }}>
        <Icon size={18} />
      </button>
    )
  }
  return (
    <button onClick={toggle} aria-label={label}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--surface2)]"
      style={{ color: 'var(--muted)' }}>
      <Icon size={18} /> {label}
    </button>
  )
}
