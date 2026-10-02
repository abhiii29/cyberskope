"use client"

import { useEffect, useRef, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, Play, UserCheck, Bot, ChevronDown, Cpu, Database, GitBranch, Lock, Mail, ShieldCheck, Terminal, X } from "lucide-react"
import { logSources, noiseSeries, tuningCases, tuningPatterns, type TuningCase, projects, skills, stats, timeline, type Project } from "@/lib/portfolio-data"
import { sendContactEmail } from "@/app/actions/contact"
import Link from "next/link"
import { labTools } from "@/lib/lab/tools"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  EASE, MaskText, Reveal, ScrollProgressBar, ScrollScale, ScrollText, motion, spotlight,
  useActiveSection, useReducedMotion, useScroll, useScrollStep, useSpring, useTransform,
} from "@/components/motion"
import { AnimatePresence, useMotionValueEvent } from "motion/react"
import { BootProvider, useBooted } from "@/components/boot-loader"
import { AgentSim } from "@/components/agent-sim"
import { NetworkField } from "@/components/network-field"

const nav = ["work", "agent", "detection", "lab", "journey", "skills", "terminal", "contact"]

export default function Page() {
  const [open, setOpen] = useState<Project | null>(null)
  return (
    <BootProvider>
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,var(--grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <Header />
      <Hero />
      <Stats />
      <ScrollText
        text="Millions of events a day. A handful that matter. I build the systems that tell them apart, and prove it with evidence."
        accent={["handful", "matter", "evidence"]}
      />
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
    </BootProvider>
  )
}

function Header() {
  const active = useActiveSection(nav)
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
      <ScrollProgressBar />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#" className="flex items-center gap-2 font-mono text-sm font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> cyberskope<span className="text-primary">_</span>
        </a>
        <div className="flex items-center gap-6">
          <nav className="hidden gap-5 font-mono text-xs text-muted-foreground md:flex">
            {nav.map((n) => (
              <a
                key={n}
                href={`#${n}`}
                className={`relative transition-colors hover:text-primary ${active === n ? "text-primary" : ""}`}
              >
                ./{n}
                <span
                  className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-primary transition-transform duration-300 ${active === n ? "scale-x-100" : "scale-x-0"}`}
                />
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function useTyped(lines: string[], start: boolean, speed = 28) {
  const [out, setOut] = useState("")
  useEffect(() => {
    if (!start) return
    const full = lines.join("\n")
    let i = 0
    const t = setInterval(() => {
      i++
      setOut(full.slice(0, i))
      if (i >= full.length) clearInterval(t)
    }, speed)
    return () => clearInterval(t)
  }, [start])
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
  const booted = useBooted()
  const reduce = useReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)
  // As the hero scrolls away it recedes: shrinks, dims and blurs (Apple product-page exit).
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const blur = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(6px)"])
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const rise = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: booted ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, ease: EASE, delay: d },
  })
  const typed = useTyped([
    "$ whoami",
    "security_engineer  # SIEM · detection · IaC · agentic AI",
    "$ cat focus.txt",
    "I build SIEM platforms from code, write detections that",
    "earn their alerts, and teach AI agents to read logs safely.",
  ], booted)
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
    l >= 12 ? "text-danger" : l >= 7 ? "text-warn" : l === 0 ? "text-muted-foreground/60 line-through" : "text-primary"

  return (
    <div ref={heroRef} className="relative overflow-hidden">
      {/* Particle network behind the hero, drifting slower than the page (parallax) */}
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y: bgY }}
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_75%_75%_at_50%_45%,black_30%,transparent_100%)]"
      >
        <NetworkField />
        <div className="aurora left-[10%] top-[10%] h-[26rem] w-[26rem] bg-primary" />
        <div className="aurora right-[8%] top-[30%] h-[30rem] w-[30rem] bg-violet [animation-delay:-8s]" />
      </motion.div>
    <motion.section
      style={reduce ? undefined : { scale, opacity, filter: blur }}
      className="relative mx-auto grid min-h-[calc(100svh-57px)] max-w-6xl content-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr]"
    >
      <div className="relative">
        <motion.p {...rise(0)} className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Security Engineer · Germany
        </motion.p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          <MaskText text="Signal over" play={booted} delay={0.1} />{" "}
          <MaskText text="noise." play={booted} delay={0.26} className="text-gradient" />
        </h1>
        <motion.p {...rise(0.35)} className="mt-5 max-w-lg text-lg text-muted-foreground">
          Four years engineering and operating a multi-tenant Wazuh SIEM estate for banking, insurance and public-sector
          customers. Everything as code, every alert with a reason.
        </motion.p>
        <motion.div {...rise(0.45)}>
        <pre className="mt-8 min-h-[140px] whitespace-pre-wrap rounded-lg border border-border bg-card/80 p-4 font-mono text-sm text-foreground/90">
          {typed}
          <span className="animate-pulse text-primary">▋</span>
        </pre>
        </motion.div>
        <motion.div {...rise(0.55)} className="mt-6 flex flex-wrap gap-3">
          <a href="#work" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            See the work <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#terminal" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm hover:border-primary">
            <Terminal className="h-4 w-4" /> Open the terminal
          </a>
        </motion.div>
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
        animate={booted ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
        className="relative self-center rounded-xl border border-border bg-card/70 shadow-2xl shadow-primary/10 backdrop-blur"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">
          <span>alerts.live — simulated</span>
          <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-danger/70" /><i className="h-2.5 w-2.5 rounded-full bg-warn/70" /><i className="h-2.5 w-2.5 rounded-full bg-primary/70" /></span>
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
      </motion.div>
    </motion.section>
    </div>
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

// A tiny animation per stat that shows what the number means. Plays once in view.
function StatGlyph({ i }: { i: number }) {
  const reduce = useReducedMotion()
  const v = { once: true, margin: "0px 0px -10% 0px" }
  const t = (d: number) => ({ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.3 + d })
  const box = "mb-3 flex h-6 items-end gap-1"
  if (i === 0) // years: one segment fills per year
    return (
      <div className={box} aria-hidden>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="h-1.5 w-8 overflow-hidden rounded-full bg-border">
            <motion.div className="h-full origin-left bg-primary" initial={{ scaleX: reduce ? 1 : 0 }} whileInView={{ scaleX: 1 }} viewport={v} transition={{ ...t(k * 0.3), duration: 0.35 }} />
          </div>
        ))}
      </div>
    )
  if (i === 1) // repositories: each pipeline turns green
    return (
      <div className={box} aria-hidden>
        {Array.from({ length: 7 }, (_, k) => (
          <motion.div
            key={k}
            className="flex h-4 w-4 items-center justify-center rounded-sm border text-[9px] leading-none"
            initial={reduce ? false : { borderColor: "var(--border)", color: "transparent", backgroundColor: "transparent" }}
            whileInView={{ borderColor: "var(--primary)", color: "var(--primary-foreground)", backgroundColor: "var(--primary)" }}
            viewport={v}
            transition={t(k * 0.12)}
          >
            ✓
          </motion.div>
        ))}
      </div>
    )
  if (i === 2) // upgrade rounds: a staircase of versions
    return (
      <div className={box} aria-hidden>
        {Array.from({ length: 8 }, (_, k) => (
          <motion.div
            key={k}
            className="w-2.5 origin-bottom rounded-t-sm bg-primary"
            style={{ height: `${(k + 1) * 3}px` }}
            initial={reduce ? false : { scaleY: 0, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            viewport={v}
            transition={t(k * 0.1)}
          />
        ))}
      </div>
    )
  // log sources: streams converging into one pipe
  return (
    <div className="relative mb-3 h-6 w-32 overflow-hidden" aria-hidden>
      <div className="absolute right-0 top-1/2 h-3 w-8 -translate-y-1/2 rounded-sm border border-primary bg-primary/20" />
      {!reduce &&
        [0, 1, 2, 3, 4].map((k) => (
          <motion.span
            key={k}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary"
            initial={{ left: "0%", top: `${10 + k * 18}%`, opacity: 0 }}
            animate={{ left: ["0%", "72%"], top: [`${10 + k * 18}%`, "45%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.32, ease: "easeIn" }}
          />
        ))}
    </div>
  )
}

function Stats() {
  return (
    <section className="relative border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <StatGlyph i={i} />
            <div className="font-mono text-4xl font-bold text-primary"><Counter to={s.value} suffix={s.suffix} /></div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </Reveal>
        ))}
      </div>
      <div className="marquee relative overflow-hidden border-t border-border py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-8 font-mono text-xs text-muted-foreground">
          {[...logSources, ...logSources].map((l, i) => (
            <span key={i} className="whitespace-nowrap transition-colors hover:text-primary">◆ {l}</span>
          ))}
        </div>
        {/* A scanner beam sweeping across the sources, like a parser picking them up. */}
        <span aria-hidden className="scan-beam pointer-events-none absolute inset-y-0 w-40" />
      </div>
    </section>
  )
}

function SectionHead({ id, kicker, title, sub }: { id: string; kicker: string; title: string; sub?: string }) {
  return (
    <div id={id} className="scroll-mt-20">
      <Reveal>
        <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-primary">
          {kicker}
          <span className="h-px w-12 bg-gradient-to-r from-primary to-transparent" />
        </p>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
        {sub && <p className="mt-3 max-w-2xl text-muted-foreground">{sub}</p>}
      </Reveal>
    </div>
  )
}

// 3D tilt toward the pointer on top of the spotlight; skipped for reduced motion.
function tilt(e: React.PointerEvent<HTMLElement>) {
  spotlight(e)
  if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const r = e.currentTarget.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  e.currentTarget.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`)
  e.currentTarget.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`)
}
function untilt(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg")
  e.currentTarget.style.setProperty("--ry", "0deg")
}

function Work({ onOpen }: { onOpen: (p: Project) => void }) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24">
      <SectionHead id="work" kicker="01 · selected work" title="Case studies" sub="Customer names withheld. Numbers are real." />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <ScrollScale key={p.id} className="flex">
          <button
            onClick={() => onOpen(p)}
            onPointerMove={tilt}
            onPointerLeave={untilt}
            style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
            className="spotlight group flex w-full flex-col rounded-xl border border-border bg-card/70 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10"
          >
            <span className="font-mono text-xs text-muted-foreground">{p.tag}</span>
            <h3 className="mt-2 text-lg font-semibold group-hover:text-primary">{p.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.summary}</p>
            <div className="mt-5 border-t border-border pt-4">
              <div className="font-mono text-2xl font-bold text-primary">{p.metric.value}</div>
              <div className="text-xs text-muted-foreground">{p.metric.label}</div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-primary opacity-0 transition group-hover:opacity-100">
              read more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          </ScrollScale>
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
  { icon: UserCheck, title: "Human review", body: "An analyst approves, downgrades or dismisses every High finding. Baseline changes are only ever proposed, then reviewed as a PR." },
  { icon: GitBranch, title: "Publish", body: "One report page per day, one ticket per approved High/Critical finding, deduplicated against open tickets." },
]

// The pipeline as a strip of nodes: stages up to the current step light up and
// packets keep travelling from the first node to the active one.
function AgentFlow({ active }: { active: number }) {
  const reduce = useReducedMotion()
  const n = agentSteps.length
  const x = (i: number) => `${(i / (n - 1)) * 100}%`
  return (
    <div className="relative mt-10 h-10" aria-hidden>
      <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-border">
        <motion.div className="h-full origin-left bg-gradient-to-r from-primary to-violet" animate={{ scaleX: active / (n - 1) }} transition={{ duration: 0.6, ease: EASE }} />
        {!reduce && active > 0 &&
          [0, 1].map((k) => (
            <motion.span
              key={`${active}-${k}`}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", x(active)], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.5 + active * 0.35, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4, delay: k * 0.6 }}
            />
          ))}
        {agentSteps.map((st, i) => (
          <motion.span
            key={st.title}
            className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card"
            style={{ left: x(i) }}
            animate={{
              borderColor: i <= active ? "var(--primary)" : "var(--border)",
              color: i <= active ? "var(--primary)" : "var(--muted-foreground)",
              scale: i === active ? 1.15 : 1,
            }}
            transition={{ duration: 0.4 }}
          >
            <st.icon className="h-3.5 w-3.5" />
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function Agent() {
  const [active, setActive] = useState(0)
  const [sim, setSim] = useState(false)
  const reduce = useReducedMotion()
  const pinRef = useRef<HTMLDivElement>(null)
  // The step list stays pinned while scrolling through the section; scroll position picks the step.
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] })
  // Only pinned (and so scroll-driven) from md up; on phones the steps are tapped instead.
  useScrollStep(scrollYProgress, agentSteps.length, (i) => {
    if (!reduce && window.matchMedia("(min-width: 768px)").matches) setActive(i)
  })
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1])
  const goTo = (i: number) => {
    const el = pinRef.current
    if (!el || reduce || window.innerWidth < 768) return setActive(i)
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + ((i + 0.5) / agentSteps.length) * (el.offsetHeight - window.innerHeight), behavior: "smooth" })
  }
  const S = agentSteps[active]
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 pt-24">
        <SectionHead
          id="agent"
          kicker="02 · agentic AI"
          title="An AI analyst that can't make things up"
          sub="Design for an on-prem agent that does the daily SOC review across a multi-tenant SIEM estate. Deterministic where it must be exact, an LLM only where judgement helps."
        />
      </div>
      <div ref={pinRef} className={reduce ? "" : "md:h-[300vh]"}>
        <div className={`mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_1.2fr] ${reduce ? "" : "md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:content-center"}`}>
          <ol className="relative space-y-2 pl-6">
            <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <motion.span
              style={{ scaleY: reduce ? (active + 1) / agentSteps.length : fill }}
              className="absolute left-[7px] top-2 bottom-2 w-px origin-top bg-primary"
            />
            {agentSteps.map((s, i) => (
              <li key={s.title}>
                <button onClick={() => goTo(i)} className="group flex w-full items-start gap-4 rounded-lg py-2 text-left">
                  <span
                    className={`absolute left-0 mt-1 h-3.5 w-3.5 rounded-full border-2 transition-all duration-500 ${i <= active ? "border-primary bg-primary" : "border-border bg-background"} ${i === active ? "scale-125 shadow-[0_0_12px_var(--primary)]" : ""}`}
                  />
                  <div className={`transition-all duration-500 ${i === active ? "translate-x-1 opacity-100" : "opacity-45 group-hover:opacity-75"}`}>
                    <div className="font-mono text-xs text-muted-foreground">step {i + 1}</div>
                    <div className={`text-xl font-semibold md:text-2xl ${i === active ? "text-foreground" : ""}`}>{s.title}</div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-border bg-card/70 p-8 shadow-2xl shadow-primary/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_60%)]" />
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative"
            >
              <S.icon className="h-10 w-10 text-primary" />
              <div className="mt-6 font-mono text-xs text-muted-foreground">
                step {active + 1} / {agentSteps.length}
              </div>
              <h3 className="mt-1 text-3xl font-bold">{S.title}</h3>
              <p className="mt-4 max-w-md text-lg text-muted-foreground">{S.body}</p>
            </motion.div>
            <AgentFlow active={active} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
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
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <button
            onClick={() => setSim(true)}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary/60 bg-primary/10 px-6 py-3 font-mono text-sm text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Play className="h-4 w-4" /> Watch a simulated run
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">five scenarios · you make the analyst calls · synthetic data</span>
        </div>
        <AnimatePresence>{sim && <AgentSim steps={agentSteps} onClose={() => setSim(false)} />}</AnimatePresence>
      </div>
    </section>
  )
}

function Detection() {
  const [group, setGroup] = useState<"own" | "patterns">("own")
  const [active, setActive] = useState(0)
  const list = group === "own" ? tuningCases : tuningPatterns
  const c = list[Math.min(active, list.length - 1)]
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24">
      <SectionHead
        id="detection"
        kicker="03 · detection engineering"
        title="Tuning with evidence"
        sub="Noise has a root cause. Each case below started with an alert queue nobody trusted and ended with a measured, reviewed change."
      />
      <div className="mt-8 inline-flex rounded-full border border-border p-1 font-mono text-xs">
        {([["own", "From my work"], ["patterns", "Common patterns"]] as const).map(([g, label]) => (
          <button
            key={g}
            onClick={() => (setGroup(g), setActive(0))}
            className={`rounded-full px-3 py-1 transition-colors ${group === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {group === "patterns" && (
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Widely known tuning problems and how I'd approach them. These aren't from my engagements, so there are no measured numbers.
        </p>
      )}
      <div role="tablist" aria-label="Tuning case studies" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {list.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
              i === active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={group + c.id}
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]"
        >
          <div className="flex flex-col rounded-xl border border-border bg-card/60 p-4">
            <h3 className="mb-3 font-semibold">{c.title}</h3>
            <div className="min-h-72 flex-1">
              {c.chart.kind === "series" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={noiseSeries}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(h) => `${h}:00`} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="before" name="before (alerts/h)" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="after" name="after (alerts/h)" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : c.chart.kind === "steps" ? (
                <FilterPipeline steps={c.chart.steps} out={c.chart.out} />
              ) : (
                <CaseChart chart={c.chart} />
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="font-mono text-2xl font-bold text-primary">{c.metric.value}</div>
              <div className="text-sm text-muted-foreground">{c.metric.label}</div>
            </div>
            {([["problem", c.problem], ["finding", c.finding], ["fix", c.fix]] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="font-mono text-xs uppercase tracking-widest text-primary">{k}</div>
                <p className="mt-1 text-sm text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

// Animated "alert funnel": events stream in at the top, benign ones peel off
// at each stage, and only the real signal reaches the bottom. Illustrative only.
const DOTS = Array.from({ length: 14 }, (_, i) => ({ drop: i % 7 === 3 ? 4 : i % 4, x: 30 + ((i * 37) % 40), delay: i * 0.42 }))

function FilterPipeline({ steps, out }: { steps: { label: string; check: string }[]; out: string }) {
  const reduce = useReducedMotion()
  const n = steps.length
  const rowY = (i: number) => 8 + (i + 0.5) * (84 / n) // % of the funnel's height
  return (
    <div className="grid h-full grid-cols-[96px_1fr] gap-4 sm:grid-cols-[140px_1fr]">
      <div className="relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="funnel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--danger)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M8 2 L92 2 L60 90 L60 98 L40 98 L40 90 Z" fill="url(#funnel)" stroke="var(--border)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          {steps.map((_, i) => (
            <line key={i} x1="0" x2="100" y1={rowY(i)} y2={rowY(i)} stroke="var(--primary)" strokeOpacity="0.35" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {!reduce &&
          DOTS.map((d, i) => {
            const real = d.drop === 4
            const stopY = real ? 96 : rowY(d.drop)
            return (
              <motion.span
                key={i}
                className={`absolute h-2 w-2 -translate-x-1/2 rounded-full ${real ? "bg-danger shadow-[0_0_10px_var(--danger)]" : "bg-primary"}`}
                initial={{ left: `${d.x}%`, top: "0%", opacity: 0 }}
                animate={{
                  top: ["0%", `${stopY}%`, `${stopY}%`],
                  left: [`${d.x}%`, real ? "50%" : `${d.x}%`, real ? "50%" : `${d.x < 50 ? -6 : 106}%`],
                  opacity: [0, 1, real ? 1 : 0],
                }}
                transition={{ duration: 3, times: [0, 0.75, 1], ease: "easeIn", repeat: Infinity, delay: d.delay }}
              />
            )
          })}
      </div>
      <ol className="flex flex-col justify-around gap-2">
        {steps.map((st, i) => (
          <motion.li
            key={st.label}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.1 }}
            className="rounded-lg border border-border bg-background/40 px-3 py-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              {st.label}
            </div>
            <code className="mt-1 block truncate font-mono text-xs text-muted-foreground">{st.check}</code>
          </motion.li>
        ))}
        <motion.li
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 + n * 0.1 }}
          className="flex items-center gap-2 rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 text-sm"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
          <span className="font-mono text-xs uppercase tracking-widest text-danger">signal</span>
          <span className="text-muted-foreground">→ {out}</span>
        </motion.li>
      </ol>
    </div>
  )
}

const TONE = { danger: "var(--danger)", primary: "var(--primary)", muted: "var(--muted-foreground)" }
const TIP = { background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 12 }

function CaseChart({ chart }: { chart: TuningCase["chart"] }) {
  if (chart.kind === "donut")
    return (
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chart.slices} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {chart.slices.map((sl) => <Cell key={sl.label} fill={TONE[sl.tone]} fillOpacity={sl.tone === "muted" ? 0.4 : 0.9} />)}
            </Pie>
            <Tooltip contentStyle={TIP} formatter={(v) => `${v}%`} />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center">
          <div className="font-mono text-3xl font-bold">{chart.slices[0].value}%</div>
          <div className="text-xs text-muted-foreground">{chart.unit}</div>
        </div>
      </div>
    )
  if (chart.kind === "stacked")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.rows} layout="vertical" barSize={36} margin={{ left: 8, right: 24 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} unit="%" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis type="category" dataKey="label" stroke="var(--muted-foreground)" fontSize={12} width={56} />
          <Tooltip contentStyle={TIP} cursor={{ fill: "var(--border)", opacity: 0.3 }} formatter={(v) => `${v}%`} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="keep" name={chart.keep} stackId="r" fill="var(--primary)" fillOpacity={0.85} />
          <Bar dataKey="lose" name={chart.lose} stackId="r" fill="var(--danger)" fillOpacity={0.7} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  if (chart.kind === "bars")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.bars} barSize={72} margin={{ top: 24 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis domain={[0, 100]} unit="%" stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={TIP} cursor={{ fill: "var(--border)", opacity: 0.3 }} formatter={(v) => [`${v}%`, chart.unit]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chart.bars.map((b) => <Cell key={b.label} fill={TONE[b.tone]} fillOpacity={0.85} />)}
            <LabelList dataKey="value" position="top" formatter={(v: number) => `${v}%`} fill="var(--foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  return null
}

function Lab() {
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHead
          id="lab"
          kicker="04 · lab"
          title="Tools that run in your browser"
          sub="Small detection-engineering tools I built. Nothing is uploaded; each one says what it can't do."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {labTools.map((t, i) => (
            <Reveal key={t.id} delay={i * 60} className="flex">
              <Link
                href={`/lab?tool=${t.id}`}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
                className="spotlight group flex w-full flex-col rounded-xl border border-border bg-card/70 p-5 transition duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10"
              >
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <h3 className="mt-2 font-semibold group-hover:text-primary">{t.name}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{t.short}</p>
                <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-primary">
                  open in lab <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
          <Reveal delay={labTools.length * 60} className="flex">
            <Link
              href="/lab"
              className="group flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 p-5 text-center font-mono text-sm text-primary transition hover:bg-primary/10"
            >
              open the lab
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Journey() {
  const [open, setOpen] = useState(timeline.length - 1)
  const reduce = useReducedMotion()
  const line = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: line, offset: ["start 75%", "end 55%"] })
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  const [reached, setReached] = useState(reduce ? timeline.length : 0)
  useMotionValueEvent(scrollYProgress, "change", (p) => setReached(Math.ceil(p * timeline.length + 0.01)))
  return (
    <section className="relative border-y border-border bg-card/30">
      <div className="mx-auto max-w-4xl px-4 py-24">
        <SectionHead id="journey" kicker="05 · journey" title="Four years, five phases" />
        <ol ref={line} className="relative mt-10">
          <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-border" />
          <motion.span
            aria-hidden
            style={reduce ? undefined : { scaleY: draw }}
            className="absolute left-0 top-0 h-full w-px origin-top bg-gradient-to-b from-primary via-primary to-violet shadow-[0_0_8px_var(--primary)]"
          />
          {timeline.map((t, i) => (
            <Reveal as="li" key={t.period} delay={i * 80} className="relative pb-6 pl-8">
              <span className={`absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 transition-colors duration-300 ${i === open ? "border-primary bg-primary" : i < reached || reduce ? "border-primary bg-background" : "border-border bg-background"} ${i < reached && !reduce ? "scale-110" : ""}`} />
              {i === open && <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 animate-ping rounded-full bg-primary/40" />}
              <button onClick={() => setOpen(i === open ? -1 : i)} className="flex w-full items-center justify-between text-left">
                <div>
                  <div className="font-mono text-xs text-primary">{t.period}</div>
                  <div className="font-semibold">{t.title}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${i === open ? "rotate-180" : ""}`} />
              </button>
              {i === open && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {t.points.map((p, j) => (
                    <li key={p} className="animate-in fade-in slide-in-from-left-2 fill-mode-both" style={{ animationDelay: `${j * 80}ms` }}>
                      → {p}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Skills() {
  const reduce = useReducedMotion()
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
      <motion.div layout className="mt-6 flex min-h-24 flex-wrap content-start gap-3">
        <AnimatePresence mode="popLayout">
          {skills[cat].map((s, i) => {
            // Deterministic scatter per chip so each one flies in from its own spot.
            const h = [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)
            return (
              <motion.span
                key={cat + s}
                layout
                initial={reduce ? false : { opacity: 0, x: (h % 120) - 60, y: ((h * 7) % 80) - 40, rotate: (h % 24) - 12, scale: 0.6 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: i * 0.04 }}
                whileHover={{ y: -3, borderColor: "var(--primary)" }}
                className="rounded-lg border border-border bg-card/70 px-4 py-2 text-sm"
              >
                {s}
              </motion.span>
            )
          })}
        </AnimatePresence>
      </motion.div>
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
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-8 flex items-center gap-4 rounded-lg border border-primary/40 bg-primary/10 p-4 font-mono text-sm"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <motion.circle cx="12" cy="12" r="10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
            <motion.path d="M7 12.5l3.2 3.2L17 9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.45 }} />
          </svg>
          message delivered. I&apos;ll reply soon.
        </motion.div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input required maxLength={100} name="name" placeholder="Name" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <input required maxLength={254} type="email" name="email" placeholder="Email" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <textarea required maxLength={5000} name="message" rows={5} placeholder="Message" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button disabled={state === "sending"} className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-wait">
            {state === "sending" ? (
              <>
                {/* Envelope flies across leaving a trail while the request is in flight. */}
                <motion.span
                  className="absolute top-1/2 -translate-y-1/2"
                  initial={{ left: "-10%" }}
                  animate={{ left: "105%" }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="absolute right-full top-1/2 h-px w-16 -translate-y-1/2 bg-gradient-to-r from-transparent to-primary-foreground/70" />
                  <Mail className="h-4 w-4" />
                </motion.span>
                <span className="opacity-0">Send message</span>
                <span className="sr-only">Sending…</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" /> Send message
              </>
            )}
          </button>
          {state === "error" && <p className="text-sm text-danger">Couldn't send right now. Please try again later.</p>}
        </form>
      )}
    </section>
  )
}
