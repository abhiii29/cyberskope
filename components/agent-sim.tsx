"use client"

// Full-screen replay of one simulated daily-review run: a console on the left
// of the stage, the artefact each step produces on the right, and transport
// controls. Data is synthetic and labelled as such.

import { useEffect, useRef, useState, type ComponentType } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Brain, Clock, Download, GitPullRequest, Pause, Play, RotateCcw, ShieldAlert, SkipForward, Ticket, UserCheck, X } from "lucide-react"
import { BUDGET, defaultDecisions, feedbackEffect, runFor, scenarios, stageEnd, type Card, type Decisions, type GateId, type Reasons, type SimTicket } from "@/lib/agent-sim"
import { TicketDesk } from "@/components/ticket-desk"

type Step = { icon: ComponentType<{ className?: string }>; title: string }

const toneCls = { cmd: "text-foreground", ok: "text-primary", warn: "text-warn", err: "text-danger", llm: "text-violet", dim: "text-muted-foreground" }
const tonePrefix = { cmd: "", ok: "✓ ", warn: "! ", err: "✗ ", llm: "◆ ", dim: "  " }
const sevCls = { High: "border-danger/50 bg-danger/10 text-danger", Medium: "border-warn/50 bg-warn/10 text-warn", Info: "border-border bg-background/40 text-muted-foreground" }

export function AgentSim({ steps, onClose, initialScenario }: { steps: Step[]; onClose: () => void; initialScenario?: string }) {
  const reduce = useReducedMotion()
  const [scenarioId, setScenarioId] = useState(scenarios.some((x) => x.id === initialScenario) ? initialScenario! : scenarios[0].id)
  const scenario = scenarios.find((x) => x.id === scenarioId)!
  const [decisions, setDecisions] = useState<Decisions>(reduce ? defaultDecisions : {})
  const [reasons, setReasons] = useState<Reasons>({})
  const [panel, setPanel] = useState<"output" | "model">("output")
  const [desk, setDesk] = useState<string | null | undefined>(undefined) // undefined = closed, null = open on first ticket
  const script = runFor(scenario.events, decisions)
  const [shown, setShown] = useState(reduce ? script.length : 0)
  const [playing, setPlaying] = useState(!reduce)
  const [speed, setSpeed] = useState(1)
  const consoleRef = useRef<HTMLDivElement>(null)
  const deskRef = useRef(false)
  deskRef.current = desk !== undefined
  const done = shown >= script.length
  const last = shown > 0 ? script[shown - 1] : undefined
  const waiting = !!(last?.gate && !decisions[last.gate])
  const stage = shown === 0 ? 0 : script[shown - 1].stage
  const [view, setView] = useState<number | null>(null) // stage pinned by clicking the rail
  const viewStage = view ?? stage

  useEffect(() => {
    if (!playing || done || waiting) return
    const t = setTimeout(() => setShown((n) => n + 1), script[shown].wait / speed)
    return () => clearTimeout(t)
  }, [playing, shown, speed, done, waiting, script])

  useEffect(() => {
    const el = consoleRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return deskRef.current ? setDesk(undefined) : onClose()
      if (e.key === " " && !(e.target instanceof HTMLInputElement)) (e.preventDefault(), setPlaying((p) => !p))
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const jump = (s: number) => {
    const end = stageEnd(script, s, decisions)
    setView(shown >= end ? s : null)
    setShown(Math.max(shown, end))
  }
  const decide = (g: GateId, choice: string, reason?: string) => {
    setDecisions((d) => ({ ...d, [g]: choice }))
    if (reason) setReasons((r) => ({ ...r, [g]: reason }))
    setPlaying(true)
  }
  const reset = (id = scenarioId) => {
    const d = reduce ? defaultDecisions : {}
    setScenarioId(id)
    setDecisions(d)
    setReasons({})
    setView(null)
    setDesk(undefined)
    setShown(reduce ? runFor(scenarios.find((x) => x.id === id)!.events, d).length : 0)
    setPlaying(!reduce)
  }
  const restart = () => reset()
  const past = script.slice(0, shown)
  const clock = [...past].reverse().find((e) => e.at)?.at
  const published = past.flatMap((e) => (e.card?.kind === "ticket" ? [e.card.ticket] : []))
  const fresh = new Set(published.map((x) => x.key))
  const deskTickets: SimTicket[] = [...published, ...scenario.backlog.filter((b) => !published.some((p) => p.key === b.key))]
  const exportRun = () => {
    const data = {
      note: "Simulated daily-review run. Synthetic tenants and data.",
      scenario: scenario.name,
      decisions,
      reasons,
      events: past.map((e) => ({ step: steps[e.stage].title, at: e.at, tone: e.tone, text: e.text, card: e.card?.kind })),
      tickets: published.map((x) => x.key),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
    const a = Object.assign(document.createElement("a"), { href: url, download: `daily-review-${scenario.id}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }
  const cards = past.filter((e) => e.stage === viewStage && e.card).map((e) => e.card!)
  const calls = script.slice(0, shown).filter((e) => e.card?.kind === "tool").length

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Simulated agent run"
    >
      {/* Top bar */}
      <div className="relative flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <span className="pr-10 font-mono text-sm font-semibold sm:pr-0">daily-review · simulated run</span>
        <span className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[10px] text-warn">synthetic tenants and data</span>
        {clock && (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {clock} UTC
          </span>
        )}
        <div className="flex w-full min-w-0 flex-wrap items-center gap-1 sm:ml-auto sm:w-auto">
          <select
            value={scenarioId}
            onChange={(e) => reset(e.target.value)}
            aria-label="Scenario"
            className="h-8 w-full min-w-0 max-w-full rounded border border-border bg-card px-2 font-mono text-xs outline-none focus:border-primary sm:w-auto sm:max-w-xs"
          >
            {scenarios.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}: {x.blurb}
              </option>
            ))}
          </select>
          <button onClick={() => setDesk(null)} className="relative inline-flex h-8 items-center gap-1 rounded border border-border px-2 font-mono text-xs hover:border-primary" aria-label="Open ticket desk">
            <Ticket className="h-3.5 w-3.5" /> tickets
            {published.length > 0 && (
              <motion.span key={published.length} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {published.length}
              </motion.span>
            )}
          </button>
          <button onClick={exportRun} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:border-primary" aria-label="Download run log" title="download run log (JSON)">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => (done ? restart() : setPlaying((p) => !p))} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:border-primary" aria-label={playing && !done ? "Pause" : "Play"}>
            {playing && !done ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => !done && !waiting && setShown((n) => n + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:border-primary" aria-label="Next event">
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          <button onClick={restart} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:border-primary" aria-label="Restart">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {[1, 2, 4].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={`h-8 rounded px-2 font-mono text-xs ${speed === s ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
              {s}×
            </button>
          ))}
          <button onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background hover:border-danger sm:static sm:ml-2" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute inset-x-0 -bottom-px h-px bg-border">
          <motion.div className="h-full origin-left bg-gradient-to-r from-primary to-violet" animate={{ scaleX: shown / script.length }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:grid lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
        {/* Stage rail */}
        <ol className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {steps.map((s, i) => {
            const state = i < stage || (i === stage && done) ? "done" : i === stage ? "active" : "todo"
            return (
              <li key={s.title} className="shrink-0">
                <button
                  onClick={() => jump(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${viewStage === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${state === "todo" ? "border-border text-muted-foreground" : "border-primary text-primary"}`}>
                    <s.icon className="h-3.5 w-3.5" />
                    {state === "active" && !reduce && <span className="absolute inset-0 animate-ping rounded-full border border-primary" />}
                  </span>
                  <span className="text-sm">
                    <span className="block font-mono text-[10px] text-muted-foreground">step {i + 1}</span>
                    {s.title}
                  </span>
                </button>
              </li>
            )
          })}
          <li className="hidden rounded-lg border border-border p-3 lg:block">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">tool budget</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from({ length: BUDGET }, (_, k) => (
                <motion.span key={k} className="h-2.5 w-2.5 rounded-sm" animate={{ backgroundColor: k < calls ? "var(--primary)" : "var(--border)" }} />
              ))}
            </div>
            <div className="mt-1 font-mono text-xs">{calls} / {BUDGET} calls</div>
          </li>
        </ol>

        {/* Console */}
        <div ref={consoleRef} className="max-h-[50vh] min-h-64 shrink-0 overflow-y-auto rounded-xl border border-border bg-card/70 p-4 lg:max-h-none lg:shrink font-mono text-xs leading-6 lg:min-h-0">
          {script.slice(0, shown).map((e, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={`whitespace-pre-wrap ${toneCls[e.tone ?? "dim"]} ${e.stage !== stage && !done ? "opacity-60" : ""}`}
            >
              {i > 0 && script[i - 1].stage !== e.stage && <div className="my-2 border-t border-dashed border-border" />}
              {tonePrefix[e.tone ?? "dim"]}
              {e.text}
            </motion.div>
          ))}
          {waiting ? (
            <div className="mt-1 animate-pulse text-warn">awaiting analyst → choose in the output panel</div>
          ) : (
            !done && <span className="inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
          )}
        </div>

        {/* Artefacts */}
        <div className="min-h-64 shrink-0 overflow-y-auto rounded-xl border border-border bg-card/40 p-4 lg:shrink lg:min-h-0">
          <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider">
            <button onClick={() => setPanel("output")} className={panel === "output" ? "text-primary" : "text-muted-foreground"}>
              output · {steps[viewStage].title}
            </button>
            <button onClick={() => setPanel("model")} className={`inline-flex items-center gap-1 ${panel === "model" ? "text-violet" : "text-muted-foreground"}`}>
              <Brain className="h-3 w-3" /> what the model sees
            </button>
          </div>
          {panel === "model" ? (
            <motion.pre initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-violet/40 bg-background/60 p-3 font-mono text-[11px] leading-5">
              {scenario.modelInput}
            </motion.pre>
          ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {cards.map((c, i) => (
                <motion.div
                  key={`${viewStage}-${i}`}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <CardView c={c} decision={c.kind === "gate" ? decisions[c.id] : undefined} reasons={reasons} onDecide={decide} onOpenTicket={(k) => setDesk(k)} />
                </motion.div>
              ))}
            </AnimatePresence>
            {cards.length === 0 && <p className="font-mono text-xs text-muted-foreground">waiting for this step…</p>}
          </div>
          )}
        </div>
      </div>
      <p className="border-t border-border px-4 py-2 text-center font-mono text-[10px] text-muted-foreground">
        space: play/pause · esc: close · click a step to review its output · {scenario.blurb.toLowerCase()}
      </p>
      <AnimatePresence>
        {desk !== undefined && <TicketDesk tickets={deskTickets} fresh={fresh} initial={desk ?? undefined} onClose={() => setDesk(undefined)} />}
      </AnimatePresence>
    </motion.div>
  )
}

function CardView({
  c, decision, reasons, onDecide, onOpenTicket,
}: { c: Card; decision?: string; reasons: Reasons; onDecide: (g: GateId, choice: string, reason?: string) => void; onOpenTicket: (key: string) => void }) {
  switch (c.kind) {
    case "gate":
      return <GateCard c={c} decision={decision} reason={reasons[c.id]} onDecide={onDecide} />
    case "feedback": {
      const r = reasons[c.gate]
      return (
        <div className="rounded-lg border border-violet/40 bg-violet/5 p-3 text-sm">
          <div className="font-mono text-[10px] uppercase tracking-wider text-violet">feedback loop</div>
          <p className="mt-1">Reason: <span className="font-semibold">{r ?? "not given"}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Tomorrow&apos;s run: {r ? feedbackEffect[r] : "no change"}</p>
        </div>
      )
    }
    case "sla": {
      const max = Math.max(...c.rows.map((r) => r.minutes))
      return (
        <div className="rounded-lg border border-border p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">first alert → ticket</div>
          <div className="mt-2 space-y-2">
            {c.rows.map((r, i) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs">
                  <span>{r.label}</span>
                  <span className="font-mono">{r.minutes < 120 ? `${r.minutes} min` : `${Math.round(r.minutes / 60)} h`} · {r.from} → {r.to}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className={`h-full rounded-full ${r.tone === "primary" ? "bg-primary" : "bg-muted-foreground/50"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(2, (r.minutes / max) * 100)}%` }}
                    transition={{ duration: 0.9, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "ticket":
      return (
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">{c.ticket.key}</span>
            <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{c.ticket.priority} · {c.ticket.queue}</span>
            <span className="ml-auto text-[10px] text-violet">{c.note}</span>
          </div>
          <div className="mt-1 text-sm font-semibold">{c.ticket.title}</div>
          <button onClick={() => onOpenTicket(c.ticket.key)} className="mt-2 font-mono text-[11px] text-primary hover:underline">
            open in ticket desk →
          </button>
        </div>
      )
    case "pr":
      return (
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <GitPullRequest className="h-3.5 w-3.5 text-violet" />
            <span>{c.title}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{c.status}</span>
          </div>
          <pre className="mt-2 overflow-x-auto rounded bg-background/60 p-2 font-mono text-[11px] leading-5">
            {c.diff.split("\n").map((l, i) => (
              <div key={i} className={l.startsWith("+") ? "text-primary" : "text-muted-foreground"}>{l}</div>
            ))}
          </pre>
        </div>
      )
    case "tenant":
      return (
        <div className={`flex items-center justify-between rounded-lg border p-3 ${c.status === "ok" ? "border-border" : "border-danger/50 bg-danger/10"}`}>
          <span className="font-mono text-sm">{c.name}</span>
          <span className={`font-mono text-xs ${c.status === "ok" ? "text-primary" : "text-danger"}`}>{c.detail}</span>
        </div>
      )
    case "diff":
      return (
        <table className="w-full rounded-lg border border-border font-mono text-[11px]">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="p-2 text-left font-normal">rule group</th>
              <th className="p-2 text-right font-normal">24h</th>
              <th className="p-2 text-right font-normal">baseline</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r) => (
              <tr key={r.group} className={`border-b border-border/50 ${r.flag ? "text-warn" : "text-muted-foreground"}`}>
                <td className="p-2">
                  {r.group} {r.flag && <span className="ml-1 rounded bg-warn/15 px-1 text-[10px]">{r.flag}</span>}
                </td>
                <td className="p-2 text-right">{r.today.toLocaleString()}</td>
                <td className="p-2 text-right">{r.baseline.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case "json":
      return <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 font-mono text-[11px] leading-5">{c.text}</pre>
    case "tool":
      return (
        <div className="rounded-lg border border-border p-3 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/15 px-1.5 text-primary">#{c.n}</span>
            <span className="text-foreground">{c.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">read-only · audit-logged</span>
          </div>
          <div className="mt-1 text-muted-foreground">({c.args})</div>
          <div className="mt-1.5 border-l-2 border-primary/50 pl-2">{c.result}</div>
        </div>
      )
    case "guard":
      return (
        <div className="flex gap-2 rounded-lg border border-warn/50 bg-warn/10 p-3 font-mono text-[11px] text-warn">
          <ShieldAlert className="h-4 w-4 shrink-0" /> {c.text}
        </div>
      )
    case "check":
      return (
        <div className={`rounded-lg border p-3 text-sm ${c.ok ? "border-border" : "border-danger/40 bg-danger/5"}`}>
          <span className={c.ok ? "" : "text-muted-foreground line-through decoration-danger"}>{c.claim}</span>
          <div className={`mt-1 font-mono text-[11px] ${c.ok ? "text-primary" : "text-danger"}`}>{c.ok ? "✓ traced to " : "✗ removed: "}{c.why}</div>
        </div>
      )
    case "finding":
      return (
        <div className={`rounded-lg border p-3 ${sevCls[c.sev]}`}>
          <div className="font-mono text-[10px] uppercase tracking-wider">{c.sev}</div>
          <div className="text-sm font-semibold text-foreground">{c.title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
        </div>
      )
  }
}

function GateCard({
  c, decision, reason, onDecide,
}: { c: Extract<Card, { kind: "gate" }>; decision?: string; reason?: string; onDecide: (g: GateId, choice: string, reason?: string) => void }) {
  const [pending, setPending] = useState<string | null>(null)
  const opt = c.options.find((o) => o.id === pending)
  return (
    <div className={`rounded-lg border p-3 ${decision ? "border-border" : "border-warn/60 bg-warn/5 shadow-[0_0_24px_-8px_var(--warn)]"}`}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-warn">
        <UserCheck className="h-3.5 w-3.5" /> human in the loop
      </div>
      <div className="mt-1 text-sm font-semibold">{c.title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
      <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-muted-foreground">
        {c.evidence.map((e) => (
          <li key={e}>→ {e}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.options.map((o) => {
          const picked = decision === o.id || pending === o.id
          const tone = o.tone === "ok" ? "border-primary text-primary hover:bg-primary/15" : o.tone === "warn" ? "border-warn text-warn hover:bg-warn/15" : "border-danger text-danger hover:bg-danger/15"
          return (
            <button
              key={o.id}
              disabled={!!decision}
              onClick={() => (o.reasons ? setPending(o.id) : onDecide(c.id, o.id))}
              className={`rounded-md border px-3 py-1.5 font-mono text-xs transition disabled:cursor-default ${tone} ${(decision || pending) && !picked ? "opacity-30" : ""} ${picked ? "ring-1 ring-current" : ""}`}
            >
              {decision === o.id ? "✓ " : ""}{o.label}
            </button>
          )
        })}
      </div>
      <AnimatePresence>
        {opt?.reasons && !decision && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">why? (feeds tomorrow&apos;s run)</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {opt.reasons.map((r) => (
                <button key={r} onClick={() => onDecide(c.id, opt.id, r)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-violet hover:text-violet">
                  {r}
                </button>
              ))}
              <button onClick={() => setPending(null)} className="px-2 text-xs text-muted-foreground hover:text-foreground">cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {decision && reason && <p className="mt-2 font-mono text-[11px] text-violet">reason: {reason}</p>}
    </div>
  )
}
