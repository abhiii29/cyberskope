// Detect a raw log line's format and break it into fields. Covers the formats
// a SIEM engineer sees daily: auditd (with hex decoding), RFC 3164/5424
// syslog, CEF, LEEF, Windows event XML, JSON and generic key=value.

export type Field = { key: string; value: string; note?: string }
export type Extracted = { format: string; fields: Field[]; error?: string }

const FAC = ["kern", "user", "mail", "daemon", "auth", "syslog", "lpr", "news", "uucp", "cron", "authpriv", "ftp", "ntp", "audit", "alert", "clock", "local0", "local1", "local2", "local3", "local4", "local5", "local6", "local7"]
const SEV = ["emerg", "alert", "crit", "err", "warning", "notice", "info", "debug"]

const isHex = (v: string) => v.length >= 8 && v.length % 2 === 0 && /^[0-9A-F]+$/.test(v)
const hexDecode = (v: string) =>
  v.match(/../g)!.map((b) => String.fromCharCode(parseInt(b, 16))).join("").replace(/\0/g, " ").trim()

/** key=value pairs; values may be "quoted" or 'quoted'. */
export function kv(s: string, sep = /\s+/): Field[] {
  const out: Field[] = []
  const re = /([A-Za-z_][\w.:-]*)=("([^"]*)"|'([^']*)'|(\S*))/g
  let m: RegExpExecArray | null
  void sep
  while ((m = re.exec(s))) out.push({ key: m[1], value: m[3] ?? m[4] ?? m[5] ?? "" })
  return out
}

function auditd(line: string): Extracted {
  const fields: Field[] = []
  const head = line.match(/type=(\S+) msg=audit\((\d+)\.(\d+):(\d+)\):\s*/)
  if (head) {
    fields.push({ key: "type", value: head[1] })
    fields.push({ key: "timestamp", value: new Date(Number(head[2]) * 1000 + Number(head[3])).toISOString(), note: `epoch ${head[2]}.${head[3]}` })
    fields.push({ key: "serial", value: head[4], note: "joins records of the same event" })
  }
  const rest = head ? line.slice(line.indexOf(head[0]) + head[0].length) : line
  for (const f of kv(rest)) {
    if (f.key === "type") continue
    const quoted = new RegExp(`${f.key}="`).test(rest)
    if (!quoted && isHex(f.value) && /^(proctitle|a\d+|cmd|exe|comm|name|cwd|path|data)$/.test(f.key))
      fields.push({ key: f.key, value: hexDecode(f.value), note: "hex-decoded" })
    else fields.push(f)
  }
  // Nested msg='...' blocks on USER_* records hold their own key=value pairs.
  const inner = rest.match(/msg='([^']*)'/)
  if (inner) for (const f of kv(inner[1])) fields.push({ ...f, key: `msg.${f.key}` })
  return { format: "auditd", fields: fields.filter((f) => f.key !== "msg") }
}

function pri(p: string): Field[] {
  const n = Number(p)
  return [
    { key: "pri", value: p },
    { key: "facility", value: FAC[n >> 3] ?? String(n >> 3) },
    { key: "severity", value: SEV[n & 7] },
  ]
}

function cef(line: string): Extracted {
  const start = line.indexOf("CEF:")
  const pre = line.slice(0, start).trim()
  const parts: string[] = []
  let cur = "", i = start + 4
  for (; i < line.length && parts.length < 7; i++) {
    if (line[i] === "\\" && i + 1 < line.length) cur += line[++i]
    else if (line[i] === "|") parts.push(cur), (cur = "")
    else cur += line[i]
  }
  const names = ["version", "device_vendor", "device_product", "device_version", "signature_id", "name", "severity"]
  const fields: Field[] = pre ? [{ key: "syslog_prefix", value: pre }] : []
  parts.forEach((v, k) => fields.push({ key: names[k], value: v }))
  // Extension: key=value where values run until the next " key=".
  const ext = line.slice(i)
  const re = /(\w+)=((?:\\=|[^=])*?)(?=\s+\w+=|$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(ext))) fields.push({ key: m[1], value: m[2].replace(/\\=/g, "=").trim() })
  return { format: "CEF", fields }
}

function leef(line: string): Extracted {
  const start = line.indexOf("LEEF:")
  const p = line.slice(start + 5).split("|")
  const v2 = p[0].startsWith("2")
  const names = ["version", "vendor", "product", "product_version", "event_id"]
  const fields: Field[] = names.map((n, k) => ({ key: n, value: p[k] ?? "" }))
  const delim = v2 && p[5] && p[5].length <= 4 ? (p[5].startsWith("x") ? String.fromCharCode(parseInt(p[5].slice(1), 16)) : p[5]) : "\t"
  const attrs = p.slice(v2 ? 6 : 5).join("|")
  for (const pair of attrs.split(delim)) {
    const eq = pair.indexOf("=")
    if (eq > 0) fields.push({ key: pair.slice(0, eq), value: pair.slice(eq + 1) })
  }
  return { format: `LEEF ${p[0]}`, fields }
}

function windowsXml(line: string): Extracted {
  const doc = new DOMParser().parseFromString(line.replace(/xmlns="[^"]*"/, ""), "application/xml")
  if (doc.querySelector("parsererror")) return { format: "Windows event XML", fields: [], error: "invalid XML" }
  const fields: Field[] = []
  const sys = doc.querySelector("System")
  const get = (sel: string, attr?: string) => {
    const el = sys?.querySelector(sel)
    return el ? (attr ? el.getAttribute(attr) ?? "" : el.textContent ?? "") : undefined
  }
  const add = (key: string, value?: string, note?: string) => value !== undefined && value !== "" && fields.push({ key, value, note })
  add("provider", get("Provider", "Name"))
  add("event_id", get("EventID"))
  add("channel", get("Channel"))
  add("computer", get("Computer"))
  add("time_created", get("TimeCreated", "SystemTime"))
  add("record_id", get("EventRecordID"))
  add("process_id", get("Execution", "ProcessID"))
  add("user_sid", get("Security", "UserID"))
  doc.querySelectorAll("EventData > Data, UserData *").forEach((d, i) => {
    if (d.children.length) return
    add(`event_data.${d.getAttribute("Name") ?? d.tagName ?? `data${i}`}`, d.textContent ?? "")
  })
  return { format: "Windows event XML", fields }
}

const flat = (o: unknown, p = "", out: Field[] = []): Field[] => {
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out)
  else out.push({ key: p || "value", value: String(o) })
  return out
}

export function extract(raw: string): Extracted {
  const line = raw.trim()
  if (!line) return { format: "empty", fields: [] }
  try {
    if (line.startsWith("{") || line.startsWith("[")) return { format: "JSON", fields: flat(JSON.parse(line)) }
  } catch (e) {
    return { format: "JSON", fields: [], error: (e as Error).message }
  }
  if (line.startsWith("<Event")) return windowsXml(line)
  if (/type=\S+ msg=audit\(/.test(line)) return auditd(line)
  if (line.includes("CEF:")) return cef(line)
  if (line.includes("LEEF:")) return leef(line)

  const r5424 = line.match(/^<(\d{1,3})>1 (\S+) (\S+) (\S+) (\S+) (\S+) (-|\[.*?\](?:\[.*?\])*)\s?(.*)$/)
  if (r5424) {
    const fields: Field[] = [...pri(r5424[1])]
    ;["timestamp", "hostname", "app_name", "procid", "msgid"].forEach((k, i) => r5424[i + 2] !== "-" && fields.push({ key: k, value: r5424[i + 2] }))
    if (r5424[7] !== "-")
      for (const sd of r5424[7].matchAll(/\[(\S+)((?:\s+[^\]=]+="[^"]*")*)\]/g))
        for (const f of kv(sd[2])) fields.push({ key: `sd.${sd[1]}.${f.key}`, value: f.value })
    fields.push({ key: "message", value: r5424[8] })
    for (const f of kv(r5424[8])) fields.push({ ...f, key: `message.${f.key}`, note: "key=value inside message" })
    return { format: "syslog RFC 5424", fields }
  }
  const r3164 = line.match(/^(?:<(\d{1,3})>)?([A-Z][a-z]{2} [ \d]\d \d\d:\d\d:\d\d) (\S+) ([^\s:[]+)(?:\[(\d+)\])?: ?(.*)$/)
  if (r3164) {
    const fields: Field[] = r3164[1] ? pri(r3164[1]) : []
    fields.push({ key: "timestamp", value: r3164[2], note: "no year or zone in RFC 3164" })
    fields.push({ key: "hostname", value: r3164[3] })
    fields.push({ key: "program", value: r3164[4] })
    if (r3164[5]) fields.push({ key: "pid", value: r3164[5] })
    fields.push({ key: "message", value: r3164[6] })
    for (const f of kv(r3164[6])) fields.push({ ...f, key: `message.${f.key}`, note: "key=value inside message" })
    return { format: "syslog RFC 3164", fields }
  }
  const pairs = kv(line)
  if (pairs.length >= 2) return { format: "key=value", fields: pairs }
  return { format: "unstructured", fields: [{ key: "message", value: line }], error: "no known structure; a custom decoder is needed" }
}

export const samples: { name: string; line: string }[] = [
  { name: "auditd EXECVE (hex)", line: 'type=PROCTITLE msg=audit(1789381351.442:8812): proctitle=2F62696E2F7368002D630063686D6F64202B78202F746D702F78' },
  { name: "auditd SYSCALL", line: 'type=SYSCALL msg=audit(1789381351.442:8812): arch=c000003e syscall=59 success=yes exit=0 a0=55d1 ppid=1201 pid=1388 auid=1000 uid=0 gid=0 euid=0 tty=pts0 ses=4 comm="sh" exe="/usr/bin/dash" key="uc_105_exec"' },
  { name: "syslog RFC 3164", line: "<38>Sep 14 10:22:31 bastion-01 sshd[2211]: Failed password for root from 203.0.113.50 port 51122 ssh2" },
  { name: "syslog RFC 5424", line: '<165>1 2026-09-14T10:22:31.003Z fw-01 firewall 811 ID47 [meta@32473 zone="dmz" rule="12"] action=deny src=198.51.100.7 dst=10.0.4.12 dport=3389' },
  { name: "CEF", line: "CEF:0|Security|threatmanager|1.0|100|worm successfully stopped|10|src=10.0.0.1 dst=2.1.2.2 spt=1232 msg=Detected a worm on host A" },
  { name: "Windows 4625 XML", line: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>4625</EventID><TimeCreated SystemTime="2026-09-14T10:22:31.1234567Z"/><EventRecordID>99120</EventRecordID><Channel>Security</Channel><Computer>dc-01.corp.example</Computer></System><EventData><Data Name="TargetUserName">svc_backup</Data><Data Name="LogonType">3</Data><Data Name="IpAddress">198.51.100.23</Data><Data Name="SubStatus">0xc000006a</Data></EventData></Event>' },
  { name: "JSON", line: '{"timestamp":"2026-09-14T10:22:31Z","agent":{"name":"app-01"},"rule":{"id":"5715","level":3},"data":{"srcuser":"deploy"}}' },
]
