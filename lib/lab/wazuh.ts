// A browser approximation of wazuh-logtest: pre-decoding of the syslog header,
// decoder matching (parent → child, prematch, regex → order fields) and rule
// matching (if_sid / decoded_as chains, match, regex, field). It follows the
// documented behaviour; edge cases of the real engine will differ.

import { compile } from "./osregex"

export type Predecoded = { timestamp?: string; hostname?: string; program_name?: string; log: string }

export function predecode(line: string): Predecoded {
  const bsd = line.match(/^([A-Z][a-z]{2} [ \d]\d \d\d:\d\d:\d\d) (\S+) ([^\s:[]+)(?:\[\d+\])?: (.*)$/)
  if (bsd) return { timestamp: bsd[1], hostname: bsd[2], program_name: bsd[3], log: bsd[4] }
  const iso = line.match(/^(\d{4}-\d\d-\d\dT\S+) (\S+) ([^\s:[]+)(?:\[\d+\])?: (.*)$/)
  if (iso) return { timestamp: iso[1], hostname: iso[2], program_name: iso[3], log: iso[4] }
  return { log: line }
}

type Pat = { text: string; type: "osregex" | "osmatch" | "pcre2"; offset?: string; name?: string; negate?: boolean }
type Decoder = { name: string; parent?: string; program_name?: Pat; prematch?: Pat; regex?: Pat; order: string[] }
type Rule = { id: string; level: number; description: string; if_sid: string[]; decoded_as?: string; program_name?: Pat; match: Pat[]; regex: Pat[]; fields: Pat[] }

export type Step = { ok: boolean; text: string }
export type LogtestResult = {
  pre: Predecoded
  decoder?: string
  fields: Record<string, string>
  rule?: { id: string; level: number; description: string }
  trace: Step[]
  errors: string[]
}

const pat = (el: Element | null, def: Pat["type"]): Pat | undefined =>
  el
    ? {
        text: el.textContent ?? "",
        type: (el.getAttribute("type") as Pat["type"]) || def,
        offset: el.getAttribute("offset") ?? undefined,
        name: el.getAttribute("name") ?? undefined,
        negate: el.getAttribute("negate") === "yes",
      }
    : undefined

function xml(text: string, root: string): { doc?: Document; error?: string } {
  const doc = new DOMParser().parseFromString(`<${root}>${text}</${root}>`, "application/xml")
  const err = doc.querySelector("parsererror")
  return err ? { error: err.textContent?.split("\n")[0] ?? "XML parse error" } : { doc }
}

export function parseDecoders(text: string): { decoders: Decoder[]; error?: string } {
  const { doc, error } = xml(text, "root")
  if (!doc) return { decoders: [], error }
  const decoders = [...doc.querySelectorAll("decoder")].map((d) => ({
    name: d.getAttribute("name") ?? "",
    parent: d.querySelector(":scope > parent")?.textContent ?? undefined,
    program_name: pat(d.querySelector(":scope > program_name"), "osmatch"),
    prematch: pat(d.querySelector(":scope > prematch"), "osregex"),
    regex: pat(d.querySelector(":scope > regex"), "osregex"),
    order: (d.querySelector(":scope > order")?.textContent ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  }))
  return { decoders }
}

export function parseRules(text: string): { rules: Rule[]; error?: string } {
  const { doc, error } = xml(text, "root")
  if (!doc) return { rules: [], error }
  const rules = [...doc.querySelectorAll("rule")].map((r) => ({
    id: r.getAttribute("id") ?? "",
    level: Number(r.getAttribute("level") ?? 0),
    description: r.querySelector(":scope > description")?.textContent ?? "",
    if_sid: (r.querySelector(":scope > if_sid")?.textContent ?? "").split(/[,\s]+/).filter(Boolean),
    decoded_as: r.querySelector(":scope > decoded_as")?.textContent ?? undefined,
    program_name: pat(r.querySelector(":scope > program_name"), "osmatch"),
    match: [...r.querySelectorAll(":scope > match")].map((e) => pat(e, "osmatch")!),
    regex: [...r.querySelectorAll(":scope > regex")].map((e) => pat(e, "osregex")!),
    fields: [...r.querySelectorAll(":scope > field")].map((e) => pat(e, "osregex")!),
  }))
  return { rules }
}

/** Run one pattern; returns the match (or null) and an error for bad patterns. */
function run(p: Pat, s: string): { m: RegExpExecArray | null; error?: string } {
  const c = compile(p.text, p.type === "pcre2" ? "pcre2" : p.type)
  if (c.error || !c.re) return { m: null, error: `${p.text}: ${c.error}` }
  let m = c.re.exec(s)
  if (c.negate) m = m ? null : (Object.assign([s], { index: 0, input: s }) as unknown as RegExpExecArray)
  if (p.negate) m = m ? null : (Object.assign([s], { index: 0, input: s }) as unknown as RegExpExecArray)
  return { m }
}

export function logtest(line: string, decText: string, ruleText: string): LogtestResult {
  const pre = predecode(line.trim())
  const trace: Step[] = []
  const errors: string[] = []
  const fields: Record<string, string> = {}
  const { decoders, error: de } = parseDecoders(decText)
  const { rules, error: re } = parseRules(ruleText)
  if (de) errors.push(`decoders: ${de}`)
  if (re) errors.push(`rules: ${re}`)
  trace.push({ ok: true, text: pre.program_name ? `pre-decoding: program_name "${pre.program_name}", hostname "${pre.hostname}"` : "pre-decoding: no syslog header, whole line is the log" })

  // Decoding: first matching parent, then its first matching child.
  const tryDec = (d: Decoder, s: string): { ok: boolean; end: number } => {
    if (d.program_name) {
      if (!pre.program_name || !run(d.program_name, pre.program_name).m) return { ok: false, end: 0 }
    }
    if (d.prematch) {
      const r = run(d.prematch, s)
      if (r.error) errors.push(r.error)
      if (!r.m) return { ok: false, end: 0 }
      return { ok: true, end: r.m.index + r.m[0].length }
    }
    return { ok: !!d.program_name, end: 0 }
  }
  let decoder: Decoder | undefined
  let prematchEnd = 0
  for (const d of decoders.filter((x) => !x.parent)) {
    const r = tryDec(d, pre.log)
    if (r.ok) {
      decoder = d
      prematchEnd = r.end
      trace.push({ ok: true, text: `decoder "${d.name}" matched${d.program_name ? " on program_name" : ""}${d.prematch ? " and prematch" : ""}` })
      break
    }
  }
  if (!decoder) trace.push({ ok: false, text: "no parent decoder matched" })
  let regexSrc = decoder
  let parentEnd = 0
  if (decoder) {
    parentEnd = prematchEnd
    for (const c of decoders.filter((x) => x.parent === decoder!.name)) {
      const base = c.prematch?.offset === "after_parent" ? parentEnd : 0
      if (c.prematch) {
        const r = run(c.prematch, pre.log.slice(base))
        if (r.error) errors.push(r.error)
        if (!r.m) continue
        prematchEnd = base + r.m.index + r.m[0].length
      } else if (!c.regex || !run(c.regex, pre.log.slice(c.regex.offset ? parentEnd : 0)).m) continue
      trace.push({ ok: true, text: `child decoder "${c.name}" matched` })
      regexSrc = c
      break
    }
    if (regexSrc?.regex) {
      const off = regexSrc.regex.offset
      const s = off === "after_prematch" ? pre.log.slice(prematchEnd) : off === "after_parent" ? pre.log.slice(parentEnd) : pre.log
      const r = run(regexSrc.regex, s)
      if (r.error) errors.push(r.error)
      if (r.m) {
        regexSrc.order.forEach((f, i) => r.m![i + 1] !== undefined && (fields[f] = r.m![i + 1]))
        trace.push({ ok: true, text: `regex extracted ${Object.keys(fields).length} field(s): ${Object.keys(fields).join(", ") || "none"}` })
      } else trace.push({ ok: false, text: `regex of "${regexSrc.name}" did not match${off ? ` (offset ${off})` : ""}` })
    }
  }

  // Rules: match roots, then follow if_sid children, keeping the deepest match.
  const fieldOf = (n: string) => fields[n] ?? (n === "program_name" ? pre.program_name : n === "hostname" ? pre.hostname : undefined)
  const ruleOk = (r: Rule): boolean => {
    if (r.decoded_as && r.decoded_as !== decoder?.name) return false
    if (r.program_name && !(pre.program_name && run(r.program_name, pre.program_name).m)) return false
    for (const p of r.match) if (!run(p, pre.log).m) return false
    for (const p of r.regex) {
      const x = run(p, pre.log)
      if (x.error) errors.push(x.error)
      if (!x.m) return false
    }
    for (const p of r.fields) {
      const v = fieldOf(p.name ?? "")
      if (v === undefined) return false
      const x = run(p, v)
      if (x.error) errors.push(x.error)
      if (!x.m) return false
    }
    return true
  }
  let current: Rule | undefined
  const roots = rules.filter((r) => r.if_sid.length === 0)
  current = roots.find(ruleOk)
  if (current) trace.push({ ok: true, text: `rule ${current.id} matched (level ${current.level})` })
  else trace.push({ ok: false, text: "no root rule matched" })
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    const parent: Rule = current
    const next = rules.find((r) => r.if_sid.includes(parent.id) && ruleOk(r))
    if (!next) break
    trace.push({ ok: true, text: `child rule ${next.id} matched via if_sid ${parent.id} (level ${next.level})` })
    current = next
  }
  if (pre.timestamp) fields.timestamp ??= pre.timestamp
  return {
    pre,
    decoder: decoder?.name,
    fields,
    rule: current && { id: current.id, level: current.level, description: current.description },
    trace,
    errors: [...new Set(errors)],
  }
}

export const sample = {
  log: "Sep 14 10:22:31 bastion-01 sshd[2211]: Failed password for root from 203.0.113.50 port 51122 ssh2",
  decoders: `<decoder name="sshd-lab">
  <program_name>^sshd</program_name>
</decoder>

<decoder name="sshd-lab-failed">
  <parent>sshd-lab</parent>
  <prematch>^Failed \\w+ for </prematch>
  <regex offset="after_prematch">^(\\S+) from (\\S+) port (\\d+)</regex>
  <order>srcuser, srcip, srcport</order>
</decoder>`,
  rules: `<group name="lab,sshd,">
  <rule id="100100" level="0">
    <decoded_as>sshd-lab</decoded_as>
    <description>sshd messages grouped</description>
  </rule>

  <rule id="100101" level="5">
    <if_sid>100100</if_sid>
    <match>Failed password</match>
    <description>sshd: authentication failed</description>
  </rule>

  <rule id="100102" level="10">
    <if_sid>100101</if_sid>
    <field name="srcuser">^root$</field>
    <description>sshd: failed login as root</description>
  </rule>
</group>`,
}
