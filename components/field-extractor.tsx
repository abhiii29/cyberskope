"use client"

import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { extract, samples } from "@/lib/lab/extract"
import { Caveat, CopyButton, Panel, SampleSelect, area } from "@/components/lab-ui"

export function FieldExtractor() {
  const reduce = useReducedMotion()
  const [line, setLine] = useState(samples[0].line)
  const r = useMemo(() => extract(line), [line])
  const json = JSON.stringify(Object.fromEntries(r.fields.map((f) => [f.key, f.value])), null, 2)

  return (
    <div className="space-y-4">
      <Panel title="raw log line" actions={<SampleSelect items={samples} onPick={(s) => setLine(s.line)} />}>
        <textarea value={line} onChange={(e) => setLine(e.target.value)} spellCheck={false} aria-label="Raw log" className={`${area} min-h-24`} />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title={
            <span>
              detected · <motion.span key={r.format} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="text-primary">{r.format}</motion.span>
            </span>
          }
        >
          {r.error && <p className="border-b border-border p-3 font-mono text-xs text-warn">{r.error}</p>}
          <table className="w-full font-mono text-xs">
            <tbody>
              {r.fields.map((f, i) => (
                <motion.tr
                  key={`${r.format}-${f.key}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.5) }}
                  className="border-b border-border/50 align-top"
                >
                  <td className="w-1/3 px-3 py-1.5 text-primary">{f.key}</td>
                  <td className="break-all py-1.5 pr-3">
                    {f.value}
                    {f.note && <span className="ml-2 rounded bg-violet/15 px-1.5 py-0.5 text-[10px] text-violet">{f.note}</span>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="as JSON" actions={<CopyButton text={json} />}>
          <pre className="max-h-[28rem] overflow-auto p-3 font-mono text-[11px] leading-5">{json}</pre>
        </Panel>
      </div>
      <Caveat>
        Recognises auditd (decoding hex <code>proctitle</code> and argument fields), syslog RFC 3164 and 5424 with
        structured data, CEF, LEEF, Windows event XML, JSON and generic <code>key=value</code>. Field names follow
        each format, not any SIEM&apos;s schema. Runs in your browser.
      </Caveat>
    </div>
  )
}
