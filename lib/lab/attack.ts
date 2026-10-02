// ATT&CK coverage from Sigma tags. The matrix is a hand-picked subset of
// Enterprise ATT&CK (common, detectable techniques), not the full framework;
// the UI says so and lists any tagged technique outside it.

import { parseAllDocuments } from "yaml"

export type Tech = { id: string; name: string }
export type Tactic = { id: string; name: string; techniques: Tech[] }

const t = (id: string, name: string): Tech => ({ id, name })

export const matrix: Tactic[] = [
  { id: "initial_access", name: "Initial Access", techniques: [t("T1189", "Drive-by Compromise"), t("T1190", "Exploit Public-Facing Application"), t("T1133", "External Remote Services"), t("T1566", "Phishing"), t("T1078", "Valid Accounts"), t("T1195", "Supply Chain Compromise"), t("T1199", "Trusted Relationship"), t("T1091", "Replication Through Removable Media")] },
  { id: "execution", name: "Execution", techniques: [t("T1059", "Command and Scripting Interpreter"), t("T1203", "Exploitation for Client Execution"), t("T1047", "Windows Management Instrumentation"), t("T1053", "Scheduled Task/Job"), t("T1569", "System Services"), t("T1204", "User Execution"), t("T1106", "Native API"), t("T1129", "Shared Modules")] },
  { id: "persistence", name: "Persistence", techniques: [t("T1547", "Boot or Logon Autostart Execution"), t("T1053", "Scheduled Task/Job"), t("T1136", "Create Account"), t("T1543", "Create or Modify System Process"), t("T1546", "Event Triggered Execution"), t("T1098", "Account Manipulation"), t("T1505", "Server Software Component"), t("T1078", "Valid Accounts")] },
  { id: "privilege_escalation", name: "Privilege Escalation", techniques: [t("T1548", "Abuse Elevation Control Mechanism"), t("T1134", "Access Token Manipulation"), t("T1068", "Exploitation for Privilege Escalation"), t("T1055", "Process Injection"), t("T1547", "Boot or Logon Autostart Execution"), t("T1543", "Create or Modify System Process"), t("T1053", "Scheduled Task/Job"), t("T1078", "Valid Accounts")] },
  { id: "defense_evasion", name: "Defense Evasion", techniques: [t("T1562", "Impair Defenses"), t("T1070", "Indicator Removal"), t("T1027", "Obfuscated Files or Information"), t("T1218", "System Binary Proxy Execution"), t("T1036", "Masquerading"), t("T1112", "Modify Registry"), t("T1140", "Deobfuscate/Decode Files or Information"), t("T1055", "Process Injection")] },
  { id: "credential_access", name: "Credential Access", techniques: [t("T1110", "Brute Force"), t("T1003", "OS Credential Dumping"), t("T1555", "Credentials from Password Stores"), t("T1552", "Unsecured Credentials"), t("T1558", "Steal or Forge Kerberos Tickets"), t("T1056", "Input Capture"), t("T1557", "Adversary-in-the-Middle"), t("T1621", "Multi-Factor Authentication Request Generation")] },
  { id: "discovery", name: "Discovery", techniques: [t("T1087", "Account Discovery"), t("T1082", "System Information Discovery"), t("T1083", "File and Directory Discovery"), t("T1046", "Network Service Discovery"), t("T1057", "Process Discovery"), t("T1018", "Remote System Discovery"), t("T1069", "Permission Groups Discovery"), t("T1016", "System Network Configuration Discovery")] },
  { id: "lateral_movement", name: "Lateral Movement", techniques: [t("T1021", "Remote Services"), t("T1570", "Lateral Tool Transfer"), t("T1210", "Exploitation of Remote Services"), t("T1550", "Use Alternate Authentication Material"), t("T1563", "Remote Service Session Hijacking"), t("T1080", "Taint Shared Content")] },
  { id: "collection", name: "Collection", techniques: [t("T1005", "Data from Local System"), t("T1039", "Data from Network Shared Drive"), t("T1114", "Email Collection"), t("T1113", "Screen Capture"), t("T1560", "Archive Collected Data"), t("T1119", "Automated Collection")] },
  { id: "command_and_control", name: "Command and Control", techniques: [t("T1071", "Application Layer Protocol"), t("T1105", "Ingress Tool Transfer"), t("T1095", "Non-Application Layer Protocol"), t("T1572", "Protocol Tunneling"), t("T1090", "Proxy"), t("T1219", "Remote Access Software"), t("T1573", "Encrypted Channel"), t("T1568", "Dynamic Resolution")] },
  { id: "exfiltration", name: "Exfiltration", techniques: [t("T1041", "Exfiltration Over C2 Channel"), t("T1567", "Exfiltration Over Web Service"), t("T1048", "Exfiltration Over Alternative Protocol"), t("T1020", "Automated Exfiltration"), t("T1029", "Scheduled Transfer")] },
  { id: "impact", name: "Impact", techniques: [t("T1486", "Data Encrypted for Impact"), t("T1490", "Inhibit System Recovery"), t("T1489", "Service Stop"), t("T1485", "Data Destruction"), t("T1499", "Endpoint Denial of Service"), t("T1531", "Account Access Removal"), t("T1565", "Data Manipulation")] },
]

export const known = new Set(matrix.flatMap((m) => m.techniques.map((x) => x.id)))
export const uniqueTechniques = known.size

export type TaggedRule = { title: string; level: string; techniques: string[]; subs: string[]; tactics: string[] }

/** Read title/level/tags from every document in a multi-rule YAML (split on ---). */
export function readRules(text: string): { rules: TaggedRule[]; errors: string[] } {
  const rules: TaggedRule[] = []
  const errors: string[] = []
  parseAllDocuments(text).forEach((doc, i) => {
    if (doc.errors.length) return errors.push(`document ${i + 1}: ${doc.errors[0].message.split("\n")[0]}`)
    const d = doc.toJS() as { title?: string; level?: string; tags?: unknown } | null
    if (!d || typeof d !== "object") return
    const tags = Array.isArray(d.tags) ? d.tags.map(String) : []
    const subs: string[] = [], techniques = new Set<string>(), tactics: string[] = []
    for (const tag of tags) {
      const m = tag.match(/^attack\.t(\d{4})(?:\.(\d{3}))?$/i)
      if (m) {
        techniques.add(`T${m[1]}`)
        if (m[2]) subs.push(`T${m[1]}.${m[2]}`)
      } else if (/^attack\.[a-z_]+$/i.test(tag)) tactics.push(tag.slice(7).toLowerCase())
    }
    rules.push({ title: d.title ?? `untitled rule ${i + 1}`, level: d.level ?? "-", techniques: [...techniques], subs, tactics })
  })
  return { rules, errors }
}

/** Rules per technique; a rule counts under a tactic column only if it names that tactic or names none. */
export function coverage(rules: TaggedRule[]) {
  const cell = new Map<string, TaggedRule[]>() // `${tactic}|${tech}`
  const anyTactic = new Map<string, TaggedRule[]>()
  for (const r of rules)
    for (const tech of r.techniques) {
      anyTactic.set(tech, [...(anyTactic.get(tech) ?? []), r])
      for (const col of matrix)
        if (col.techniques.some((x) => x.id === tech) && (r.tactics.length === 0 || r.tactics.includes(col.id)))
          cell.set(`${col.id}|${tech}`, [...(cell.get(`${col.id}|${tech}`) ?? []), r])
    }
  const covered = [...anyTactic.keys()].filter((x) => known.has(x))
  const outside = [...anyTactic.keys()].filter((x) => !known.has(x))
  const untagged = rules.filter((r) => r.techniques.length === 0)
  const tacticGaps = matrix
    .map((m) => ({ name: m.name, covered: m.techniques.filter((x) => cell.has(`${m.id}|${x.id}`)).length, total: m.techniques.length }))
    .sort((a, b) => a.covered / a.total - b.covered / b.total)
  return { cell, covered, outside, untagged, tacticGaps }
}

const r = (title: string, level: string, tags: string[]) =>
  `title: ${title}\nlogsource:\n  product: windows\ndetection:\n  selection:\n    EventID: 1\n  condition: selection\nlevel: ${level}\ntags:\n${tags.map((x) => `  - ${x}`).join("\n")}\n`

/** Sample rule pack. Detections are placeholders; only titles and tags matter here. */
export const samplePack = [
  r("PowerShell Download Cradle", "high", ["attack.execution", "attack.t1059.001"]),
  r("Curl Piped To Shell", "medium", ["attack.execution", "attack.t1059.004"]),
  r("Run Key Persistence", "medium", ["attack.persistence", "attack.t1547.001"]),
  r("Password Spraying", "high", ["attack.credential_access", "attack.t1110.003"]),
  r("LSASS Memory Access", "high", ["attack.credential_access", "attack.t1003.001"]),
  r("Scheduled Task Created From Temp", "medium", ["attack.execution", "attack.persistence", "attack.t1053.005"]),
  r("Certutil Download And Decode", "high", ["attack.command_and_control", "attack.defense_evasion", "attack.t1105", "attack.t1140"]),
  r("Shadow Copies Deleted", "critical", ["attack.impact", "attack.t1490"]),
  r("PsExec Service Installed", "high", ["attack.execution", "attack.lateral_movement", "attack.t1569.002", "attack.t1021.002"]),
  r("Rclone Upload To Cloud Storage", "high", ["attack.exfiltration", "attack.t1567.002"]),
  r("Security Event Log Cleared", "high", ["attack.defense_evasion", "attack.t1070.001"]),
  r("Local Account Created", "medium", ["attack.persistence", "attack.t1136.001"]),
  r("Rundll32 Without Arguments", "medium", ["attack.defense_evasion", "attack.t1218.011"]),
  r("Whoami Executed By Service Account", "low", ["attack.discovery", "attack.t1033"]),
  r("Suspicious Outbound On Port 4444", "medium", ["attack.command_and_control", "attack.t1095"]),
].join("---\n")
