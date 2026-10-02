"use client"

// Shared chrome for the lab tools so they look like one family.
import { useState, type ReactNode } from "react"
import { Check, Copy, Info } from "lucide-react"

export function Panel({ title, actions, children, className = "" }: { title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col rounded-xl border border-border bg-card/60 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</span>
        {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export const chip = "rounded border border-border px-2 py-1 font-mono text-[11px] hover:border-primary"
export const area = "w-full resize-y bg-transparent p-3 font-mono text-[11px] leading-5 outline-none"

export function CopyButton({ text, label = "copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {})
        setDone(true)
        setTimeout(() => setDone(false), 1200)
      }}
      className={`inline-flex items-center gap-1 ${chip}`}
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {done ? "copied" : label}
    </button>
  )
}

export function Caveat({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function SampleSelect<T extends { name: string }>({ items, onPick }: { items: T[]; onPick: (t: T) => void }) {
  return (
    <select aria-label="Load a sample" onChange={(e) => onPick(items[Number(e.target.value)])} defaultValue="" className={`bg-card ${chip}`}>
      <option value="" disabled>
        load sample…
      </option>
      {items.map((s, i) => (
        <option key={s.name} value={i}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
