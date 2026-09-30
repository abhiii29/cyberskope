"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Check, CircleX, Copy, Info } from "lucide-react"
import { attackOf, parseSigma, type Severity } from "@/lib/rulebridge/sigma"
import { targets, worst, type FieldStatus } from "@/lib/rulebridge/targets"
import { samples } from "@/lib/rulebridge/samples"
import { evaluate } from "@/lib/rulebridge/evaluate"

const sevStyle: Record<Severity, { icon: typeof Info; cls: string }> = {
  error: { icon: CircleX, cls: "text-danger border-danger/30 bg-danger/5" },
  warning: { icon: AlertTriangle, cls: "text-warn border-warn/30 bg-warn/5" },
  info: { icon: Info, cls: "text-muted-foreground border-border bg-background/40" },
}
const dot = { error: "bg-danger", warning: "bg-warn", info: "bg-primary", ok: "bg-primary" }
const fieldCls: Record<FieldStatus, string> = {
  mapped: "text-primary", identity: "text-muted-foreground", derived: "text-warn", unmapped: "text-danger",
}

export function RuleTranslator() {
  const [yaml, setYaml] = useState(samples[0].yaml)
  const [tid, setTid] = useState("wazuh")
  const [copied, setCopied] = useState(false)
  const [event, setEvent] = useState(samples[0].event)

  const parsed = useMemo(() => parseSigma(yaml), [yaml])
  const outputs = useMemo(
    () => (parsed.rule ? Object.fromEntries(targets.map((t) => [t.id, t.convert(parsed.rule!)])) : {}),
    [parsed],
  )
  const out = outputs[tid]
  const diags = [...parsed.diagnostics, ...(out?.diagnostics ?? [])].sort(
    (a, b) => ["error", "warning", "info"].indexOf(a.severity) - ["error", "warning", "info"].indexOf(b.severity),
  )
  const attack = parsed.rule ? attackOf(parsed.rule.tags) : null
  const lost = targets.filter((t) => outputs[t.id] && worst(outputs[t.id].diagnostics) === "error").map((t) => t.name)

  const result = useMemo(() => (parsed.rule ? evaluate(parsed.rule, event) : null), [parsed, event])

  const copy = async () => {
    if (!out) return
    await navigator.clipboard.writeText(out.query).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Input */}
      <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <span className="font-mono text-xs text-muted-foreground">sigma.yml</span>
          <select
            aria-label="Load a sample rule"
            onChange={(e) => {
              const s = samples[Number(e.target.value)]
              setYaml(s.yaml)
              setEvent(s.event)
            }}
            defaultValue="0"
            className="ml-auto rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-primary"
          >
            {samples.map((s, i) => <option key={s.name} value={i}>sample: {s.name}</option>)}
          </select>
        </div>
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          spellCheck={false}
          aria-label="Sigma rule"
          className="min-h-[420px] flex-1 resize-y bg-transparent p-4 font-mono text-xs leading-5 outline-none"
        />
        {attack && (attack.techniques.length > 0 || attack.tactics.length > 0) && (
          <div className="border-t border-border p-3">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">MITRE ATT&CK</div>
            <div className="flex flex-wrap gap-2">
              {attack.tactics.map((t) => (
                <span key={t} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] capitalize text-muted-foreground">{t}</span>
              ))}
              {attack.techniques.map((t) => (
                <a key={t.id} href={t.url} target="_blank" rel="noreferrer" className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] text-primary hover:bg-primary/20">
                  {t.id} ↗
                </a>
              ))}
            </div>
            {lost.length > 0 && (
              <p className="mt-2 text-xs text-danger">Coverage lost in translation on: {lost.join(", ")}</p>
            )}
          </div>
        )}
      </div>

      {/* Output */}
      <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60">
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
          {targets.map((t) => {
            const w = outputs[t.id] ? worst(outputs[t.id].diagnostics) : "error"
            return (
              <button
                key={t.id}
                onClick={() => setTid(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs transition ${t.id === tid ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dot[w]}`} /> {t.name}
              </button>
            )
          })}
        </div>
        <div className="relative border-b border-border">
          <pre className="max-h-72 min-h-[140px] overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-xs leading-5 text-foreground/90">
            {out ? out.query : "// fix the rule to see output"}
          </pre>
          {out && (
            <button onClick={copy} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 font-mono text-[11px] hover:border-primary">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "copied" : "copy"}
            </button>
          )}
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto p-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">What the translation lost</div>
          {diags.length === 0 && <p className="font-mono text-xs text-primary">✓ faithful translation, nothing to report</p>}
          {diags.map((d, i) => {
            const S = sevStyle[d.severity]
            return (
              <div key={i} className={`flex gap-2 rounded border p-2 text-xs ${S.cls}`}>
                <S.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <span className="font-mono opacity-70">{d.code}</span> <span className="text-foreground/90">{d.message}</span>
                  {d.hint && <div className="mt-0.5 opacity-80">hint: {d.hint}</div>}
                </div>
              </div>
            )
          })}
        </div>

        {out && out.fields.length > 0 && (
          <div className="border-t border-border p-3">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Field mapping</div>
            <table className="w-full font-mono text-xs">
              <tbody>
                {out.fields.map((f) => (
                  <tr key={f.sigma} className="border-b border-border/40 last:border-0">
                    <td className="py-1 pr-3">{f.sigma}</td>
                    <td className="py-1 pr-3 text-muted-foreground">→</td>
                    <td className="break-all py-1 pr-3">{f.target}</td>
                    <td className={`py-1 text-right ${fieldCls[f.status]}`}>{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {/* Matrix */}
      <div className="min-w-0 rounded-xl border border-border bg-card/60 p-3">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Compare all platforms</div>
        {!parsed.rule ? (
          <p className="font-mono text-xs text-danger">fix the rule to compare platforms</p>
        ) : (
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-normal">platform</th>
                <th className="pb-2 font-normal">verdict</th>
                <th className="pb-2 text-right font-normal">err</th>
                <th className="pb-2 text-right font-normal">warn</th>
                <th className="pb-2 text-right font-normal">info</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => {
                const d = outputs[t.id].diagnostics
                const w = worst(d)
                const n = (s: Severity) => d.filter((x) => x.severity === s).length
                const verdict = { error: "can't express it", warning: "degraded", info: "keeps meaning", ok: "keeps meaning" }[w]
                const top = d.find((x) => x.severity === w)
                return (
                  <tr
                    key={t.id}
                    onClick={() => setTid(t.id)}
                    className={`cursor-pointer border-t border-border/40 hover:bg-primary/5 ${t.id === tid ? "bg-primary/10" : ""}`}
                    title={top?.message}
                  >
                    <td className="py-2 pr-2"><span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${dot[w]}`} />{t.name}</td>
                    <td className={`py-2 pr-2 ${w === "error" ? "text-danger" : w === "warning" ? "text-warn" : "text-primary"}`}>
                      {verdict}
                      {top && w !== "info" && <div className="truncate text-[10px] text-muted-foreground">{top.code}</div>}
                    </td>
                    <td className="py-2 text-right">{n("error") || "·"}</td>
                    <td className="py-2 text-right">{n("warning") || "·"}</td>
                    <td className="py-2 text-right text-muted-foreground">{n("info") || "·"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">Click a row to open that platform&apos;s output.</p>
      </div>

      {/* Tester */}
      <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60">
        <div className="flex items-center justify-between border-b border-border p-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Test against an event</span>
          {result && !result.error && (
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${result.matched ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
              {result.matched ? "● rule fires" : "○ no match"}
            </span>
          )}
        </div>
        <textarea
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          spellCheck={false}
          aria-label="Sample event JSON"
          className="min-h-[140px] resize-y bg-transparent p-3 font-mono text-xs leading-5 outline-none"
        />
        <div className="border-t border-border p-3">
          {result?.error && <p className="font-mono text-xs text-danger">{result.error}</p>}
          {result && !result.error && (
            <div className="space-y-3">
              <div className="font-mono text-[11px] text-muted-foreground">condition uses Sigma semantics, not any one platform&apos;s</div>
              {result.selections.map((sel) => (
                <div key={sel.name}>
                  <div className={`font-mono text-xs ${sel.matched ? "text-primary" : "text-muted-foreground"}`}>
                    {sel.matched ? "✓" : "✗"} {sel.name}
                  </div>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {sel.leaves.map((l, i) => (
                      <li key={i} className="break-all font-mono text-[11px] text-muted-foreground">
                        <span className={l.matched ? "text-primary" : "text-danger/80"}>{l.matched ? "✓" : "✗"}</span> {l.field}{" "}
                        <span className="opacity-60">expects</span> {l.expected} <span className="opacity-60">got</span> {l.actual}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
