"use client"

// A small simulated ticketing system for the agent replay: the tickets the run
// published plus a short backlog, with status, assignment and comments kept in
// local state. Nothing here talks to a real tracker.

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowLeft, Bot, CircleDot, Clock, Link2, MessageSquare, Search, User, X } from "lucide-react"
import type { SimTicket } from "@/lib/agent-sim"

const STATUSES: SimTicket["status"][] = ["New", "Open", "In progress", "Resolved"]
const prioCls = { P1: "bg-danger text-background", P2: "bg-warn text-background", P3: "bg-primary/20 text-primary", P4: "bg-muted text-muted-foreground" }
const statusCls = { New: "text-violet", Open: "text-primary", "In progress": "text-warn", Resolved: "text-muted-foreground" }

type Edit = { status?: SimTicket["status"]; assignee?: string; comments: { who: string; at: string; text: string }[] }

export function TicketDesk({ tickets, fresh, initial, onClose }: { tickets: SimTicket[]; fresh: Set<string>; initial?: string; onClose: () => void }) {
  const reduce = useReducedMotion()
  const [sel, setSel] = useState(initial ?? tickets[0]?.key)
  const [filter, setFilter] = useState<"all" | "open" | "mine">("all")
  const [q, setQ] = useState("")
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [tab, setTab] = useState<"details" | "activity">("details")
  const [draft, setDraft] = useState("")
  const [mobileDetail, setMobileDetail] = useState(!!initial)

  const view = (t: SimTicket): SimTicket & { comments: Edit["comments"] } => {
    const e = edits[t.key]
    return { ...t, status: e?.status ?? t.status, assignee: e?.assignee ?? t.assignee, comments: e?.comments ?? [] }
  }
  const list = tickets
    .map(view)
    .filter((t) => (filter === "open" ? t.status !== "Resolved" : filter === "mine" ? t.assignee === "you" : true))
    .filter((t) => !q || `${t.key} ${t.title}`.toLowerCase().includes(q.toLowerCase()))
  const cur = tickets.find((t) => t.key === sel)
  const t = cur && view(cur)
  const edit = (key: string, patch: Partial<Edit>, log?: string) =>
    setEdits((all) => {
      const prev = all[key] ?? { comments: [] }
      const comments = log ? [...prev.comments, { who: "you", at: "now", text: log }] : prev.comments
      return { ...all, [key]: { ...prev, ...patch, comments: patch.comments ?? comments } }
    })

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col bg-background"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <CircleDot className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm font-semibold">SOC desk</span>
        <span className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[10px] text-warn">simulated ticketing · synthetic data</span>
        <button onClick={onClose} className="ml-auto inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-xs hover:border-primary">
          <X className="h-3.5 w-3.5" /> back to run
        </button>
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
        {/* Queue */}
        <aside className={`min-h-0 flex-col border-r border-border ${mobileDetail ? "hidden md:flex" : "flex"}`}>
          <div className="space-y-2 border-b border-border p-3">
            <label className="flex items-center gap-2 rounded border border-border px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search tickets" className="w-full bg-transparent font-mono text-xs outline-none" />
            </label>
            <div className="flex gap-1">
              {(["all", "open", "mine"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded px-2 py-0.5 font-mono text-[11px] ${filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {list.map((x) => (
              <li key={x.key}>
                <button
                  onClick={() => (setSel(x.key), setMobileDetail(true), setTab("details"))}
                  className={`w-full border-b border-border/60 px-3 py-2.5 text-left transition ${x.key === sel ? "bg-primary/10" : "hover:bg-card"}`}
                >
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={`rounded px-1.5 text-[10px] font-bold ${prioCls[x.priority]}`}>{x.priority}</span>
                    <span className="text-muted-foreground">{x.key}</span>
                    {fresh.has(x.key) && <span className="rounded bg-violet/15 px-1 text-[10px] text-violet">from this run</span>}
                    <span className={`ml-auto ${statusCls[x.status]}`}>{x.status}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm">{x.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">{x.queue} · {x.assignee}</div>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="p-4 font-mono text-xs text-muted-foreground">no tickets match</li>}
          </ul>
        </aside>

        {/* Detail */}
        <section className={`min-h-0 overflow-y-auto ${mobileDetail ? "block" : "hidden md:block"}`}>
          <AnimatePresence mode="wait">
            {t && (
              <motion.div
                key={t.key}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-3xl p-5"
              >
                <button onClick={() => setMobileDetail(false)} className="mb-3 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground md:hidden">
                  <ArrowLeft className="h-3 w-3" /> queue
                </button>
                <div className="font-mono text-xs text-muted-foreground">{t.key} · {t.queue}</div>
                <h2 className="mt-1 text-xl font-bold">{t.title}</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => s !== t.status && edit(t.key, { status: s }, `Status changed to ${s}.`)}
                      className={`rounded-full border px-3 py-1 font-mono text-[11px] transition ${s === t.status ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border p-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-muted-foreground">priority</dt>
                    <dd><span className={`rounded px-1.5 font-mono text-xs font-bold ${prioCls[t.priority]}`}>{t.priority}</span> {t.severity}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-muted-foreground">assignee</dt>
                    <dd className="flex items-center gap-1">
                      {t.assignee}
                      {t.assignee !== "you" && (
                        <button onClick={() => edit(t.key, { assignee: "you" }, "Assigned to me.")} className="font-mono text-[10px] text-primary hover:underline">take</button>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-muted-foreground">created</dt>
                    <dd>{t.created}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-muted-foreground">sla</dt>
                    <dd className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.status === "Resolved" ? "met" : t.sla}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex gap-4 border-b border-border">
                  {(["details", "activity"] as const).map((x) => (
                    <button key={x} onClick={() => setTab(x)} className={`relative pb-2 font-mono text-xs ${tab === x ? "text-primary" : "text-muted-foreground"}`}>
                      {x}
                      {x === "activity" && <span className="ml-1 text-[10px]">({t.activity.length + t.comments.length})</span>}
                      {tab === x && <motion.span layoutId="desk-tab" className="absolute inset-x-0 -bottom-px h-px bg-primary" />}
                    </button>
                  ))}
                </div>

                {tab === "details" ? (
                  <div className="space-y-5 py-4">
                    <p className="text-sm leading-relaxed">{t.description}</p>
                    <div>
                      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">evidence (linked from the run)</div>
                      <ul className="space-y-1">
                        {t.evidence.map((e) => (
                          <li key={e} className="flex items-center gap-2 rounded border border-border px-2 py-1.5 font-mono text-[11px]">
                            <Link2 className="h-3 w-3 shrink-0 text-primary" /> {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <ol className="relative space-y-4 py-4 pl-6">
                    <span className="absolute bottom-4 left-[9px] top-4 w-px bg-border" />
                    {[...t.activity, ...t.comments].map((a, i) => (
                      <motion.li key={i} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="relative">
                        <span className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border bg-background ${a.who === "daily-review" ? "border-violet text-violet" : "border-primary text-primary"}`}>
                          {a.who === "daily-review" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        </span>
                        <div className="font-mono text-[11px] text-muted-foreground">{a.who} · {a.at}</div>
                        <p className="text-sm">{a.text}</p>
                      </motion.li>
                    ))}
                  </ol>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!draft.trim()) return
                    edit(t.key, {}, draft.trim())
                    setDraft("")
                    setTab("activity")
                  }}
                  className="mt-2 flex gap-2"
                >
                  <label className="flex flex-1 items-center gap-2 rounded border border-border px-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} placeholder="add a comment (stays in this browser tab)" className="w-full bg-transparent py-2 text-sm outline-none" />
                  </label>
                  <button className="rounded bg-primary px-3 font-mono text-xs text-primary-foreground">comment</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  )
}
