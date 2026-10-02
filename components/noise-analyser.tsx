"use client"

import { useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Check, Copy, Info, Upload } from "lucide-react"
import { detectFields, evidence, fmtPeriod, groupAlerts, hourly, parseAlerts, sampleAlerts, suggest } from "@/lib/lab/noise"

const TIP = { background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 12 }

export function NoiseAnalyser() {
  const reduce = useReducedMotion()
  const [text, setText] = useState(sampleAlerts)
  const [by, setBy] = useState<string[] | null>(null)
  const [sel, setSel] = useState(0)
  const [fmt, setFmt] = useState<"wazuh" | "sigma">("wazuh")
  const [copied, setCopied] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const { alerts, error } = useMemo(() => parseAlerts(text), [text])
  const f = useMemo(() => detectFields(alerts), [alerts])
  const defaults = useMemo(() => [f.rule, f.host, f.user, f.command].filter((x): x is string => !!x), [f])
  const fields = by ?? defaults
  const groups = useMemo(() => (fields.length ? groupAlerts(alerts, fields, f) : []), [alerts, fields, f])
  const top = groups.slice(0, 8)
  const g = top[Math.min(sel, top.length - 1)]
  const series = useMemo(() => hourly(alerts, f, g), [alerts, f, g])
  const sug = g ? suggest(g, fields, f, alerts.length) : null
  const topShare = groups.slice(0, 3).reduce((a, x) => a + x.share, 0)
  const periodic = groups.filter((x) => x.period && x.share >= 0.01)

  const load = (fl?: File) => {
    if (!fl) return
    if (fl.size > 20_000_000) return setText("// file is over 20 MB; trim it first")
    fl.text().then((t) => (setText(t), setBy(null), setSel(0)))
  }
  const toggle = (k: string) => {
    const next = fields.includes(k) ? fields.filter((x) => x !== k) : [...fields, k]
    setBy(next.length ? next : fields)
    setSel(0)
  }
  const copy = async () => {
    if (!sug) return
    await navigator.clipboard.writeText(sug[fmt]).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="rounded-xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <span className="font-mono text-xs text-muted-foreground">alerts · JSON array, NDJSON or CSV</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => (setText(sampleAlerts()), setBy(null), setSel(0))} className="rounded border border-border px-2 py-1 font-mono text-[11px] hover:border-primary">
              load sample day
            </button>
            <button onClick={() => file.current?.click()} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[11px] hover:border-primary">
              <Upload className="h-3 w-3" /> open file
            </button>
            <input ref={file} type="file" accept=".json,.ndjson,.csv,.log,.txt" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => (setText(e.target.value), setBy(null), setSel(0))}
          spellCheck={false}
          aria-label="Alert export"
          className="h-28 w-full resize-y bg-transparent p-3 font-mono text-[11px] leading-5 text-muted-foreground outline-none"
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">group by</span>
          {f.keys.slice(0, 16).map((k) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition ${fields.includes(k) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      {!error && alerts.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              [alerts.length.toLocaleString(), "alerts analysed"],
              [groups.length.toLocaleString(), "distinct groups"],
              [`${(topShare * 100).toFixed(0)}%`, "of volume from the top 3"],
              [String(periodic.length), "groups firing on a schedule"],
            ].map(([v, l], i) => (
              <motion.div
                key={l}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-lg border border-border bg-card/60 p-3"
              >
                <div className="font-mono text-2xl font-bold text-primary">{v}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            {/* Noise makers */}
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">top noise makers</div>
              <ol className="space-y-1.5">
                {top.map((x, i) => (
                  <li key={x.key.join("|")}>
                    <button
                      onClick={() => setSel(i)}
                      className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left transition ${i === sel ? "border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      <motion.span
                        aria-hidden
                        className={`absolute inset-y-0 left-0 ${x.share >= 0.2 ? "bg-danger/15" : "bg-primary/10"}`}
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${x.share * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <span className="relative flex items-center gap-3">
                        <span className="w-12 shrink-0 font-mono text-xs font-bold">{(x.share * 100).toFixed(1)}%</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">{x.key.map((v) => v || "∅").join(" · ")}</span>
                        {x.period && <span className="shrink-0 rounded bg-warn/15 px-1.5 py-0.5 font-mono text-[10px] text-warn">every {fmtPeriod(x.period)}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            {/* Selected group */}
            <AnimatePresence mode="wait">
              {g && sug && (
                <motion.div
                  key={g.key.join("|")}
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60"
                >
                  {series.length > 1 && (
                    <div className="h-36 border-b border-border p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={series} barCategoryGap={1}>
                          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={10} interval={3} />
                          <YAxis stroke="var(--muted-foreground)" fontSize={10} width={32} />
                          <Tooltip contentStyle={TIP} cursor={{ fill: "var(--border)", opacity: 0.3 }} />
                          <Bar dataKey="group" name="this group" stackId="a" fill="var(--danger)" fillOpacity={0.8} />
                          <Bar dataKey="rest" name="everything else" stackId="a" fill="var(--primary)" fillOpacity={0.35} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="space-y-1 border-b border-border p-3">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">evidence</div>
                    {evidence(g, alerts.length).map((e) => (
                      <div key={e} className="font-mono text-xs">
                        <span className="text-primary">→</span> {e}
                      </div>
                    ))}
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-center gap-1 border-b border-border/60 px-3 py-1.5">
                      <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">draft suppression</span>
                      {(["wazuh", "sigma"] as const).map((x) => (
                        <button key={x} onClick={() => setFmt(x)} className={`rounded px-2 py-0.5 font-mono text-[11px] ${fmt === x ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                          {x}
                        </button>
                      ))}
                      <button onClick={copy} className="ml-auto inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:border-primary">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "copied" : "copy"}
                      </button>
                    </div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[11px] leading-5">{sug[fmt]}</pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Volume and regularity point at noise; they don&apos;t prove it&apos;s benign. A scheduled job can be
              attacker persistence too. Review each draft with the owner of the system before it ships, and keep
              the evidence in the rule. Detected fields: time <code>{f.time ?? "none"}</code>, rule{" "}
              <code>{f.rule ?? "none"}</code>. Everything runs in your browser; nothing is uploaded.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
