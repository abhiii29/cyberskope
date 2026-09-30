"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

const order = ["dark", "light", "system"] as const
const icons = { dark: Moon, light: Sun, system: Monitor }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Render a fixed-size placeholder until the stored theme is known, to avoid a hydration flash.
  if (!mounted) return <span className="h-8 w-8" />
  const current = (order as readonly string[]).includes(theme ?? "") ? (theme as (typeof order)[number]) : "system"
  const next = order[(order.indexOf(current) + 1) % order.length]
  const Icon = icons[current]
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${current}. Switch to ${next}`}
      title={`Theme: ${current} (click for ${next})`}
      className="group relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
    >
      <Icon key={current} className="h-4 w-4 animate-in spin-in-90 fade-in duration-300" />
    </button>
  )
}
