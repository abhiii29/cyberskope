"use client"

import { useEffect, useRef, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, Bot, ChevronDown, Cpu, Database, GitBranch, Lock, Mail, ShieldCheck, Terminal, X } from "lucide-react"
import { logSources, noiseSeries, projects, skills, stats, timeline, type Project } from "@/lib/portfolio-data"
import { sendContactEmail } from "@/app/actions/contact"
import { RuleTranslator } from "@/components/rule-lab"

const nav = ["work", "agent", "detection", "lab", "journey", "skills", "terminal", "contact"]

export default function Page() {
  const [open, setOpen] = useState<Project | null>(null)
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,oklch(0.2_0.01_240/.35)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.2_0.01_240/.35)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <Header />
      <Hero />
      <Stats />
      <Work onOpen={setOpen} />
      <Agent />
      <Detection />
      <Lab />
      <Journey />
      <Skills />
      <InteractiveTerminal />
      <Contact />
      <footer className="relative border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        cyberskope.eu · built with Next.js · read-only by design
      </footer>
      {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
    </main>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#" className="flex items-center gap-2 font-mono text-sm font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> cyberskope<span className="text-primary">_</span>
        </a>
        <nav className="hidden gap-6 font-mono text-xs text-muted-foreground md:flex">
          {nav.map((n) => (
            <a key={n} href={`#${n}`} className="hover:text-primary">./{n}</a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function useTyped(lines: string[], speed = 28) {
  const [out, setOut] = useState("")
  useEffect(() => {
    const full = lines.join("\n")
    let i = 0
    const t = setInterval(() => {
      i++
      setOut(full.slice(0, i))
      if (i >= full.length) clearInterval(t)
    }, speed)
    return () => clearInterval(t)
  }, [])
  return out
}

const feedTemplates = [
  { lvl: 12, rule: "100201", msg: "auditd: execve by root outside change window", src: "prod-db-02" },
  { lvl: 10, rule: "5712", msg: "sshd: brute force attempt (45 failures / 2 min)", src: "edge-gw-01" },
  { lvl: 7, rule: "550", msg: "FIM: integrity checksum changed /etc/sudoers.d", src: "jump-11" },
  { lvl: 3, rule: "108014", msg: "postgres: authentication failed for user app_ro", src: "pg-03" },
  { lvl: 12, rule: "60154", msg: "Windows: member added to Domain Admins", src: "dc-01" },
  { lvl: 5, rule: "31101", msg: "web: 404 burst from 203.0.113.44 (enriched: AbuseIPDB 98)", src: "waf-02" },
  { lvl: 0, rule: "100299", msg: "suppressed: known-benign cron (baseline match)", src: "app-07" },
]

function Hero() {
  const typed = useTyped([
    "$ whoami",
    "security_engineer  # SIEM · detection · IaC · agentic AI",
    "$ cat focus.txt",
    "I build SIEM platforms from code, write detections that",
    "earn their alerts, and teach AI agents to read logs safely.",
  ])
  const [feed, setFeed] = useState<(typeof feedTemplates[number] & { t: string; id: number })[]>([])
  useEffect(() => {
    let id = 0
    const t = setInterval(() => {
      const f = feedTemplates[Math.floor(Math.random() * feedTemplates.length)]
      const t = new Date().toISOString().slice(11, 19)
      setFeed((p) => [{ ...f, t, id: id++ }, ...p].slice(0, 7))
    }, 1400)
    return () => clearInterval(t)
  }, [])
  const color = (l: number) =>
    l >= 12 ? "text-red-400" : l >= 7 ? "text-amber-300" : l === 0 ? "text-muted-foreground/60 line-through" : "text-primary"

  return (
    <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-20 md:grid-cols-[1.1fr_1fr] md:pt-28">
      <div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Security Engineer · Germany
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Signal over <span className="bg-gradient-to-r from-primary to-[oklch(0.65_0.18_280)] bg-clip-text text-transparent">noise.</span>
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">
          Four years engineering and operating a multi-tenant Wazuh SIEM estate for banking, insurance and public-sector
          customers. Everything as code, every alert with a reason.
        </p>
        <pre className="mt-8 min-h-[140px] whitespace-pre-wrap rounded-lg border border-border bg-card/80 p-4 font-mono text-sm text-foreground/90">
          {typed}
          <span className="animate-pulse text-primary">▋</span>
        </pre>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#work" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            See the work <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#terminal" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm hover:border-primary">
            <Terminal className="h-4 w-4" /> Open the terminal
          </a>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card/70 shadow-2xl shadow-primary/5">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">
          <span>alerts.live — simulated</span>
          <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><i className="h-2.5 w-2.5 rounded-full bg-primary/70" /></span>
        </div>
        <ul className="space-y-1 p-3 font-mono text-[11px] leading-5 md:text-xs">
          {feed.map((a) => (
            <li key={a.id} className="animate-in fade-in slide-in-from-top-1 grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-muted-foreground">{a.t}</span>
              <span className={color(a.lvl)}>L{String(a.lvl).padStart(2, "0")}</span>
              <span className={color(a.lvl)}>{a.msg} <span className="text-muted-foreground">@{a.src}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 1200)
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{n}{suffix}</span>
}

function Stats() {
  return (
    <section className="relative border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-mono text-4xl font-bold text-primary"><Counter to={s.value} suffix={s.suffix} /></div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden border-t border-border py-3">
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-8 font-mono text-xs text-muted-foreground">
          {[...logSources, ...logSources].map((l, i) => (
            <span key={i} className="whitespace-nowrap">◆ {l}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionHead({ id, kicker, title, sub }: { id: string; kicker: string; title: string; sub?: string }) {
  return (
    <div id={id} className="scroll-mt-20">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">{kicker}</p>
      <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 max-w-2xl text-muted-foreground">{sub}</p>}
    </div>
  )
}

function Work({ onOpen }: { onOpen: (p: Project) => void }) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24">
      <SectionHead id="work" kicker="01 · selected work" title="Case studies" sub="Customer names withheld. Numbers are real." />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="group flex flex-col rounded-xl border border-border bg-card/70 p-6 text-left transition hover:-translate-y-1 hover:border-primary/60"
          >
            <span className="font-mono text-xs text-muted-foreground">{p.tag}</span>
            <h3 className="mt-2 text-lg font-semibold group-hover:text-primary">{p.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.summary}</p>
            <div className="mt-5 border-t border-border pt-4">
              <div className="font-mono text-2xl font-bold text-primary">{p.metric.value}</div>
              <div className="text-xs text-muted-foreground">{p.metric.label}</div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-primary opacity-0 transition group-hover:opacity-100">
              read more <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-muted-foreground">{project.tag}</span>
            <h3 className="mt-1 text-2xl font-bold">{project.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-muted-foreground">{project.summary}</p>
        <ul className="mt-6 space-y-3">
          {project.details.map((d) => (
            <li key={d} className="flex gap-3 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{d}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span key={s} className="rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground">{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const agentSteps = [
  { icon: Database, title: "Collect", body: "Code aggregates 24h of alerts per instance and diffs against a Git-reviewed baseline and last week." },
  { icon: Cpu, title: "Facts JSON", body: "Millions of alerts become a few KB of exact facts. No raw logs in the prompt." },
  { icon: Bot, title: "Agent loop", body: "A self-hosted LLM triages and drills down through read-only MCP tools, max 15 calls." },
  { icon: Lock, title: "Validate", body: "Any number or IP not traceable to a tool result is removed. Unreachable = NOT CHECKED." },
  { icon: GitBranch, title: "Publish", body: "One report page per day, one ticket per High/Critical finding." },
]

function Agent() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % agentSteps.length), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHead
          id="agent"
          kicker="02 · agentic AI"
          title="An AI analyst that can't make things up"
          sub="Design for an on-prem agent that does the daily SOC review across a multi-tenant SIEM estate. Deterministic where it must be exact, an LLM only where judgement helps."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {agentSteps.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setActive(i)}
              className={`relative rounded-xl border p-5 text-left transition ${i === active ? "border-primary bg-primary/10" : "border-border bg-card/60"}`}
            >
              <s.icon className={`h-6 w-6 ${i === active ? "text-primary" : "text-muted-foreground"}`} />
              <div className="mt-3 font-mono text-xs text-muted-foreground">step {i + 1}</div>
              <div className="font-semibold">{s.title}</div>
              <p className="mt-2 text-xs text-muted-foreground">{s.body}</p>
              {i < agentSteps.length - 1 && <ArrowRight className="absolute -right-3.5 top-1/2 hidden h-4 w-4 text-border md:block" />}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Read-only", "wazuh:read scope end to end; credentials never leave the proxy."],
            ["Injection-aware", "Every log field is treated as untrusted input to the model."],
            ["Shadow mode", "Runs beside the human dailies until it misses no High finding."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-lg border border-border p-4">
              <div className="font-mono text-sm text-primary">✓ {t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Detection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24">
      <SectionHead
        id="detection"
        kicker="03 · detection engineering"
        title="Tuning with evidence"
        sub="A mount-syscall use case was flooding analysts. Root cause: a firmware updater. Removing it took the rule from ~194 to ~12 alerts per hour, and the RCA went to the customer."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-72 rounded-xl border border-border bg-card/60 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={noiseSeries}>
              <CartesianGrid stroke="oklch(0.25 0.01 240)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke="oklch(0.6 0.01 240)" fontSize={12} tickFormatter={(h) => `${h}:00`} />
              <YAxis stroke="oklch(0.6 0.01 240)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.15 0.01 240)", border: "1px solid oklch(0.25 0.01 240)", fontSize: 12 }} />
              <Area type="monotone" dataKey="before" name="before (alerts/h)" stroke="oklch(0.6 0.2 25)" fill="oklch(0.6 0.2 25 / .2)" />
              <Area type="monotone" dataKey="after" name="after (alerts/h)" stroke="oklch(0.7 0.15 195)" fill="oklch(0.7 0.15 195 / .3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          {[
            ["99.1%", "of a level-7 population cleared by a single reviewed suppression"],
            ["73%", "of one rule's alerts traced to a minutely root cron job"],
            ["96", "suppression values reviewed one by one"],
          ].map(([v, l]) => (
            <div key={v} className="rounded-lg border border-border bg-card/60 p-4">
              <div className="font-mono text-2xl font-bold text-primary">{v}</div>
              <div className="text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Lab() {
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHead
          id="lab"
          kicker="04 · lab"
          title="Rule translator"
          sub="Paste a Sigma rule and get Splunk, Elastic, Sentinel, LogScale and Wazuh queries, plus an honest list of what each translation lost. Runs entirely in your browser; nothing is sent anywhere."
        />
        <div className="mt-8">
          <RuleTranslator />
        </div>
      </div>
    </section>
  )
}

function Journey() {
  const [open, setOpen] = useState(timeline.length - 1)
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-4xl px-4 py-24">
        <SectionHead id="journey" kicker="05 · journey" title="Four years, five phases" />
        <ol className="mt-10 border-l border-border">
          {timeline.map((t, i) => (
            <li key={t.period} className="relative pb-6 pl-8">
              <span className={`absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${i === open ? "border-primary bg-primary" : "border-border bg-background"}`} />
              <button onClick={() => setOpen(i === open ? -1 : i)} className="flex w-full items-center justify-between text-left">
                <div>
                  <div className="font-mono text-xs text-primary">{t.period}</div>
                  <div className="font-semibold">{t.title}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${i === open ? "rotate-180" : ""}`} />
              </button>
              {i === open && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {t.points.map((p) => <li key={p}>→ {p}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Skills() {
  const cats = Object.keys(skills)
  const [cat, setCat] = useState(cats[0])
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24">
      <SectionHead id="skills" kicker="06 · toolbox" title="What I work with" />
      <div className="mt-8 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-1.5 font-mono text-xs transition ${c === cat ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {skills[cat].map((s) => (
          <span key={s} className="animate-in fade-in zoom-in-95 rounded-lg border border-border bg-card/70 px-4 py-2 text-sm">{s}</span>
        ))}
      </div>
    </section>
  )
}

const commands: Record<string, string> = {
  help: "commands: whoami, stack, projects, agent, stats, contact, clear",
  whoami: "Security engineer. SIEM platform + detection engineering, 4+ years. Name withheld for now.",
  stack: Object.entries(skills).map(([k, v]) => `${k.padEnd(12)} ${v.slice(0, 4).join(", ")}`).join("\n"),
  projects: projects.map((p) => `- ${p.title}: ${p.metric.value} ${p.metric.label}`).join("\n"),
  agent: "facts JSON → LLM triage → read-only MCP drill-down → validation → daily report.\nNo external LLM API. Every tool call audit-logged.",
  stats: stats.map((s) => `${s.value}${s.suffix} ${s.label}`).join("\n"),
  contact: "scroll down, or: echo hello > #contact",
  "sudo rm -rf /": "nice try. this terminal is read-only by design. 🔒",
}

function InteractiveTerminal() {
  const [hist, setHist] = useState<{ cmd: string; out: string }[]>([{ cmd: "help", out: commands.help }])
  const [val, setVal] = useState("")
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight
  }, [hist])
  const run = (e: React.FormEvent) => {
    e.preventDefault()
    const c = val.trim()
    if (!c) return
    if (c === "clear") setHist([])
    else setHist((h) => [...h, { cmd: c, out: commands[c] ?? `command not found: ${c} (try 'help')` }])
    setVal("")
  }
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-4xl px-4 py-24">
        <SectionHead id="terminal" kicker="07 · shell" title="Prefer a terminal?" />
        <div className="mt-8 rounded-xl border border-border bg-background shadow-2xl" onClick={() => document.getElementById("term-in")?.focus()}>
          <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">guest@cyberskope:~</div>
          <div ref={box} className="h-80 overflow-y-auto p-4 font-mono text-sm">
            {hist.map((h, i) => (
              <div key={i} className="mb-3">
                <div><span className="text-primary">$</span> {h.cmd}</div>
                <pre className="whitespace-pre-wrap text-muted-foreground">{h.out}</pre>
              </div>
            ))}
            <form onSubmit={run} className="flex gap-2">
              <span className="text-primary">$</span>
              <input id="term-in" value={val} onChange={(e) => setVal(e.target.value)} autoComplete="off" className="flex-1 bg-transparent outline-none" aria-label="terminal input" />
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setState("sending")
    const res = await sendContactEmail({
      name: String(f.get("name")),
      email: String(f.get("email")),
      company: "",
      message: String(f.get("message")),
    }).catch(() => ({ success: false }))
    setState(res?.success ? "sent" : "error")
  }
  return (
    <section className="relative mx-auto max-w-3xl px-4 py-24">
      <SectionHead id="contact" kicker="08 · contact" title="Let's talk" sub="Roles in detection engineering, SIEM platform work or security automation." />
      {state === "sent" ? (
        <p className="mt-8 rounded-lg border border-primary/40 bg-primary/10 p-4 font-mono text-sm">✓ message delivered. I'll reply soon.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input required name="name" placeholder="Name" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <input required type="email" name="email" placeholder="Email" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <textarea required name="message" rows={5} placeholder="Message" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button disabled={state === "sending"} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            <Mail className="h-4 w-4" /> {state === "sending" ? "Sending…" : "Send message"}
          </button>
          {state === "error" && <p className="text-sm text-red-400">Couldn't send right now. Please try again later.</p>}
        </form>
      )}
    </section>
  )
}
