"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { useReducedMotion } from "@/components/use-reduced-motion"
import { logtest, sample } from "@/lib/lab/wazuh"
import { Caveat, Panel, area, chip } from "@/components/lab-ui"

export function Logtest() {
  const reduce = useReducedMotion()
  const [log, setLog] = useState(sample.log)
  const [dec, setDec] = useState(sample.decoders)
  const [rules, setRules] = useState(sample.rules)
  const r = useMemo(() => logtest(log, dec, rules), [log, dec, rules])

  return (
    <div className="space-y-4">
      <Panel title="log line" actions={<button className={chip} onClick={() => (setLog(sample.log), setDec(sample.decoders), setRules(sample.rules))}>reset sample</button>}>
        <input value={log} onChange={(e) => setLog(e.target.value)} spellCheck={false} aria-label="Log line" className="w-full bg-transparent p-3 font-mono text-xs outline-none" />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="local_decoder.xml">
          <textarea value={dec} onChange={(e) => setDec(e.target.value)} spellCheck={false} aria-label="Decoders" className={`${area} min-h-64`} />
        </Panel>
        <Panel title="local_rules.xml">
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} spellCheck={false} aria-label="Rules" className={`${area} min-h-64`} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel title="phases">
          <ol className="space-y-1.5 p-3">
            {r.trace.map((s, i) => (
              <motion.li
                key={`${i}-${s.text}`}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-2 font-mono text-xs"
              >
                <span className={s.ok ? "text-primary" : "text-danger"}>{s.ok ? "✓" : "✗"}</span>
                <span className="text-muted-foreground">{s.text}</span>
              </motion.li>
            ))}
            {r.errors.map((e) => (
              <li key={e} className="font-mono text-xs text-danger">! {e}</li>
            ))}
          </ol>
        </Panel>
        <Panel title="result">
          <div className="space-y-3 p-3">
            {r.rule ? (
              <div className={`rounded-lg border p-3 ${r.rule.level >= 10 ? "border-danger/50 bg-danger/10" : r.rule.level > 0 ? "border-warn/50 bg-warn/10" : "border-border"}`}>
                <div className="font-mono text-xs text-muted-foreground">rule {r.rule.id} · level {r.rule.level}{r.rule.level === 0 ? " (no alert)" : ""}</div>
                <div className="text-sm font-semibold">{r.rule.description}</div>
              </div>
            ) : (
              <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">No rule matched: this log would not alert.</div>
            )}
            <table className="w-full font-mono text-xs">
              <tbody>
                {[["decoder", r.decoder ?? "none"], ...(r.pre.program_name ? [["program_name", r.pre.program_name], ["hostname", r.pre.hostname ?? ""]] : []), ...Object.entries(r.fields)].map(([k, v]) => (
                  <tr key={k} className="border-b border-border/50">
                    <td className="py-1 pr-3 text-primary">{k}</td>
                    <td className="break-all py-1">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <Caveat>
        An approximation of <code>wazuh-logtest</code> written from the documented behaviour: syslog pre-decoding,
        parent and child decoders (<code>program_name</code>, <code>prematch</code>, <code>regex</code> with offsets,{" "}
        <code>order</code>) and rule chains (<code>if_sid</code>, <code>decoded_as</code>, <code>match</code>,{" "}
        <code>regex</code>, <code>field</code>). It doesn&apos;t load the stock ruleset, frequency rules, lists or
        <code> if_matched_sid</code>. Always confirm on a real manager with <code>wazuh-logtest</code> before shipping.
      </Caveat>
    </div>
  )
}
