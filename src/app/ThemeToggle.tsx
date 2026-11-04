import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { storage } from '../services/storage'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    storage.set('theme', next ? 'dark' : 'light') // read back by public/theme.js
  }
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-[var(--shadow-sm)] transition hover:text-[var(--accent)] active:scale-95"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
