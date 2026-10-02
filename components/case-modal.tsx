"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, Check, RotateCcw, X } from "lucide-react"
import type { Project } from "@/lib/portfolio-data"
import { caseExtras, type ArchLayer, type BeforeAfter } from "@/lib/case-extras"

const EASE = [0.16, 1, 0.3, 1] as const
type Tab = "overview" | "architecture" | "change" | "retro"

export function CaseModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const extra = caseExtras[project.id]
  const tabs: [Tab, string][] = [
    ["overview", "Overview"],
    ...(extra ? ([["architecture", "Architecture"]] as [Tab, string][]) : []),
    ...(extra?.beforeAfter ? ([["change", "Before → after"]] as [Tab, string][]) : []),
    ...(extra?.retro.length ? ([["retro", "Retro"]] as [Tab, string][]) : []),
  ]
  const [tab, setTab] = useState<Tab>("overview")
  const reduce = useReducedMotion()

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", k)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="border-b border-border p-6 pb-0 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-muted-foreground">{project.tag}</span>
              <h3 className="mt-1 text-2xl font-bold">{project.title}</h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div role="tablist" className="mt-4 flex gap-5 overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative shrink-0 pb-3 font-mono text-xs ${tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
                {tab === id && <motion.span layoutId="case-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-6 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {tab === "overview" && (
                <>
                  <p className="text-muted-foreground">{project.summary}</p>
                  <div className="mt-5 rounded-lg border border-border p-4">
                    <div className="font-mono text-2xl font-bold text-primary">{project.metric.value}</div>
                    <div className="text-sm text-muted-foreground">{project.metric.label}</div>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {project.details.map((d) => (
                      <li key={d} className="flex gap-3 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.stack.map((s) => (
                      <span key={s} className="rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </>
              )}
              {tab === "architecture" && extra && <Architecture layers={extra.arch} />}
              {tab === "change" && extra?.beforeAfter && (
                <div className="space-y-6">
                  {extra.beforeAfter.map((b, i) => (
                    <ChangeView key={i} b={b} />
                  ))}
                </div>
              )}
              {tab === "retro" && extra && (
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">what I took away</p>
                  <ul className="mt-3 space-y-3">
                    {extra.retro.map((r, i) => (
                      <motion.li key={r} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="rounded-lg border-l-2 border-violet bg-violet/5 p-3 text-sm">
                        {r}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Layers build top-down with connectors drawing between them; click a node for its role. */
function Architecture({ layers }: { layers: ArchLayer[] }) {
  const reduce = useReducedMotion()
  const [sel, setSel] = useState(layers[0].nodes[0].name)
  const note = layers.flatMap((l) => l.nodes).find((n) => n.name === sel)?.note
  return (
    <div>
      <div className="space-y-0">
        {layers.map((l, li) => (
          <div key={l.label}>
            {li > 0 && (
              <div className="flex justify-center py-1" aria-hidden>
                <svg width="12" height="28" viewBox="0 0 12 28">
                  <motion.path d="M6 0 V22 M1 17 L6 23 L11 17" fill="none" stroke="var(--primary)" strokeWidth="1.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: li * 0.25, duration: 0.3 }} />
                </svg>
              </div>
            )}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: li * 0.25 + 0.1, duration: 0.4, ease: EASE }}
              className="rounded-lg border border-dashed border-border p-3"
            >
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l.label}</div>
              <div className="flex flex-wrap gap-2">
                {l.nodes.map((n) => (
                  <button
                    key={n.name}
                    onClick={() => setSel(n.name)}
                    onMouseEnter={() => setSel(n.name)}
                    className={`rounded-md border px-3 py-2 text-sm transition ${sel === n.name ? "border-primary bg-primary/10 text-primary shadow-[0_0_16px_-6px_var(--primary)]" : "border-border hover:border-primary/50"}`}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={sel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 rounded-lg bg-background/60 p-3 text-sm">
          <span className="font-semibold text-primary">{sel}.</span> {note}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function ChangeView({ b }: { b: BeforeAfter }) {
  const reduce = useReducedMotion()
  const [run, setRun] = useState(0)
  const [lit, setLit] = useState(reduce ? 99 : 0)

  useEffect(() => {
    if (b.kind !== "pipeline" || reduce) return
    setLit(0)
    const t = setInterval(() => setLit((n) => (n >= b.stages.length ? n : n + 1)), 450)
    return () => clearInterval(t)
  }, [b, run, reduce])

  if (b.kind === "split")
    return (
      <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {[b.before, null, b.after].map((side, i) =>
          side === null ? (
            <div key="arrow" className="flex items-center justify-center">
              <motion.div initial={reduce ? false : { x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
                <ArrowRight className="h-5 w-5 rotate-90 text-primary md:rotate-0" />
              </motion.div>
            </div>
          ) : (
            <motion.div
              key={side.title}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i === 0 ? 0 : 0.5 }}
              className={`rounded-lg border p-4 ${i === 0 ? "border-danger/30 bg-danger/5" : "border-primary/40 bg-primary/5"}`}
            >
              <div className={`font-mono text-[10px] uppercase tracking-wider ${i === 0 ? "text-danger" : "text-primary"}`}>{side.title}</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {side.lines.map((l) => (
                  <li key={l} className={`flex gap-2 ${i === 0 ? "text-muted-foreground" : ""}`}>
                    <span className={i === 0 ? "text-danger" : "text-primary"}>{i === 0 ? "✗" : "✓"}</span>
                    {l}
                  </li>
                ))}
              </ul>
            </motion.div>
          ),
        )}
      </div>
    )

  if (b.kind === "bars")
    return (
      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{b.caption}</p>
        <div className="space-y-5">
          {b.rows.map((r) => {
            const max = Math.max(r.before, r.after)
            return (
              <div key={r.label}>
                <div className="mb-1.5 text-sm">{r.label}</div>
                {(["before", "after"] as const).map((k, i) => (
                  <div key={k} className="mb-1 flex items-center gap-3">
                    <span className="w-12 font-mono text-[11px] text-muted-foreground">{k}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-border/60">
                      <motion.div
                        className={`h-full rounded-full ${k === "before" ? "bg-danger" : "bg-primary"}`}
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${Math.max(1, (r[k] / max) * 100)}%` }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.35, ease: EASE }}
                      />
                    </div>
                    <span className="w-24 text-right font-mono text-xs">{r[k]} {r.unit}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{b.caption}</p>
        <button onClick={() => setRun((r) => r + 1)} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[11px] hover:border-primary">
          <RotateCcw className="h-3 w-3" /> replay
        </button>
      </div>
      <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
        {b.stages.map((s, i) => {
          const done = i < lit
          const active = i === lit
          return (
            <li key={s.name} className="flex flex-1 items-center gap-2 md:flex-col md:items-stretch">
              <motion.div
                animate={{ borderColor: done ? "var(--primary)" : active ? "var(--warn)" : "var(--border)" }}
                className="flex flex-1 items-center gap-2 rounded-lg border bg-background/50 p-2.5 md:flex-col md:items-start"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : active ? "border border-warn" : "border border-border"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-warn" /> : null}
                </span>
                <div>
                  <div className="font-mono text-xs">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.check}</div>
                </div>
              </motion.div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
