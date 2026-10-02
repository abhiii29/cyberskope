"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { useReducedMotion } from "@/components/use-reduced-motion"
import { compile, type Dialect } from "@/lib/lab/osregex"
import { Caveat, Panel, SampleSelect, area } from "@/components/lab-ui"

const dialects: { id: Dialect; name: string; where: string }[] = [
  { id: "pcre2", name: "PCRE2", where: "Wazuh type=\"pcre2\", Sigma |re" },
  { id: "osregex", name: "OS_Regex", where: "Wazuh <regex>, <prematch>" },
  { id: "osmatch", name: "OS_Match", where: "Wazuh <match>, <program_name>" },
  { id: "splunk", name: "Splunk rex", where: "| rex, | regex" },
  { id: "kql", name: "KQL (RE2)", where: "matches regex, extract()" },
]

const samples = [
  { name: "sshd failed login", pattern: "Failed \\w+ for (\\S+) from (\\S+)", lines: "Failed password for root from 203.0.113.50 port 51122 ssh2\nFailed publickey for deploy from 10.0.4.12 port 40022 ssh2\nAccepted password for alice from 10.0.4.13 port 50211 ssh2" },
  { name: "named groups (rex)", pattern: "from (?<src_ip>\\d+\\.\\d+\\.\\d+\\.\\d+) port (?<src_port>\\d+)", lines: "Failed password for root from 203.0.113.50 port 51122 ssh2\nConnection closed by 10.0.4.12 port 40022" },
  { name: "lookahead (not RE2)", pattern: "password(?! for root)", lines: "Failed password for root from 203.0.113.50\nFailed password for alice from 10.0.4.13" },
  { name: "OS_Match alternation", pattern: "^Failed|^Invalid user", lines: "Failed password for root\nInvalid user admin from 198.51.100.7\nAccepted publickey for deploy" },
]

function Highlight({ line, m }: { line: string; m: RegExpExecArray }) {
  const end = m.index + m[0].length
  return (
    <>
      {line.slice(0, m.index)}
      <mark className="rounded bg-primary/25 px-0.5 text-foreground">{line.slice(m.index, end) || "∅"}</mark>
      {line.slice(end)}
    </>
  )
}

export function RegexTester() {
  const reduce = useReducedMotion()
  const [pattern, setPattern] = useState(samples[0].pattern)
  const [lines, setLines] = useState(samples[0].lines)
  const [ci, setCi] = useState(false)
  const rows = lines.split("\n")
  const results = useMemo(
    () =>
      dialects.map((d) => {
        const c = compile(pattern, d.id, ci ? "i" : "")
        const hits = rows.map((l) => {
          if (!c.re) return null
          c.re.lastIndex = 0
          const m = c.re.exec(l)
          return c.negate ? (m ? null : (Object.assign([l], { index: 0 }) as unknown as RegExpExecArray)) : m
        })
        return { d, c, hits }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pattern, lines, ci],
  )

  return (
    <div className="space-y-4">
      <Panel
        title="pattern"
        actions={
          <>
            <label className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <input type="checkbox" checked={ci} onChange={(e) => setCi(e.target.checked)} /> case-insensitive
            </label>
            <SampleSelect items={samples} onPick={(s) => (setPattern(s.pattern), setLines(s.lines))} />
          </>
        }
      >
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} aria-label="Pattern" className="w-full bg-transparent p-3 font-mono text-sm outline-none" />
      </Panel>
      <Panel title="sample lines · one per line">
        <textarea value={lines} onChange={(e) => setLines(e.target.value)} spellCheck={false} aria-label="Sample lines" className={`${area} min-h-24`} />
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {results.map(({ d, c, hits }, di) => {
          const n = hits.filter(Boolean).length
          return (
            <motion.div
              key={d.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.06 }}
              className={`flex min-w-0 flex-col rounded-xl border bg-card/60 ${c.error ? "border-danger/40" : "border-border"}`}
            >
              <div className="border-b border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{d.name}</span>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${c.error ? "bg-danger/15 text-danger" : n ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {c.error ? "unsupported" : `${n}/${rows.length}`}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">{d.where}</div>
              </div>
              <div className="flex-1 space-y-2 p-3">
                {c.error && <p className="font-mono text-[11px] text-danger">{c.error}</p>}
                {c.re &&
                  rows.map((l, i) => {
                    const m = hits[i]
                    return (
                      <div key={i} className={`break-all font-mono text-[11px] ${m ? "" : "opacity-40"}`}>
                        {m ? <Highlight line={l} m={m} /> : l}
                        {m && m.length > 1 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {(m.groups ? Object.entries(m.groups) : m.slice(1).map((g, k) => [`$${k + 1}`, g] as const)).map(([k, g]) => (
                              <span key={k} className="rounded bg-violet/15 px-1 text-[10px] text-violet">{k}={g ?? "∅"}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                {c.notes.map((x) => (
                  <p key={x} className="font-mono text-[10px] text-warn">! {x}</p>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
      <Caveat>
        Each pattern runs in the browser&apos;s regex engine after translation. OS_Regex and OS_Match follow
        Wazuh&apos;s documented syntax (no character classes, bare <code>.</code> is literal); PCRE2 and Splunk run as
        JavaScript regex, which lacks possessive and atomic groups; KQL is checked against RE2&apos;s limits.
        Treat it as a portability check, then test on the real platform.
      </Caveat>
    </div>
  )
}
