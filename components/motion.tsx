"use client"

// Scroll-linked motion in the style of Apple product pages: things are driven
// by scroll position (not timers), use springs rather than linear easing, and
// everything degrades to static content under prefers-reduced-motion.

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { useReducedMotion } from "@/components/use-reduced-motion"

const EASE = [0.16, 1, 0.3, 1] as const // expo-out, the curve Apple uses for reveals

/** Fades, lifts and un-blurs children the first time they enter the viewport. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: "div" | "li"
}) {
  const reduce = useReducedMotion()
  const Comp = as === "li" ? motion.li : motion.div
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay: delay / 1000 }}
    >
      {children}
    </Comp>
  )
}

/** Headline that rises out of a mask, word by word. */
export function MaskText({
  text, className = "", delay = 0, play = true,
}: { text: string; className?: string; delay?: number; play?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <span aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          {/* Styling goes on the moving span: background-clip text effects don't reach nested layers. */}
          <motion.span
            className={`inline-block ${className}`}
            initial={reduce ? false : { y: "110%" }}
            animate={play ? { y: "0%" } : undefined}
            transition={{ duration: 1, ease: EASE, delay: delay + i * 0.08 }}
          >
            {w}
            {i < text.split(" ").length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Thin progress bar for the header, driven by a spring on page scroll. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      style={{ scaleX }}
      className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-primary to-violet"
    />
  )
}

/** Id of the section currently nearest the top of the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: "-30% 0px -60% 0px" },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return active
}

/** Pointer-following highlight: sets --mx/--my on the element for a CSS radial gradient. */
export function spotlight(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`)
}

/**
 * The Apple "words light up as you read" block: a tall section whose text is
 * pinned while scroll progress fills each word from dim to full colour.
 */
export function ScrollText({ text, accent = [] }: { text: string; accent?: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const words = text.split(" ")
  return (
    <div ref={ref} className={reduce ? "" : "relative h-[220vh]"}>
      <div className={reduce ? "py-24" : "sticky top-0 flex h-screen items-center"}>
        <p className="mx-auto max-w-5xl px-4 text-3xl font-semibold leading-tight tracking-tight md:text-6xl">
          {words.map((w, i) => (
            <Word
              key={i}
              progress={scrollYProgress}
              range={[i / words.length * 0.85, (i + 1) / words.length * 0.85]}
              accent={accent.includes(w.replace(/[.,]/g, ""))}
              still={!!reduce}
            >
              {w}
            </Word>
          ))}
        </p>
      </div>
    </div>
  )
}

function Word({
  children, progress, range, accent, still,
}: { children: string; progress: MotionValue<number>; range: [number, number]; accent: boolean; still: boolean }) {
  const opacity = useTransform(progress, range, [0.15, 1])
  return (
    <motion.span style={still ? undefined : { opacity }} className={`mr-[0.25em] inline-block ${accent ? "text-gradient" : ""}`}>
      {children}
    </motion.span>
  )
}

/** Progress (0..1) of an element passing through the viewport, for scroll-linked transforms. */
export function useSectionProgress(offset: ["start end" | "start start", "end start" | "end end" | "center center"] = ["start end", "end start"]) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset })
  return { ref, progress: scrollYProgress }
}

/** Card that scales and rises into place as it scrolls up, like Apple feature tiles. */
export function ScrollScale({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const { ref, progress } = useSectionProgress(["start end", "center center"])
  const scale = useTransform(progress, [0, 1], [0.86, 1])
  const y = useTransform(progress, [0, 1], [80, 0])
  const opacity = useTransform(progress, [0, 0.5], [0, 1])
  return (
    <motion.div ref={ref} style={reduce ? undefined : { scale, y, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

/** Calls fn with the index of the step whose share of the pinned scroll range is active. */
export function useScrollStep(progress: MotionValue<number>, steps: number, fn: (i: number) => void) {
  useMotionValueEvent(progress, "change", (v) => fn(Math.min(steps - 1, Math.max(0, Math.floor(v * steps)))))
}

export { motion, useReducedMotion, useScroll, useTransform, useSpring, EASE }
