// Pull indicators out of free text (reports, tickets, chat), refanging the
// usual obfuscations first, then classify, de-duplicate and defang them.

export type IocType = "url" | "domain" | "ipv4" | "ipv6" | "email" | "md5" | "sha1" | "sha256" | "cve"
export type Ioc = { type: IocType; value: string; note?: string; count: number }

export function refang(s: string) {
  return s
    .replace(/h[xX]{2}p(s?)/g, "http$1")
    .replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]|\(dot\)/gi, ".")
    .replace(/\[:\]|\[:\/\/\]/g, (m) => (m === "[:]" ? ":" : "://"))
    .replace(/\[(at|@)\]|\((at|@)\)/gi, "@")
}

export const defang = (t: IocType, v: string) =>
  t === "url" ? v.replace(/^http/i, "hxxp").replace(/\./g, "[.]")
    : t === "domain" || t === "ipv4" || t === "email" ? v.replace(/\./g, "[.]").replace("@", "[@]")
    : v

// Common file extensions that look like TLDs in "payload.sh" or "invoice.zip".
const NOT_TLD = new Set("exe dll sys bat cmd ps1 psm1 vbs js jse hta sh py pl rb php asp aspx jsp txt log json xml yml yaml ini cfg conf csv doc docx xls xlsx xlsm ppt pptx pdf rtf zip rar 7z gz tgz tar iso img lnk msi jar bin dat tmp bak html htm png jpg jpeg gif svg md".split(" "))

function ipv4Note(ip: string): string | undefined {
  const o = ip.split(".").map(Number)
  if (o.some((x) => x > 255)) return "invalid"
  const [a, b, c] = o
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return "private (RFC 1918)"
  if (a === 127) return "loopback"
  if (a === 169 && b === 254) return "link-local"
  if (a === 100 && b >= 64 && b <= 127) return "carrier-grade NAT"
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return "documentation range"
  if (a >= 224 && a <= 239) return "multicast"
  if (a === 0 || a >= 240) return "reserved"
}

const toInt = (ip: string) => ip.split(".").reduce((x, o) => (x << 8) + Number(o), 0) >>> 0
export function inCidr(ip: string, cidr: string) {
  const [net, bits = "32"] = cidr.trim().split("/")
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(net)) return false
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0
  return (toInt(ip) & mask) === (toInt(net) & mask)
}

export function extractIocs(text: string): Ioc[] {
  const s = refang(text)
  const found = new Map<string, Ioc>()
  const add = (type: IocType, value: string, note?: string) => {
    if (type !== "url" && type !== "cve") value = value.toLowerCase()
    const k = `${type}|${value}`
    const e = found.get(k)
    if (e) e.count++
    else found.set(k, { type, value, note, count: 1 })
  }
  const urls = [...s.matchAll(/\b(?:https?|ftp):\/\/[^\s"'<>()[\]{}]+/gi)].map((m) => m[0].replace(/[.,;:!?]+$/, ""))
  urls.forEach((u) => add("url", u))
  // Strip URLs so their hosts aren't double-counted as bare domains.
  let rest = s.replace(/\b(?:https?|ftp):\/\/[^\s"'<>()[\]{}]+/gi, " ")
  for (const m of rest.matchAll(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g)) add("email", m[0])
  rest = rest.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, " ")
  for (const m of rest.matchAll(/\bCVE-\d{4}-\d{4,7}\b/gi)) add("cve", m[0].toUpperCase())
  for (const m of rest.matchAll(/\b[a-f0-9]{64}\b/gi)) add("sha256", m[0])
  for (const m of rest.matchAll(/\b[a-f0-9]{40}\b/gi)) add("sha1", m[0])
  for (const m of rest.matchAll(/\b[a-f0-9]{32}\b/gi)) add("md5", m[0])
  for (const m of rest.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g)) {
    const ip = m[0].split("/")[0]
    const note = ipv4Note(ip)
    if (note !== "invalid") add("ipv4", m[0], note)
  }
  for (const m of rest.matchAll(/(?<![\w:])(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{0,4}(?:::?[0-9a-f]{1,4})*(?![\w:])/gi))
    if (m[0].includes("::") || m[0].split(":").length === 8) add("ipv6", m[0], /^fe80|^fc|^fd|^::1$/i.test(m[0]) ? "non-public" : undefined)
  for (const m of rest.matchAll(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,24})\b/gi)) {
    if (NOT_TLD.has(m[1].toLowerCase())) continue
    if (/^\d+(\.\d+)+$/.test(m[0])) continue
    add("domain", m[0])
  }
  const order: IocType[] = ["url", "domain", "ipv4", "ipv6", "email", "sha256", "sha1", "md5", "cve"]
  return [...found.values()].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.value.localeCompare(b.value))
}

export const sampleReport = `Incident 2026-0914 summary (shared in chat, defanged):

Initial access via phishing from billing@invoices-secure[.]com, link hxxps://cdn-update[.]net/dl/inv_0914.zip
Payload dropped stage2.ps1 which beaconed to 203.0.113[.]50:443 and 198.51.100.7, falling back to
update-check[.]example-cdn[.]org. Internal pivot from 10.0.4.12 to 10.0.9.3 over SMB.

Hashes:
  inv_0914.zip  sha256 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
  stage2.ps1    md5 5d41402abc4b2a76b9719d911017c592
Exploited CVE-2024-3400 on the edge gateway. Seen again: 203.0.113[.]50.`
