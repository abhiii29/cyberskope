// Target renderers. Each one returns the query plus the diagnostics that say
// where the translation stopped being faithful.

import {
  cidrToRegex, hasWild, reEscape, shape, strToRegex, walkLeaves,
  type Diagnostic, type Leaf, type Node, type Rule, type Str, type Value,
} from "./sigma"

export type FieldStatus = "mapped" | "derived" | "identity" | "unmapped"
export type FieldRow = { sigma: string; target: string; status: FieldStatus }
export type Output = { query: string; diagnostics: Diagnostic[]; fields: FieldRow[]; lang: string }
export type Target = { id: string; name: string; convert: (r: Rule) => Output }

type Mapper = (field: string, r: Rule) => FieldRow
type LeafRenderer = (field: string, v: Value, d: Diagnostic[]) => string

const cat = (r: Rule) => r.logsource.category ?? ""
const prod = (r: Rule) => r.logsource.product ?? ""

function mapFields(r: Rule, mapper: Mapper, d: Diagnostic[], targetName: string): Map<string, FieldRow> {
  const rows = new Map(r.fields.map((f) => [f, mapper(f, r)]))
  const un = [...rows.values()].filter((x) => x.status === "unmapped").map((x) => x.sigma)
  if (un.length)
    d.push({
      severity: "warning",
      code: "fields.unmapped",
      message: `${un.length} field(s) have no ${targetName} mapping and were left as-is: ${un.join(", ")}. The query will run cleanly and may never fire.`,
      hint: "Confirm these names exist in the target schema.",
    })
  return rows
}

/** Render a boolean tree for targets with and/or/not syntax. */
function renderBool(
  n: Node, rows: Map<string, FieldRow>, leaf: LeafRenderer, d: Diagnostic[],
  ops: { and: string; or: string; not: (s: string) => string; keyword: (s: Str) => string },
): string {
  const rec = (x: Node, top = false): string => {
    if (x.type === "leaf") {
      const parts = x.values.map((v) =>
        x.field === null ? ops.keyword(v as Str) : leaf(rows.get(x.field)!.target, v, d),
      )
      if (parts.length === 1) return parts[0]
      return `(${parts.join(x.all ? ops.and : ops.or)})`
    }
    if (x.type === "not") return ops.not(rec(x.arg))
    const s = x.args.map((a) => rec(a)).join(x.type === "and" ? ops.and : ops.or)
    return top || x.args.length === 1 ? s : `(${s})`
  }
  return rec(n, true)
}

// ------------------------------------------------------------------ Splunk
const splunkQuote = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`

const splunk: Target = {
  id: "splunk",
  name: "Splunk",
  convert(r) {
    const d: Diagnostic[] = []
    const rows = mapFields(r, (f) => ({ sigma: f, target: f, status: "identity" }), d, "Splunk")
    if (r.fields.length)
      d.push({ severity: "info", code: "fields.identity_mapping", message: "Field names passed through unchanged (Sysmon TA naming). Use a CIM pipeline if your data is CIM-normalised." })

    // Regex can only live in a trailing `| regex`, so it must be ANDed at the top level.
    const pipes: string[] = []
    let tree: Node | null = r.tree
    const isRe = (x: Node): x is Leaf => x.type === "leaf" && x.field !== null && x.values.every((v) => v.kind === "re")
    const reClause = (l: Leaf) => {
      const pats = l.values.map((v) => (v as { pattern: string }).pattern)
      return `| regex ${rows.get(l.field!)!.target}=${splunkQuote(pats.length > 1 ? `(?:${pats.join(")|(?:")})` : pats[0])}`
    }
    if (tree.type === "and" && tree.args.some(isRe)) {
      tree.args.filter(isRe).forEach((l) => pipes.push(reClause(l)))
      const rest = tree.args.filter((a) => !isRe(a))
      tree = rest.length ? (rest.length === 1 ? rest[0] : { type: "and", args: rest }) : null
    } else if (isRe(tree)) {
      pipes.push(reClause(tree))
      tree = null
    }
    let nestedRe = false
    const leaf: LeafRenderer = (f, v) => {
      switch (v.kind) {
        case "str":
          if (v.parts.some((p) => "wild" in p && p.wild === "?"))
            d.push({ severity: "warning", code: "lossy.single_wildcard", message: `${f}: Splunk has no single-character wildcard; '?' widened to '*'.` })
          return `${f}=${splunkQuote(v.parts.map((p) => ("lit" in p ? p.lit : "*")).join(""))}`
        case "num": return `${f}${{ gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=" }[v.op]}${v.n}`
        case "cidr": return `${f}=${splunkQuote(v.cidr)}`
        case "null": return `NOT ${f}=*`
        case "re": nestedRe = true; return `${f}=${splunkQuote("<regex not expressible here>")}`
      }
    }
    const search = tree
      ? renderBool(tree, rows, leaf, d, { and: " ", or: " OR ", not: (s) => `NOT ${s}`, keyword: (s) => splunkQuote(s.parts.map((p) => ("lit" in p ? p.lit : "*")).join("")) })
      : "*"
    if (nestedRe)
      d.push({ severity: "error", code: "lossy.re", message: "A regex sits inside OR/NOT. Splunk search has no regex operator, and `| regex` can only be ANDed.", hint: "Restructure the condition or use `| where match()` by hand." })
    d.push({ severity: "info", code: "target.splunk_index", message: "The search has no index scope. Prefix it with index=… before scheduling." })
    return { query: [search, ...pipes].join("\n"), diagnostics: d, fields: [...rows.values()], lang: "spl" }
  },
}

// ------------------------------------------------------------------ Elastic (Lucene, ECS)
const ECS: Record<string, string> = {
  Image: "process.executable", CommandLine: "process.command_line", ParentImage: "process.parent.executable",
  ParentCommandLine: "process.parent.command_line", OriginalFileName: "process.pe.original_file_name",
  ProcessId: "process.pid", CurrentDirectory: "process.working_directory", User: "user.name",
  IntegrityLevel: "winlog.event_data.IntegrityLevel", Hashes: "process.hash.sha256",
  TargetObject: "registry.path", Details: "registry.data.strings", TargetFilename: "file.path",
  DestinationIp: "destination.ip", DestinationPort: "destination.port", DestinationHostname: "destination.domain",
  SourceIp: "source.ip", SourcePort: "source.port", Protocol: "network.transport", QueryName: "dns.question.name",
  EventID: "event.code", TargetUserName: "user.target.name", SubjectUserName: "user.name", IpAddress: "source.ip",
  LogonType: "winlog.logon.type", ScriptBlockText: "powershell.file.script_block_text",
}
const luceneEsc = (s: string) => s.replace(/([+\-=&|><!(){}[\]^"~*?:\\/\s])/g, "\\$1")

const elastic: Target = {
  id: "elastic",
  name: "Elastic",
  convert(r) {
    const d: Diagnostic[] = []
    const rows = mapFields(r, (f) => (ECS[f] ? { sigma: f, target: ECS[f], status: "mapped" } : { sigma: f, target: f, status: "unmapped" }), d, "ECS")
    let caseNote = false, leadNote = false
    const str = (s: Str) => {
      if (hasWild(s)) caseNote = true
      if ("wild" in s.parts[0]) leadNote = true
      return s.parts.map((p) => ("lit" in p ? luceneEsc(p.lit) : p.wild)).join("")
    }
    const leaf: LeafRenderer = (f, v) => {
      switch (v.kind) {
        case "str": return `${f}:${str(v)}`
        case "num": return v.op === "eq" ? `${f}:${v.n}` : `${f}:${{ gt: ">", gte: ">=", lt: "<", lte: "<=" }[v.op]}${v.n}`
        case "cidr":
          d.push({ severity: "info", code: "target.cidr_field_type", message: `${f}: CIDR matching only works if the field is mapped as type ip.` })
          return `${f}:${luceneEsc(v.cidr)}`
        case "null": return `NOT _exists_:${f}`
        case "re": {
          let p = v.pattern
          if (/\\[dwsbDWSB]|\(\?|\\[AZz]/.test(p))
            d.push({ severity: "warning", code: "lossy.re", message: `${f}: Lucene regex has no \\d, \\w, \\s, \\b or inline flags; the pattern '${v.pattern}' will not behave as written.`, hint: "Rewrite with character classes, e.g. [0-9] instead of \\d." })
          // Lucene regex is implicitly anchored; Sigma's is a search.
          p = (p.startsWith("^") ? p.slice(1) : ".*" + p)
          p = p.endsWith("$") ? p.slice(0, -1) : p + ".*"
          return `${f}:/${p.replace(/\//g, "\\/")}/`
        }
      }
    }
    const query = renderBool(r.tree, rows, leaf, d, { and: " AND ", or: " OR ", not: (s) => `NOT ${s}`, keyword: (s) => `"${s.parts.map((p) => ("lit" in p ? p.lit : "")).join("").replace(/"/g, '\\"')}"` })
    if (caseNote) d.push({ severity: "info", code: "target.keyword_case", message: "Wildcard matches on keyword fields are case-sensitive in Elasticsearch; Sigma's are not." })
    if (leadNote) d.push({ severity: "info", code: "target.leading_wildcard", message: "Leading wildcards are expensive on large indices; consider a wildcard-typed field." })
    return { query, diagnostics: d, fields: [...rows.values()], lang: "lucene" }
  },
}

// ------------------------------------------------------------------ Microsoft Sentinel / Defender (KQL)
const KQL_BASE: Record<string, string> = {
  Image: "FolderPath", CommandLine: "ProcessCommandLine", ParentImage: "InitiatingProcessFolderPath",
  ParentCommandLine: "InitiatingProcessCommandLine", OriginalFileName: "ProcessVersionInfoOriginalFileName",
  User: "AccountName", ProcessId: "ProcessId", IntegrityLevel: "ProcessIntegrityLevel",
  TargetObject: "RegistryKey", Details: "RegistryValueData", TargetFilename: "FolderPath",
  DestinationIp: "RemoteIP", DestinationPort: "RemotePort", DestinationHostname: "RemoteUrl",
  SourceIp: "LocalIP", SourcePort: "LocalPort", QueryName: "RemoteUrl",
  EventID: "EventID", TargetUserName: "TargetUserName", SubjectUserName: "SubjectUserName", IpAddress: "IpAddress", LogonType: "LogonType",
}
function kqlTable(r: Rule): string {
  const c = cat(r)
  if (c === "process_creation") return "DeviceProcessEvents"
  if (c === "network_connection") return "DeviceNetworkEvents"
  if (c.startsWith("registry")) return "DeviceRegistryEvents"
  if (c.startsWith("file")) return "DeviceFileEvents"
  if (c === "image_load") return "DeviceImageLoadEvents"
  if (prod(r) === "windows") return "SecurityEvent"
  if (prod(r) === "linux") return "Syslog"
  return ""
}
const kqlStr = (s: string) => `@"${s.replace(/"/g, '""')}"`

const sentinel: Target = {
  id: "sentinel",
  name: "Sentinel",
  convert(r) {
    const d: Diagnostic[] = []
    const table = kqlTable(r)
    const onProcTable = ["DeviceNetworkEvents", "DeviceRegistryEvents", "DeviceFileEvents", "DeviceImageLoadEvents"].includes(table)
    const rows = mapFields(r, (f) => {
      // On non-process tables the acting process is the "initiating" one.
      if (f === "Image" && onProcTable) return { sigma: f, target: "InitiatingProcessFolderPath", status: "mapped" }
      if (f === "CommandLine" && onProcTable) return { sigma: f, target: "InitiatingProcessCommandLine", status: "mapped" }
      return KQL_BASE[f] ? { sigma: f, target: KQL_BASE[f], status: "mapped" } : { sigma: f, target: f, status: "unmapped" }
    }, d, "Sentinel")
    if (!table) d.push({ severity: "warning", code: "target.kusto_table", message: "No table is known for this log source; replace <Table> by hand." })
    const leaf: LeafRenderer = (f, v) => {
      switch (v.kind) {
        case "str": {
          const s = shape(v)
          if (s.op === "eq") return `${f} =~ ${kqlStr(s.text)}`
          if (s.op === "wild") return `${f} matches regex ${kqlStr("(?i)" + strToRegex(v))}`
          return `${f} ${s.op} ${kqlStr(s.text)}`
        }
        case "num": return `${f} ${{ gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "==" }[v.op]} ${v.n}`
        case "cidr": return `ipv4_is_in_range(${f}, "${v.cidr}")`
        case "null": return `isempty(${f})`
        case "re": return `${f} matches regex ${kqlStr(v.pattern)}`
      }
    }
    const where = renderBool(r.tree, rows, leaf, d, { and: " and ", or: " or ", not: (s) => `not(${s})`, keyword: (s) => `* contains ${kqlStr(s.parts.map((p) => ("lit" in p ? p.lit : "")).join(""))}` })
    return { query: `${table || "<Table>"}\n| where ${where}`, diagnostics: d, fields: [...rows.values()], lang: "kql" }
  },
}

// ------------------------------------------------------------------ CrowdStrike Falcon LogScale
const FALCON: Record<string, string> = {
  Image: "ImageFileName", CommandLine: "CommandLine", ParentImage: "ParentBaseFileName", ParentCommandLine: "ParentCommandLine",
  OriginalFileName: "OriginalFilename", User: "UserName", ProcessId: "TargetProcessId", TargetObject: "RegObjectName",
  TargetFilename: "TargetFileName", DestinationIp: "RemoteAddressIP4", DestinationPort: "RemotePort",
  SourceIp: "LocalAddressIP4", SourcePort: "LocalPort", QueryName: "DomainName",
}
const EVENT_NAME: Record<string, string> = {
  process_creation: "ProcessRollup2", network_connection: "NetworkConnectIP4", dns_query: "DnsRequest",
  registry_set: "AsepValueUpdate", file_event: "NewExecutableWritten",
}

const logscale: Target = {
  id: "logscale",
  name: "LogScale",
  convert(r) {
    const d: Diagnostic[] = []
    const rows = mapFields(r, (f) => {
      if (f === "ParentImage")
        return { sigma: f, target: "ParentBaseFileName", status: "derived" }
      return FALCON[f] ? { sigma: f, target: FALCON[f], status: "mapped" } : { sigma: f, target: f, status: "unmapped" }
    }, d, "Falcon")
    if (r.fields.includes("ParentImage"))
      d.push({ severity: "warning", code: "lossy.parent_path", message: "Falcon records only the parent's file name, not its path. ParentImage path checks are matched against the base name and may over- or under-match." })
    const leaf: LeafRenderer = (f, v) => {
      switch (v.kind) {
        case "str": return `${f}=/${strToRegex(v).replace(/\//g, "\\/")}/i`
        case "num": return v.op === "eq" ? `${f}=${v.n}` : `test(${f} ${{ gt: ">", gte: ">=", lt: "<", lte: "<=" }[v.op]} ${v.n})`
        case "cidr": return `cidr(${f}, subnet="${v.cidr}")`
        case "null": return `${f}!=*`
        case "re": return `${f}=/${v.pattern.replace(/\//g, "\\/")}/`
      }
    }
    const body = renderBool(r.tree, rows, leaf, d, { and: " ", or: " or ", not: (s) => `not ${s}`, keyword: (s) => `/${s.parts.map((p) => ("lit" in p ? reEscape(p.lit) : ".*")).join("")}/i` })
    const ev = EVENT_NAME[cat(r)]
    if (!ev) d.push({ severity: "info", code: "target.event_name", message: "No #event_simpleName is known for this log source; the query scans all events." })
    return { query: (ev ? `#event_simpleName=${ev}\n` : "") + body, diagnostics: d, fields: [...rows.values()], lang: "cql" }
  },
}

// ------------------------------------------------------------------ Wazuh (port of RuleBridge's backend)
const WIN_EXPLICIT: Record<string, string> = {
  EventID: "win.system.eventID", Channel: "win.system.channel", Provider_Name: "win.system.providerName",
  Computer: "win.system.computer", Level: "win.system.level", Message: "win.system.message",
}
const WIN_VERIFIED = new Set(
  ("Image CommandLine ParentImage ParentCommandLine OriginalFileName CurrentDirectory User LogonId IntegrityLevel Hashes " +
    "ProcessId ParentProcessId ParentUser Description Product Company DestinationIp DestinationPort DestinationHostname " +
    "SourceIp SourcePort Protocol Initiated ImageLoaded Signature Signed SourceImage TargetImage GrantedAccess CallTrace " +
    "TargetFilename TargetObject Details NewName EventType PipeName QueryName QueryStatus QueryResults SubjectUserName " +
    "SubjectDomainName TargetUserName TargetDomainName LogonType IpAddress IpPort WorkstationName ProcessName ServiceName " +
    "ServiceFileName ObjectName AccessMask Status SubStatus MemberName GroupName ScriptBlockText Payload HostApplication").split(" "),
)
const LINUX_EXPLICIT: Record<string, string> = {
  Image: "audit.exe", CommandLine: "audit.command", User: "audit.auid", CurrentDirectory: "audit.cwd",
  ProcessId: "audit.pid", type: "audit.type", syscall: "audit.syscall", exe: "audit.exe", key: "audit.key",
}
const ANCHORS: [string, string, string, string][] = [
  // product, category, service, anchor
  ["windows", "process_creation", "", "if_sid:61603"], ["windows", "network_connection", "", "if_sid:61605"],
  ["windows", "image_load", "", "if_sid:61609"], ["windows", "process_access", "", "if_sid:61612"],
  ["windows", "file_event", "", "if_sid:61613"], ["windows", "registry_set", "", "if_sid:61615"],
  ["windows", "registry_add", "", "if_sid:61614"], ["windows", "registry_event", "", "if_sid:61614,61615,61616"],
  ["windows", "pipe_created", "", "if_sid:61618"], ["windows", "dns_query", "", "if_sid:61644"],
  ["windows", "", "security", "if_group:windows_security"], ["windows", "", "sysmon", "if_group:sysmon"],
  ["windows", "", "", "if_group:windows"], ["linux", "process_creation", "", "if_group:audit_command"],
  ["linux", "", "auditd", "if_group:audit"], ["linux", "", "sshd", "if_group:sshd"], ["linux", "", "", "if_group:syslog"],
]
const WAZUH_LEVEL: Record<string, number> = { informational: 3, low: 5, medium: 7, high: 10, critical: 12 }
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

type NLeaf = { leaf: Leaf; neg: boolean }

const wazuh: Target = {
  id: "wazuh",
  name: "Wazuh",
  convert(r) {
    const d: Diagnostic[] = []
    const p = prod(r)
    const rows = mapFields(r, (f) => {
      if (p === "windows") {
        if (WIN_EXPLICIT[f]) return { sigma: f, target: WIN_EXPLICIT[f], status: "mapped" }
        const t = "win.eventdata." + f[0].toLowerCase() + f.slice(1)
        return { sigma: f, target: t, status: WIN_VERIFIED.has(f) ? "mapped" : "derived" }
      }
      if (p === "linux" && LINUX_EXPLICIT[f]) return { sigma: f, target: LINUX_EXPLICIT[f], status: "mapped" }
      return { sigma: f, target: f, status: "unmapped" }
    }, d, "Wazuh decoder")
    const derived = [...rows.values()].filter((x) => x.status === "derived").map((x) => x.sigma)
    if (derived.length)
      d.push({ severity: "info", code: "fields.derived", message: `Derived from the windows_eventchannel naming convention, not verified: ${derived.join(", ")}.`, hint: "No silent full_log fallback: confirm the name in wazuh-logtest." })

    // Negation normal form, merging OR'd leaves on the same field into one test.
    const nnf = (n: Node, neg: boolean): Node | NLeaf => {
      if (n.type === "leaf") return { leaf: n, neg }
      if (n.type === "not") return nnf(n.arg, !neg)
      const args = n.args.map((a) => nnf(a, neg)) as (Node | NLeaf)[]
      const t = (n.type === "and") !== neg ? "and" : "or"
      return { type: t, args } as unknown as Node
    }
    const isNL = (x: any): x is NLeaf => "leaf" in x
    const dnf = (x: any): NLeaf[][] => {
      if (isNL(x)) return [[x]]
      if (x.type === "or") {
        const merged = new Map<string, NLeaf>()
        const rest: NLeaf[][] = []
        for (const a of x.args) {
          if (isNL(a) && !a.neg && !a.leaf.all && a.leaf.field) {
            const k = a.leaf.field
            const m = merged.get(k)
            merged.set(k, m ? { neg: false, leaf: { ...m.leaf, values: [...m.leaf.values, ...a.leaf.values] } } : a)
          } else rest.push(...dnf(a))
        }
        return [...[...merged.values()].map((m) => [m]), ...rest]
      }
      return x.args.reduce((acc: NLeaf[][], a: any) => acc.flatMap((c) => dnf(a).map((b) => [...c, ...b])), [[]])
    }
    const conj = dnf(nnf(r.tree, false))
    if (conj.length > 20) {
      d.push({ severity: "error", code: "target.wazuh_explosion", message: `The condition expands to ${conj.length} Wazuh rules; refusing to emit that many.` })
      return { query: "<!-- not converted -->", diagnostics: d, fields: [...rows.values()], lang: "xml" }
    }

    const valueRe = (v: Value, f: string): string | null => {
      if (v.kind === "str") return `(?i:${strToRegex(v)})`
      if (v.kind === "re") return `(?:${v.pattern})`
      if (v.kind === "cidr") {
        const re = cidrToRegex(v.cidr)
        if (re) {
          d.push({ severity: "info", code: "lossy.cidr_expanded", message: `${f}: Wazuh has no CIDR operator; ${v.cidr} was expanded into an exact octet regex.` })
          return re
        }
        d.push({ severity: "error", code: "lossy.cidr", message: `${f}: IPv6 CIDR ${v.cidr} can't be expressed in Wazuh.` })
        return null
      }
      if (v.kind === "num" && v.op === "eq") return `^${v.n}$`
      if (v.kind === "num") {
        d.push({ severity: "error", code: "lossy.numeric", message: `${f}: Wazuh has no numeric comparison. The rule is refused rather than silently dropping '${v.op} ${v.n}'.`, hint: "Anchor on a decoder that exposes the value as a range, or drop the constraint knowingly." })
        return null
      }
      return null
    }

    const anchor = ANCHORS.find(([ap, ac, as]) => ap === p && (!ac || ac === cat(r)) && (!as || as === r.logsource.service))
    if (!anchor) d.push({ severity: "warning", code: "target.wazuh_anchor", message: "No parent rule matches this log source; the rule hangs off if_group sigma_unanchored and will likely never fire." })
    const [akind, aval] = (anchor?.[3] ?? "if_group:sigma_unanchored").split(":")
    const level = WAZUH_LEVEL[r.level] ?? 7
    const mitre = r.tags.map((t) => t.match(/^attack\.(t\d{4}(?:\.\d{3})?)$/i)?.[1]?.toUpperCase()).filter(Boolean)

    const rules: string[] = []
    conj.forEach((c, i) => {
      const tests: string[] = []
      let ok = true
      for (const { leaf, neg } of c) {
        const name = leaf.field ? rows.get(leaf.field)!.target : null
        if (leaf.values.length === 1 && leaf.values[0].kind === "null") {
          d.push({ severity: "info", code: "target.wazuh_null", message: `${leaf.field}: null check rendered as a negated 'has any value' match.` })
          tests.push(`    <field name="${name}" type="pcre2"${neg ? "" : ' negate="yes"'}>.+</field>`)
          continue
        }
        const res = leaf.values.map((v) => valueRe(v, leaf.field ?? "keyword"))
        if (res.some((x) => x === null)) { ok = false; continue }
        const pat = leaf.all ? res.map((x) => `(?=.*?${x})`).join("") : res.length > 1 ? `(?:${res.join("|")})` : res[0]!
        const neg_ = neg ? ' negate="yes"' : ""
        if (name === null) {
          d.push({ severity: "warning", code: "target.wazuh_keyword", message: "Keyword search rendered as a regex over the whole log line; expect false positives." })
          tests.push(`    <regex type="pcre2"${neg_}>${xmlEsc(pat)}</regex>`)
        } else tests.push(`    <field name="${name}" type="pcre2"${neg_}>${xmlEsc(pat)}</field>`)
      }
      if (!ok) return
      rules.push([
        `  <rule id="${100000 + i}" level="${level}">`,
        `    <${akind}>${aval}</${akind}>`,
        ...tests,
        `    <description>${xmlEsc(r.title)}${conj.length > 1 ? ` (${i + 1}/${conj.length})` : ""}</description>`,
        ...(mitre.length ? ["    <mitre>", ...mitre.map((m) => `      <id>${m}</id>`), "    </mitre>"] : []),
        "  </rule>",
      ].join("\n"))
    })
    if (conj.length > 1)
      d.push({ severity: "info", code: "target.wazuh_split", message: `Wazuh rules are AND-only, so the condition was split into ${conj.length} sibling rules.` })
    d.push({ severity: "info", code: "target.wazuh_ids", message: "Rule IDs start at 100000. Check them against your local rule-ID bands before deploying." })
    const query = rules.length ? `<group name="sigma,">\n${rules.join("\n\n")}\n</group>` : "<!-- no rule could be emitted -->"
    return { query, diagnostics: d, fields: [...rows.values()], lang: "xml" }
  },
}

export const targets: Target[] = [splunk, elastic, sentinel, logscale, wazuh]

export function worst(d: Diagnostic[]): "error" | "warning" | "info" | "ok" {
  if (d.some((x) => x.severity === "error")) return "error"
  if (d.some((x) => x.severity === "warning")) return "warning"
  return d.length ? "info" : "ok"
}

export { walkLeaves }
