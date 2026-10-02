"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Braces, FileSearch, Fingerprint, Grid3x3, Languages, Regex, ShieldCheck, Waves } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { RuleTranslator } from "@/components/rule-lab"
import { NoiseAnalyser } from "@/components/noise-analyser"
import { AttackHeatmap } from "@/components/attack-heatmap"
import { Logtest } from "@/components/logtest"
import { FieldExtractor } from "@/components/field-extractor"
import { RegexTester } from "@/components/regex-tester"
import { IocHelper } from "@/components/ioc-helper"
import { EASE } from "@/components/motion"
import { labTools, type LabToolId } from "@/lib/lab/tools"

const icons = { translator: Languages, noise: Waves, attack: Grid3x3, logtest: FileSearch, extract: Braces, regex: Regex, ioc: Fingerprint }
const views: Record<LabToolId, () => React.ReactElement> = {
  translator: RuleTranslator,
  noise: NoiseAnalyser,
  attack: AttackHeatmap,
  logtest: Logtest,
  extract: FieldExtractor,
  regex: RegexTester,
  ioc: IocHelper,
}

export default function LabPage() {
  const [tool, setTool] = useState<LabToolId>("translator")
  // ?tool=… keeps each tool linkable without a server round trip.
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tool")
    if (t && t in views) setTool(t as LabToolId)
  }, [])
  const choose = (t: LabToolId) => {
    setTool(t)
    history.replaceState(null, "", `/lab?tool=${t}`)
  }
  const meta = labTools.find((t) => t.id === tool)!
  const View = views[tool]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,var(--grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" /> cyberskope<span className="text-primary">_</span>
            <span className="text-muted-foreground">/lab</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#lab" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> portfolio
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">lab · runs in your browser, nothing is uploaded</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Detection engineering tools</h1>

        <div role="tablist" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {labTools.map((t) => {
            const Icon = icons[t.id]
            const on = t.id === tool
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => choose(t.id)}
                className={`relative rounded-xl border p-3 text-left transition md:p-4 ${on ? "border-primary" : "border-border hover:border-primary/50"}`}
              >
                {on && <motion.span layoutId="lab-tab" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ duration: 0.4, ease: EASE }} />}
                <span className="relative flex items-center gap-2 font-semibold">
                  <Icon className={`h-4 w-4 ${on ? "text-primary" : "text-muted-foreground"}`} /> {t.name}
                </span>
                <span className="relative mt-1 hidden text-xs text-muted-foreground sm:block">{t.short}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={tool}
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mt-8"
          >
            <p className="mb-5 max-w-3xl text-muted-foreground">{meta.long}</p>
            <View />
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  )
}
