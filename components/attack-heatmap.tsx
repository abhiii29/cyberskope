"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ExternalLink, Info } from "lucide-react"
import { coverage, matrix, readRules, samplePack, uniqueTechniques } from "@/lib/lab/attack"

const heat = (n: number) =>
  n === 0 ? "border-border bg-background/40 text-muted-foreground"
    : n === 1 ? "border-primary/40 bg-primary/15 text-foreground"
    : n === 2 ? "border-primary/60 bg-primary/35 text-foreground"
    : "border-primary bg-primary/60 text-primary-foreground"

const attackUrl = (id: string) => `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`

export function AttackHeatmap() {
  const reduce = useReducedMotion()
  const [text, setText] = useState(samplePack)
  const [pick, setPick] = useState<{ tactic: string; tech: string } | null>(null)
  const { rules, errors } = useMemo(() => readRules(text), [text])
  const cov = useMemo(() => coverage(rules), [rules])
  const picked = pick ? cov.cell.get(`${pick.tactic}|${pick.tech}`) ?? [] : []
  const pickedName = pick ? matrix.flatMap((m) => m.techniques).find((x) => x.id === pick.tech)?.name : ""
  const pct = Math.round((cov.covered.length / uniqueTechniques) * 100)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <span className="font-mono text-xs text-muted-foreground">rules.yml · separate rules with ---</span>
            <button onClick={() => (setText(samplePack), setPick(null))} className="ml-auto rounded border border-border px-2 py-1 font-mono text-[11px] hover:border-primary">
              sample pack
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            aria-label="Sigma rules"
            className="min-h-64 flex-1 resize-y bg-transparent p-3 font-mono text-[11px] leading-5 outline-none"
          />
          {errors.length > 0 && <div className="border-t border-border p-3 font-mono text-[11px] text-danger">{errors.slice(0, 3).join("\n")}</div>}
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-2">
          {[
            [String(rules.length), "rules read"],
            [`${cov.covered.length} / ${uniqueTechniques}`, `techniques covered (${pct}% of this matrix)`],
          ].map(([v, l]) => (
            <div key={l} className="rounded-lg border border-border bg-card/60 p-3">
              <div className="font-mono text-2xl font-bold text-primary">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-card/60 p-3 sm:col-span-2">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">weakest tactics</div>
            <div className="space-y-1.5">
              {cov.tacticGaps.slice(0, 5).map((t, i) => (
                <div key={t.name} className="flex items-center gap-3 text-xs">
                  <span className="w-36 shrink-0 truncate">{t.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className={`h-full ${t.covered === 0 ? "bg-danger" : "bg-warn"}`}
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${Math.max(3, (t.covered / t.total) * 100)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.06 }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-muted-foreground">{t.covered}/{t.total}</span>
                </div>
              ))}
            </div>
          </div>
          {(cov.outside.length > 0 || cov.untagged.length > 0) && (
            <div className="space-y-1 rounded-lg border border-border bg-card/60 p-3 text-xs text-muted-foreground sm:col-span-2">
              {cov.outside.length > 0 && <p>Tagged but outside this matrix subset: <span className="font-mono text-foreground">{cov.outside.join(", ")}</span></p>}
              {cov.untagged.length > 0 && <p className="text-warn">No ATT&amp;CK technique tag: {cov.untagged.map((r) => r.title).join(", ")}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card/60 p-3">
        <div className="grid min-w-[1100px] grid-cols-12 gap-1.5">
          {matrix.map((col, ci) => (
            <div key={col.id} className="space-y-1.5">
              <div className="h-9 font-mono text-[10px] uppercase leading-tight tracking-wider text-muted-foreground">{col.name}</div>
              {col.techniques.map((tech, ti) => {
                const hits = cov.cell.get(`${col.id}|${tech.id}`) ?? []
                const on = pick?.tactic === col.id && pick.tech === tech.id
                return (
                  <motion.button
                    key={tech.id}
                    onClick={() => setPick(on ? null : { tactic: col.id, tech: tech.id })}
                    initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: ci * 0.03 + ti * 0.02, duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    title={`${tech.id} ${tech.name}: ${hits.length} rule(s)`}
                    className={`block h-14 w-full rounded-md border p-1.5 text-left transition-colors ${heat(hits.length)} ${on ? "ring-2 ring-violet" : ""}`}
                  >
                    <div className="font-mono text-[9px] opacity-70">{tech.id}</div>
                    <div className="line-clamp-2 text-[10px] leading-tight">{tech.name}</div>
                  </motion.button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="flex items-center gap-1">
              <span className={`h-3 w-3 rounded-sm border ${heat(n)}`} /> {n === 3 ? "3+" : n} rules
            </span>
          ))}
          <span className="ml-auto">click a cell for its rules</span>
        </div>
      </div>

      <AnimatePresence>
        {pick && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-primary/40 bg-card/60"
          >
            <div className="p-4">
              <a href={attackUrl(pick.tech)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline">
                {pick.tech} {pickedName} <ExternalLink className="h-3 w-3" />
              </a>
              {picked.length === 0 ? (
                <p className="mt-2 text-sm text-danger">Gap: no rule in this pack claims this technique under this tactic.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {picked.map((r) => (
                    <li key={r.title} className="flex gap-2">
                      <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{r.level}</span>
                      {r.title}
                      {r.subs.filter((s) => s.startsWith(pick.tech)).map((s) => (
                        <span key={s} className="font-mono text-xs text-muted-foreground">{s}</span>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Coverage here is what rules <em>claim</em> through their tags, not what they detect. A tagged rule can still
          miss the technique, and the matrix is a subset of {uniqueTechniques} common Enterprise techniques, not all of
          ATT&amp;CK. A rule counts under a tactic column when it names that tactic, or names no tactic at all.
          Everything runs in your browser.
        </p>
      </div>
    </div>
  )
}
