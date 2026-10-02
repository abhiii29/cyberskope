"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { defang, extractIocs, inCidr, sampleReport, type IocType } from "@/lib/lab/ioc"
import { Caveat, CopyButton, Panel, area, chip } from "@/components/lab-ui"

const types: IocType[] = ["url", "domain", "ipv4", "ipv6", "email", "sha256", "sha1", "md5", "cve"]

export function IocHelper() {
  const reduce = useReducedMotion()
  const [text, setText] = useState(sampleReport)
  const [scope, setScope] = useState("10.0.0.0/8\n192.168.0.0/16")
  const [off, setOff] = useState<Set<IocType>>(new Set())
  const [fanged, setFanged] = useState(false)
  const [hidePrivate, setHidePrivate] = useState(false)

  const all = useMemo(() => extractIocs(text), [text])
  const cidrs = scope.split(/[\s,]+/).filter((c) => /^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(c))
  const rows = all
    .filter((i) => !off.has(i.type))
    .filter((i) => !(hidePrivate && i.note && /private|loopback|link-local|non-public/.test(i.note)))
    .map((i) => ({ ...i, inScope: i.type === "ipv4" && cidrs.some((c) => inCidr(i.value.split("/")[0], c)) }))
  const out = rows.map((i) => (fanged ? i.value : defang(i.type, i.value))).join("\n")
  const csv = ["type,value,note,count,in_scope", ...rows.map((i) => `${i.type},"${i.value}","${i.note ?? ""}",${i.count},${i.inScope}`)].join("\n")
  const counts = Object.fromEntries(types.map((t) => [t, all.filter((i) => i.type === t).length]))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="paste a report, ticket or chat" actions={<button className={chip} onClick={() => setText(sampleReport)}>sample</button>}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Text with indicators" className={`${area} min-h-48`} />
        </Panel>
        <Panel title="your ranges · flagged as internal">
          <textarea value={scope} onChange={(e) => setScope(e.target.value)} spellCheck={false} aria-label="CIDR ranges" className={`${area} min-h-48`} />
        </Panel>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setOff((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n })}
            disabled={!counts[t]}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition disabled:opacity-30 ${!off.has(t) && counts[t] ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
          >
            {t} {counts[t]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          <input type="checkbox" checked={hidePrivate} onChange={(e) => setHidePrivate(e.target.checked)} /> hide private
        </label>
        <label className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          <input type="checkbox" checked={fanged} onChange={(e) => setFanged(e.target.checked)} /> live (not defanged)
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title={`${rows.length} unique indicators`} actions={<CopyButton text={csv} label="copy CSV" />}>
          <ul className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {rows.map((i) => (
                <motion.li
                  key={i.type + i.value}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-3 py-1.5 font-mono text-[11px]"
                >
                  <span className="w-14 shrink-0 text-primary">{i.type}</span>
                  <span className="min-w-0 flex-1 break-all">{fanged ? i.value : defang(i.type, i.value)}</span>
                  {i.inScope && <span className="shrink-0 rounded bg-warn/15 px-1.5 text-[10px] text-warn">internal</span>}
                  {i.note && !i.inScope && <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{i.note}</span>}
                  {i.count > 1 && <span className="shrink-0 text-muted-foreground">×{i.count}</span>}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Panel>
        <Panel title={fanged ? "list · live" : "list · defanged"} actions={<CopyButton text={out} />}>
          <pre className="max-h-96 overflow-auto p-3 font-mono text-[11px] leading-5">{out}</pre>
        </Panel>
      </div>
      <Caveat>
        Refangs <code>hxxp</code>, <code>[.]</code>, <code>(dot)</code> and <code>[at]</code> before extracting, skips
        file names that look like domains (<code>stage2.ps1</code>), and labels private, documentation and reserved
        ranges. Pattern matching can still pick up false positives such as version strings; review before blocking
        anything. Nothing leaves your browser.
      </Caveat>
    </div>
  )
}
