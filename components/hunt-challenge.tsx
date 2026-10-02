"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Eye, Lightbulb, Trophy } from "lucide-react"
import { events, levels, score } from "@/lib/lab/challenge"
import { Caveat, Panel, area, chip } from "@/components/lab-ui"

const KEY = "cyberskope-hunt-solved"
const pct = (x: number) => `${Math.round(x * 100)}%`
const short = (p: string) => p.split("\\").pop()

export function HuntChallenge() {
  const reduce = useReducedMotion()
  const [li, setLi] = useState(0)
  const level = levels[li]
  const [rules, setRules] = useState<string[]>(levels.map((l) => l.starter))
  const [hints, setHints] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [solved, setSolved] = useState<string[]>([])
  const [peek, setPeek] = useState(false)

  useEffect(() => {
    try {
      setSolved(JSON.parse(localStorage.getItem(KEY) ?? "[]"))
    } catch {}
  }, [])

  const s = useMemo(() => score(level, rules[li]), [level, rules, li])
  const win = !s.error && s.f1 === 1

  useEffect(() => {
    if (!win || solved.includes(level.id)) return
    const next = [...solved, level.id]
    setSolved(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [win, level.id, solved])

  const go = (i: number) => (setLi(i), setHints(0), setReveal(false))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((l, i) => (
          <button
            key={l.id}
            onClick={() => go(i)}
            className={`relative rounded-xl border p-3 text-left transition ${i === li ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
          >
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              level {i + 1}
              {solved.includes(l.id) && <span className="ml-auto inline-flex items-center gap-1 text-primary"><Trophy className="h-3 w-3" /> solved</span>}
            </div>
            <div className="font-semibold">{l.title}</div>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{level.brief}</p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel
          title="your sigma rule"
          actions={
            <>
              <button className={chip} onClick={() => setRules((r) => r.map((x, i) => (i === li ? level.starter : x)))}>reset</button>
              <button className={`inline-flex items-center gap-1 ${chip}`} disabled={hints >= level.hints.length} onClick={() => setHints((h) => h + 1)}>
                <Lightbulb className="h-3 w-3" /> hint {Math.min(hints + 1, level.hints.length)}/{level.hints.length}
              </button>
            </>
          }
        >
          <textarea
            value={rules[li]}
            onChange={(e) => setRules((r) => r.map((x, i) => (i === li ? e.target.value : x)))}
            spellCheck={false}
            aria-label="Sigma rule"
            className={`${area} min-h-64 text-xs`}
          />
          <AnimatePresence>
            {hints > 0 && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1 overflow-hidden border-t border-border p-3 text-xs text-warn">
                {level.hints.slice(0, hints).map((h) => (
                  <li key={h}>💡 {h}</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </Panel>

        <div className="min-w-0 space-y-4">
          <div className={`rounded-xl border p-4 transition-colors ${win ? "border-primary bg-primary/10" : "border-border bg-card/60"}`}>
            {s.error ? (
              <p className="font-mono text-xs text-danger">{s.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[["precision", s.precision], ["recall", s.recall], ["F1", s.f1]].map(([k, v]) => (
                    <div key={k as string}>
                      <div className="relative mx-auto h-16 w-16">
                        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
                          <motion.circle
                            cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                            stroke={(v as number) === 1 ? "var(--primary)" : (v as number) >= 0.6 ? "var(--warn)" : "var(--danger)"}
                            initial={reduce ? false : { pathLength: 0 }}
                            animate={{ pathLength: v as number }}
                            transition={{ duration: 0.6 }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">{pct(v as number)}</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{k}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-center gap-4 font-mono text-xs">
                  <span className="text-primary">{s.tp} caught</span>
                  <span className="text-danger">{s.fp} false alarms</span>
                  <span className="text-warn">{s.fn} missed</span>
                </div>
                <AnimatePresence>
                  {win && (
                    <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 flex items-center justify-center gap-2 font-mono text-sm text-primary">
                      <Trophy className="h-4 w-4" /> every attack, no false alarms
                      {li < levels.length - 1 && (
                        <button onClick={() => go(li + 1)} className="ml-2 underline">next level →</button>
                      )}
                    </motion.p>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          <Panel
            title={`rule fires on ${s.matched.length} of ${events.length} events`}
            actions={s.fn > 0 && !s.error ? <button className={`inline-flex items-center gap-1 ${chip}`} onClick={() => setReveal((r) => !r)}><Eye className="h-3 w-3" /> {reveal ? "hide" : "show"} missed</button> : undefined}
          >
            <ul className="max-h-72 divide-y divide-border/50 overflow-y-auto">
              {[...s.matched.map((m) => ({ e: m.e, tag: m.ok ? "hit" : "false alarm" })), ...(reveal ? s.missed.map((e) => ({ e, tag: "missed" })) : [])].map(({ e, tag }) => (
                <motion.li key={e.id + tag} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 text-[10px] ${tag === "hit" ? "bg-primary/15 text-primary" : tag === "missed" ? "bg-warn/15 text-warn" : "bg-danger/15 text-danger"}`}>{tag}</span>
                    <span className="text-muted-foreground">{e.UtcTime.slice(11, 16)} {e.Computer}</span>
                    <span className="ml-auto truncate text-muted-foreground">{short(e.ParentImage)} → {short(e.Image)}</span>
                  </div>
                  <div className="mt-0.5 truncate">{e.CommandLine}</div>
                </motion.li>
              ))}
              {s.matched.length === 0 && !reveal && <li className="p-3 font-mono text-xs text-muted-foreground">nothing matched yet</li>}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title={`the dataset · ${events.length} process-creation events`} actions={<button className={chip} onClick={() => setPeek((p) => !p)}>{peek ? "hide" : "browse"}</button>}>
        {peek && (
          <pre className="max-h-80 overflow-auto p-3 font-mono text-[10px] leading-4 text-muted-foreground">
            {events.map((e) => JSON.stringify(e)).join("\n")}
          </pre>
        )}
      </Panel>

      <Caveat>
        A synthetic day of Windows process-creation events (Sysmon event 1 fields) with planted attacks and realistic
        look-alikes. Your rule runs in the browser with Sigma semantics and is scored on precision and recall against
        hidden labels. Progress is saved only in this browser.
      </Caveat>
    </div>
  )
}
