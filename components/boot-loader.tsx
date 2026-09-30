"use client"

// First-visit boot sequence: a short terminal-style loader that lifts away like
// a curtain. Shown once per browser session and skipped for reduced motion.
// The page underneath is already rendered, so nothing waits on it for SEO.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ShieldCheck } from "lucide-react"

const LINES = [
  "mounting read-only session",
  "loading decoders and rules",
  "diffing against baseline",
  "agent ready · no external calls",
]
const KEY = "cyberskope-booted"
const BootContext = createContext(true)

/** True once the loader has gone (or was skipped). Use it to time entrance animations. */
export const useBooted = () => useContext(BootContext)

export function BootProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(true)
  const [booted, setBooted] = useState(false)
  const [line, setLine] = useState(0)

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(KEY) === "1"
    } catch {}
    if (seen || reduce) {
      setShow(false)
      setBooted(true)
      return
    }
    const step = setInterval(() => setLine((l) => Math.min(l + 1, LINES.length)), 260)
    const done = setTimeout(() => {
      setShow(false)
      try {
        sessionStorage.setItem(KEY, "1")
      } catch {}
    }, 260 * LINES.length + 350)
    return () => {
      clearInterval(step)
      clearTimeout(done)
    }
  }, [reduce])

  return (
    <BootContext.Provider value={booted}>
      {children}
      <AnimatePresence onExitComplete={() => setBooted(true)}>
        {show && (
          <motion.div
            key="boot"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            initial={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            aria-hidden
          >
            <div className="w-72 font-mono text-xs">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-5 w-5 text-primary" /> cyberskope<span className="animate-pulse text-primary">_</span>
              </div>
              <ul className="space-y-1.5">
                {LINES.map((l, i) => (
                  <li
                    key={l}
                    className={`flex gap-2 transition-all duration-300 ${i < line ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                  >
                    <span className="text-primary">[ ok ]</span>
                    <span className="text-muted-foreground">{l}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 h-px w-full overflow-hidden bg-border">
                <motion.div
                  className="h-full origin-left bg-gradient-to-r from-primary to-violet"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: line / LINES.length }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BootContext.Provider>
  )
}
